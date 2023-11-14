import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Subnet } from "@pulumi/aws/ec2/subnet";
import { Vpc } from "@pulumi/aws/ec2/vpc";
import { InternetGateway } from "@pulumi/aws/ec2/internetGateway";

let pulumiConfig = new pulumi.Config("pulumi");
let publicSubnetArray: Subnet[] = [];
let privateSubnetArray: Subnet[] = [];

export async function vpc(name: string, cidr: string, ownerTag: string) {
  const vpc = new aws.ec2.Vpc(name, {
    cidrBlock: cidr,
    instanceTenancy: "default",
    tags: {
      Name: name,
      Owner: ownerTag,
    },
  });

  return vpc;
}
export async function getAvailabilityZone() {
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

  return availableAZs.names?.slice(0, numAZsToCreate);
}

export async function subnets(vpc: Vpc) {
  const availableAZs = await aws.getAvailabilityZones({
    state: "available",
  });

  const selectedAZs = await getAvailabilityZone();
  let i = 0;
  for (const az of selectedAZs) {
    const publicSubnet = new aws.ec2.Subnet(`${az}-public-subnet`, {
      vpcId:vpc.id,
      availabilityZone: az,
      cidrBlock:  pulumi.output(pulumiConfig.requireObject("publicSubnetCIDRblock"))[i],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: "public-subnet",
        Owner: pulumiConfig.require("ownerTag"),
      },
    });

    const privateSubnet = new aws.ec2.Subnet(`${az}-private-subnet`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: pulumi.output(pulumiConfig.requireObject("privateSubnetCIDRblock"))[i],
      tags: {
        Name: "private-subnet",
        Owner: pulumiConfig.require("ownerTag"),
      },
    });
    i += 1;
    publicSubnetArray.push(publicSubnet);
    privateSubnetArray.push(privateSubnet);
  }

  return [publicSubnetArray, privateSubnetArray];
}

export async function internetGateway(name: string, igAttachmentName: string, vpc: Vpc) {
  const internetGateway = new aws.ec2.InternetGateway(
    name,
    {
      tags: {
        Name: `ig-${pulumiConfig.require("ownerTag")}`,
        Owner: pulumiConfig.require("ownerTag"),
      },
    }
  );

  new aws.ec2.InternetGatewayAttachment(
    igAttachmentName,
    {
      vpcId: vpc.id,
      internetGatewayId: internetGateway.id,
    }
  );

  return internetGateway;
}

export async function routing(publicRtTableName: string, privRtTableName: string, pubRtName: string, vpc: Vpc, internetGateway: InternetGateway) {
  const publicRouteTable = new aws.ec2.RouteTable(
    publicRtTableName,
    {
      vpcId: vpc.id,
      tags: {
        Name: publicRtTableName,
        Owner: pulumiConfig.require("ownerTag"),
      },
    }
  );

  const privateRouteTable = new aws.ec2.RouteTable(
    privRtTableName,
    {
      vpcId: vpc.id,
      tags: {
        Name: privRtTableName,
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

  new aws.ec2.Route(pubRtName, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: pulumiConfig.require("openCIDRblock"),
    gatewayId: internetGateway.id,
  });
}

module.exports = {
  vpc: vpc,
  subnets: subnets,
  internetGateway: internetGateway,
  routing: routing,
  getAvailabilityZone: getAvailabilityZone
}
