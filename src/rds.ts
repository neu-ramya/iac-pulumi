import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Subnet } from "@pulumi/aws/ec2/subnet";
import { ParameterGroup } from "@pulumi/aws/rds/parameterGroup";
import { SubnetGroup } from "@pulumi/aws/rds/subnetGroup";
let pulumiConfig = new pulumi.Config("pulumi");

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
  const privateSubnetIDs = privateSubnet.flatMap(subnet => subnet.id)
  const rdsSubnetGroup = new aws.rds.SubnetGroup(pulumiConfig.require("rdsSubnetName"), {
      subnetIds: privateSubnetIDs
  });

  return rdsSubnetGroup;
}

export async function createRDSinstance(subnetGroup: SubnetGroup, rdsparametergroup: ParameterGroup, securityGroup: pulumi.Input<string>) {
  const rdsInstance = new aws.rds.Instance(pulumiConfig.require("rdsName"), {
    allocatedStorage: parseInt(pulumiConfig.require("rdsStorage")),
    dbName: pulumiConfig.require("dbName"),
    identifier: pulumiConfig.require("rdsName"),
    instanceClass:pulumiConfig.require("rdsInstanceClass"),
    engine: pulumiConfig.require("rdsEngineType"),
    multiAz: false,
    dbSubnetGroupName: subnetGroup.name,
    publiclyAccessible: false,
    skipFinalSnapshot: true,
    parameterGroupName: rdsparametergroup.name,
    password: pulumiConfig.require("rdsPassword"),
    username: pulumiConfig.require("rdsUsername"),
    vpcSecurityGroupIds: [securityGroup],
    tags: {
      Name: pulumiConfig.require("rdsName"),
    }
  });
  return rdsInstance;
}

module.exports = {
  createRDSinstance: createRDSinstance,
  createRDSparametergroup: createRDSparametergroup,
  createSubnetGroup: createSubnetGroup,
};
