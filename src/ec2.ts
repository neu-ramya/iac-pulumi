import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Vpc } from "@pulumi/aws/ec2";
import { Subnet } from "@pulumi/aws/ec2/subnet";
let pulumiConfig = new pulumi.Config("pulumi");

export async function createEnvFile(dbhost: pulumi.Output<string>, fileName: string) {
  const userData = `#!/bin/bash
touch ${fileName}
echo "DB_CONNECTION=mysql" >> ${fileName}
echo "DB_HOST=${dbhost}" >> ${fileName}
echo "DB_PORT=3306" >> ${fileName}
echo "DB_DATABASE=csye6225" >> ${fileName}
echo "DB_USER=webapp-csye6225" >> ${fileName}
echo "DB_PASS=webapp-csye6225" >> ${fileName}
echo "PROF_TABLES=false" >> ${fileName}`;
return userData;
}

export async function emptySecurityGroup(vpc: Vpc, name: string) {
  const securityGroup = new aws.ec2.SecurityGroup(name, {
    vpcId: vpc.id,
  });

  return securityGroup;
}

export async function addCIDRSecurityGroupRule(
  name: string,
  protocol: string,
  targetSecurityGroupId: pulumi.Output<string>,
  fromPort: number,
  toPort: number,
  type: string,
  cidrBlock: string
) {
  new aws.ec2.SecurityGroupRule(name, {
    type: type,
    description: name,
    fromPort: fromPort,
    toPort: toPort,
    protocol: protocol,
    cidrBlocks: [cidrBlock],
    securityGroupId: targetSecurityGroupId,
  });
}

export async function addSecurityGroupRule(
  name: string,
  protocol: string,
  targetSecurityGroupId: pulumi.Output<string>,
  srcSecurityGroupId: pulumi.Output<string>,
  fromPort: number,
  toPort: number,
  type: string
) {
  new aws.ec2.SecurityGroupRule(name, {
    type: type,
    description: name,
    fromPort: fromPort,
    toPort: toPort,
    protocol: protocol,
    securityGroupId: targetSecurityGroupId,
    sourceSecurityGroupId: srcSecurityGroupId,
  });
}

export async function ami(owners: [string], nameRegex: string) {
  const ami = pulumi.output(
    aws.ec2.getAmi({
      mostRecent: true,
      owners: owners,
      nameRegex: nameRegex,
      filters: [
        {
          name: "is-public",
          values: ["false"],
        },
      ],
    })
  );
  return ami;
}

export async function ec2Instance(
  name: string,
  amiId: pulumi.Output<string>,
  securityGroup: pulumi.Input<string>,
  publicSubnet: Subnet,
  userData: string
) {
  const instance = new aws.ec2.Instance(name, {
    ami: amiId,
    keyName: pulumiConfig.require("keyPairName"),
    instanceType: pulumiConfig.require("ec2Type"),
    subnetId: publicSubnet.id,
    vpcSecurityGroupIds: [securityGroup],
    userData: userData, 
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
  ami: ami,
  ec2Instance: ec2Instance,
  addCIDRSecurityGroupRule: addCIDRSecurityGroupRule,
  addSecurityGroupRule: addSecurityGroupRule,
  emptySecurityGroup: emptySecurityGroup,
  createEnvFile: createEnvFile
};
