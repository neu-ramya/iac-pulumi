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

  let ec2SecurityGroup = await ec2.emptySecurityGroup(vpc, sgName);
  await ec2.addCIDRSecurityGroupRule("SSH Port", "tcp", ec2SecurityGroup.id, 22, 22, "ingress", ipAddressAsString)
  await ec2.addCIDRSecurityGroupRule("HTTP Port", "tcp", ec2SecurityGroup.id, 80, 80, "ingress", ipAddressAsString)
  await ec2.addCIDRSecurityGroupRule("HTTPS Port", "tcp",ec2SecurityGroup.id, 443, 443, "ingress", ipAddressAsString)
  await ec2.addCIDRSecurityGroupRule("Application Port", "tcp",ec2SecurityGroup.id, 3000, 3000, "ingress", ipAddressAsString)
  await ec2.addCIDRSecurityGroupRule("Outbound", "-1",ec2SecurityGroup.id, 0, 0, "egress", "0.0.0.0/0")
  
  let ami = await ec2.ami([AMIShareUsers], AMIFilterRegex);
  let instance = await ec2.ec2Instance(ec2Name, ami.id, ec2SecurityGroup.id, subnet[0][0]);
  
  let rdsSecurityGroup = await ec2.emptySecurityGroup(vpc, "EC2 security group");
  await ec2.addSecurityGroupRule("EC2 security group rule", "tcp", rdsSecurityGroup.id, ec2SecurityGroup.id, 3306, 3306, "ingress");
  await ec2.addCIDRSecurityGroupRule("Outbound", "-1",rdsSecurityGroup.id, 0, 0, "egress", "0.0.0.0/0")

  let rdspg = await rds.createRDSparametergroup();
  let rdssubnet = await rds.createSubnetGroup(subnet[1]);
  let rdsinstance = await rds.createRDSinstance(rdssubnet, rdspg, rdsSecurityGroup.id);
}

main();