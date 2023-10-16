import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import ec2 from "./ec2";

async function main() {
  let pulumiConfig = new pulumi.Config("pulumi");

  const vpc = new aws.ec2.Vpc(pulumiConfig.require("vpcName"), {
    cidrBlock: pulumiConfig.require("vpcCIDRblock"),
    instanceTenancy: "default",
    tags: {
      Name: "vpc-csye6225",
      Owner: pulumiConfig.require("ownerTag"),
    },
  });

  const numberOfAZsToSelect = 3;
  let numAZsToCreate;

  const availableAZs = await aws.getAvailabilityZones({
    state: "available",
  });

  const numAZs = availableAZs.names.length;
  if (numAZs > numberOfAZsToSelect) {
    numAZsToCreate = numberOfAZsToSelect;
  } else {
    numAZsToCreate = numAZs;
  }

  const selectedAZs = availableAZs.names?.slice(0, numAZsToCreate);
  let publicSubnetArray = [];
  let privateSubnetArray = [];
  let i = 1;
  for (const az of selectedAZs) {
    const publicSubnet = new aws.ec2.Subnet(`${az}-public-subnet`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: pulumiConfig.require(`publicSubnetCIDRblock-${i}`),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: "public-subnet",
        Owner: pulumiConfig.require("ownerTag"),
      },
    });

    const privateSubnet = new aws.ec2.Subnet(`${az}-private-subnet`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: pulumiConfig.require(`privateSubnetCIDRblock-${i}`),
      tags: {
        Name: "private-subnet",
        Owner: pulumiConfig.require("ownerTag"),
      },
    });
    i += 1;
    publicSubnetArray.push(publicSubnet);
    privateSubnetArray.push(privateSubnet);
  }

  const internetGateway = new aws.ec2.InternetGateway(
    pulumiConfig.require("internetGatewayName"),
    {
      tags: {
        Name: `ig-${pulumiConfig.require("ownerTag")}`,
        Owner: pulumiConfig.require("ownerTag"),
      },
    }
  );

  const internetGatewayAttachment = new aws.ec2.InternetGatewayAttachment(
    pulumiConfig.require("internetGatewayAttachmentName"),
    {
      vpcId: vpc.id,
      internetGatewayId: internetGateway.id,
    }
  );

  const publicRouteTable = new aws.ec2.RouteTable(
    pulumiConfig.require("publicRouteTable"),
    {
      vpcId: vpc.id,
      tags: {
        Name: "ramya-public-route-table",
        Owner: pulumiConfig.require("ownerTag"),
      },
    }
  );

  const privateRouteTable = new aws.ec2.RouteTable(
    pulumiConfig.require("privateRouteTable"),
    {
      vpcId: vpc.id,
      tags: {
        Name: "private-route-table",
        Owner: pulumiConfig.require("ownerTag"),
      },
    }
  );

  for (const pubSubnet of publicSubnetArray) {
    new aws.ec2.RouteTableAssociation(
      `public-subnet-association-${Math.floor(Math.random() * 1000) + 1}`,
      {
        subnetId: pubSubnet.id,
        routeTableId: publicRouteTable.id,
      }
    );
  }

  for (const privSubnet of privateSubnetArray) {
    new aws.ec2.RouteTableAssociation(
      `private-subnet-association-${Math.floor(Math.random() * 1000) + 1}`,
      {
        subnetId: privSubnet.id,
        routeTableId: privateRouteTable.id,
      }
    );
  }

  new aws.ec2.Route(pulumiConfig.require("publicRouteName"), {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: pulumiConfig.require("openCIDRblock"),
    gatewayId: internetGateway.id,
  });

  const myIpAddress = process.env.MY_IP_ADDRESS;
  if (myIpAddress === undefined) {
    throw new Error("Environment variable MY_IP_ADDRESS is not set.");
  }
  const ipAddressAsString: string = myIpAddress;

  const securityGroup = new aws.ec2.SecurityGroup(
    "application security group",
    {
      description: "Allow TLS inbound traffic",
      vpcId: vpc.id,
      ingress: [
        {
          description: "SSH from VPC",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [ipAddressAsString],
        },
        {
          description: "HTTP from VPC",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: [ipAddressAsString],
        },
        {
          description: "TLS from VPC",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: [ipAddressAsString],
        },
        {
          description: "Application port",
          fromPort: 3000,
          toPort: 3000,
          protocol: "tcp",
          cidrBlocks: [ipAddressAsString],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
      ],
      tags: {
        Name: "application security group",
      },
    }
  );

  const ami = pulumi.output(
    aws.ec2.getAmi({
      mostRecent: true,
      owners: ["042487768049"],
      nameRegex: "csye6225-debian12-[0-9]+",
    })
  );

  const instance = new aws.ec2.Instance("csye6225-ec2-pulumi", {
    ami: ami.id,
    instanceType: pulumiConfig.require("ec2Type"),
    subnetId: publicSubnetArray[0].id,
    vpcSecurityGroupIds: [securityGroup.id],
    tags: {
      Name: "csye6225-ec2-pulumi",
    },
    rootBlockDevice: {
      volumeSize: 25,
      volumeType: "gp2",
      deleteOnTermination: true,
    },
    ebsBlockDevices: [
      {
        deviceName: "/dev/sdb",
        volumeSize: 25,
        volumeType: "gp2",
        deleteOnTermination: true,
      },
    ],
  });

  module.exports = {
    instanceURL: pulumi.interpolate`http://${instance.publicIp}`,
  };
}

main();
// ec2();
