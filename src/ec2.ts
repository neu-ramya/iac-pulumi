import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Vpc } from "@pulumi/aws/ec2";
import { Subnet } from "@pulumi/aws/ec2/subnet";
let pulumiConfig = new pulumi.Config("pulumi");


export async function securityGroup(vpc: Vpc, ipAddress: string, name: string) {
  const securityGroup = new aws.ec2.SecurityGroup(name,
    {
      description: "Allow TLS inbound traffic",
      vpcId: vpc.id,
      ingress: [
        {
          description: "SSH from VPC",
          fromPort: parseInt(pulumiConfig.require("SSHport")),
          toPort: parseInt(pulumiConfig.require("SSHport")),
          protocol: "tcp",
          cidrBlocks: [ipAddress],
        },
        {
          description: "HTTP from VPC",
          fromPort: parseInt(pulumiConfig.require("HTTPport")),
          toPort: parseInt(pulumiConfig.require("HTTPport")),
          protocol: "tcp",
          cidrBlocks: [ipAddress],
        },
        {
          description: "TLS from VPC",
          fromPort: parseInt(pulumiConfig.require("HTTPSport")),
          toPort: parseInt(pulumiConfig.require("HTTPSport")),
          protocol: "tcp",
          cidrBlocks: [ipAddress],
        },
        {
          description: "Application port",
          fromPort: parseInt(pulumiConfig.require("Appport")),
          toPort: parseInt(pulumiConfig.require("Appport")),
          protocol: "tcp",
          cidrBlocks: [ipAddress],
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
        Name: name,
      },
    }
  );
  return securityGroup;
}

export async function ami(owners: [string] , nameRegex: string) {
    const ami = pulumi.output(
        aws.ec2.getAmi({
          mostRecent: true,
          owners: owners,
          nameRegex: nameRegex,
          filters: [
            {
                name: "is-public",
                values: ["false"]
            },
          ]
        })
      );
      return ami;
}

export async function ec2Instance(name: string, amiId: pulumi.Output<string>, securityGroup: pulumi.Input<string>, publicSubnet: Subnet) {
    const instance = new aws.ec2.Instance(name, {
        ami: amiId,
        keyName: pulumiConfig.require("keyPairName"), 
        instanceType: pulumiConfig.require("ec2Type"),
        subnetId: publicSubnet.id,
        vpcSecurityGroupIds: [securityGroup],
        tags: {
          Name: name,
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

      return instance;
}


module.exports = {
    securityGroup: securityGroup,
    ami: ami,
    ec2Instance: ec2Instance
}