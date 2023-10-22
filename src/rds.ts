import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Subnet } from "@pulumi/aws/ec2/subnet";
import { ParameterGroup } from "@pulumi/aws/rds/parameterGroup";
import { SubnetGroup } from "@pulumi/aws/rds/subnetGroup";

export async function createRDSparametergroup() {
  const csyeParameterGroup = new aws.rds.ParameterGroup(
    "mariadb-parameter-group",
    {
      family: "mariadb10.6",
    }
  );
  return csyeParameterGroup;
}

export async function createSubnetGroup(privateSubnet: Subnet[]){
    const rdsSubnetGroup = new aws.rds.SubnetGroup("rds-subnet-group", {
        subnetIds: [
            privateSubnet[0].id,
            privateSubnet[1].id,
            privateSubnet[2].id,
        ]
    });
    return rdsSubnetGroup;
}

export async function createRDSinstance(
  subnetGroup: SubnetGroup ,
  rdsparametergroup: ParameterGroup,
  securityGroup: pulumi.Input<string>
) {
  const _default = new aws.rds.Instance("default", {
    allocatedStorage: 10,
    dbName: "csye6225",
    identifier: "csye6225",
    instanceClass: "db.t3.micro",
    engine: "mariadb",
    multiAz: false,
    dbSubnetGroupName: subnetGroup.name,
    publiclyAccessible: false,
    skipFinalSnapshot: true,
    parameterGroupName: rdsparametergroup.name,
    password: "foobarbaz",
    username: "foo",
    vpcSecurityGroupIds: [securityGroup]
  });
}

module.exports = {
  createRDSinstance: createRDSinstance,
  createRDSparametergroup: createRDSparametergroup,
  createSubnetGroup: createSubnetGroup
};
