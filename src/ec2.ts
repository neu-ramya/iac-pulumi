import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Vpc } from "@pulumi/aws/ec2";
import { Subnet } from "@pulumi/aws/ec2/subnet";
import { Role } from "@pulumi/aws/iam/role";
import { InstanceProfile } from "@pulumi/aws/iam/instanceProfile";
let pulumiConfig = new pulumi.Config("pulumi");

export async function createEnvFile(rdsInstance: string, fileName: string) {
  const userData = `#!/bin/bash
    touch ${fileName}

    echo "DB_HOST=${rdsInstance}" >> ${fileName}
    echo "DB_PORT=${pulumiConfig.require("dbPort")}" >> ${fileName}
    echo "DB_DATABASE=${pulumiConfig.require("dbName")}" >> ${fileName}
    echo "DB_USER=${pulumiConfig.require("rdsUserName")}" >> ${fileName}
    echo "DB_PASS=${pulumiConfig.require("rdsPassword")}" >> ${fileName}
    echo "PROF_TABLES=true" >> ${fileName}
    
    cp /home/admin/target/webapp.zip ${pulumiConfig.require("ec2AppUserHome")}
    unzip ${pulumiConfig.require("ec2AppUserHome")}/webapp.zip -d ${pulumiConfig.require("ec2AppUserHome")}
    
    cd ${pulumiConfig.require("ec2AppUserHome")}
    sudo rm -rf node_modules
    npm install
    chown -R  ${pulumiConfig.require("ec2AppUserName")}:${pulumiConfig.require("ec2AppUserGroupName")} *
    chown -R ${pulumiConfig.require("ec2AppUserName")}:${pulumiConfig.require("ec2AppUserGroupName")} .*
    chmod 666 .env
    sudo systemctl stop ${pulumiConfig.require("systemdUnitName")}
    sudo systemctl start ${pulumiConfig.require("systemdUnitName")}
    sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/cloudwatch-config.json -s
    `;  
  return userData;
}

export async function emptySecurityGroup(vpc: Vpc, name: string) {
  const securityGroup = new aws.ec2.SecurityGroup(name, {
    vpcId: vpc.id,
    tags: {
      Name: name,
    }
  });

  return securityGroup;
}

export async function addCIDRSecurityGroupRule(
  name: string,
  protocol: string,
  targetSecurityGroupId: pulumi.Output<string>,
  fromPort: string,
  toPort: string,
  type: string,
  cidrBlock: string
) {
  new aws.ec2.SecurityGroupRule(name, {
    type: type,
    description: name,
    fromPort: parseInt(fromPort),
    toPort: parseFloat(toPort),
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
  fromPort: string,
  toPort: string,
  type: string
) {
  new aws.ec2.SecurityGroupRule(name, {
    type: type,
    description: name,
    fromPort: parseInt(fromPort),
    toPort: parseInt(toPort),
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
  userData: string,
  instanceProfile: InstanceProfile
) {
  const instance = new aws.ec2.Instance(name, {
    ami: amiId,
    keyName: pulumiConfig.require("keyPairName"),
    instanceType: pulumiConfig.require("ec2Type"),
    subnetId: publicSubnet.id,
    vpcSecurityGroupIds: [securityGroup],
    userData: userData, 
    iamInstanceProfile: instanceProfile.name,
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

export async function cloudWatchRole(){
  const cloudWatchRole = new aws.iam.Role("cloudWatchRole", {
    managedPolicyArns: ["arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"],
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Sid: "",
          Principal: {
              Service: "ec2.amazonaws.com",
          },
      }],
  })
  //   assumeRolePolicy: JSON.stringify({
  //     Version: "2012-10-17",
  //     Statement: [
  //         {
  //             Effect: "Allow",
  //             Action: [
  //                 "cloudwatch:PutMetricData",
  //                 "ec2:DescribeVolumes",
  //                 "ec2:DescribeTags",
  //                 "logs:PutLogEvents",
  //                 "logs:DescribeLogStreams",
  //                 "logs:DescribeLogGroups",
  //                 "logs:CreateLogStream",
  //                 "logs:CreateLogGroup"
  //             ],
  //             Resource: "*"
  //         },
  //         {
  //             Effect: "Allow",
  //             Action: [
  //                 "ssm:GetParameter"
  //             ],
  //             Resource: "arn:aws:ssm:*:*:parameter/AmazonCloudWatch-*"
  //         }
  //     ]
  // }),
});
return cloudWatchRole;
}

export async function instanceprofile(cloudWatchRole: Role){
  const testProfile = new aws.iam.InstanceProfile("testProfile", {role: cloudWatchRole.name});
  return testProfile;
}


module.exports = {
  ami: ami,
  ec2Instance: ec2Instance,
  addCIDRSecurityGroupRule: addCIDRSecurityGroupRule,
  addSecurityGroupRule: addSecurityGroupRule,
  emptySecurityGroup: emptySecurityGroup,
  createEnvFile: createEnvFile,
  cloudWatchRole: cloudWatchRole,
  instanceprofile: instanceprofile,
};
