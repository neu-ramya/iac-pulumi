import * as pulumi from "@pulumi/pulumi";
import * as ec2 from "./ec2";
import * as networking from "./networking";
import * as rds from "./rds";
let pulumiConfig = new pulumi.Config("pulumi");

async function main() {
  let vpcCidr = pulumiConfig.require("vpcCIDRblock");
  let pubRouteName = pulumiConfig.require("publicRouteName")
  let vpcName = pulumiConfig.require("vpcName");
  let ec2Name = pulumiConfig.require("ec2Name");
  let igName = pulumiConfig.require("internetGatewayName");
  let igAttachmentName = pulumiConfig.require("internetGatewayAttachmentName");
  let vpcOwnerTag = pulumiConfig.require("ownerTag");
  let pubRTName = pulumiConfig.require("publicRouteTableName");
  let privRTName = pulumiConfig.require("privateRouteTableName");
  let sgName = pulumiConfig.require("sgName");

  let AMIShareUsers = pulumiConfig.require("AMIShareUsers");
  let AMIFilterRegex = pulumiConfig.require("AMISelectorRegex");

  const myIpAddress = process.env.MY_IP_ADDRESS;
  if (myIpAddress === undefined) {
    throw new Error("Environment variable MY_IP_ADDRESS is not set.");
  }
  const ipAddressAsString: string = myIpAddress;

  let vpc = await networking.vpc(vpcName, vpcCidr, vpcOwnerTag);
  let subnet = await networking.subnets(vpc);
  let ig = await networking.internetGateway(igName, igAttachmentName, vpc);
  networking.routing(pubRTName, privRTName, pubRouteName, vpc, ig);

  // let sg = await ec2.securityGroup(vpc, ipAddressAsString, sgName);
  // let ami = await ec2.ami([AMIShareUsers], AMIFilterRegex)
  // let instance = await ec2.ec2Instance(ec2Name, ami.id, sg.id, subnet[0][0])
  
  let rdspg = await rds.createRDSparametergroup();
  
  let rdssubnet = await rds.createSubnetGroup(subnet[1][0]);
  let rdsinstance = await rds.createRDSinstance(rdssubnet, rdspg);
}

main();