import * as pulumi from "@pulumi/pulumi";
import * as ec2 from "./ec2";
import * as routing from "./routing";
import * as networking from "./networking";
import * as rds from "./rds";
import * as scaling from "./scaling";
import * as sns from "./sns";
import * as lambda from "./lambda";
import * as aws from "@pulumi/aws";

let pulumiConfig = new pulumi.Config("pulumi");
let awsConfig = new pulumi.Config("aws");

async function main() {
//   // let vpcCidr = pulumiConfig.require("vpcCIDRblock");
//   // let pubRouteName = pulumiConfig.require("publicRouteName");
//   // let vpcName = pulumiConfig.require("vpcName");
//   // let ec2Name = pulumiConfig.require("ec2Name");
//   // let igName = pulumiConfig.require("internetGatewayName");
//   // let igAttachmentName = pulumiConfig.require("internetGatewayAttachmentName");
//   // let vpcOwnerTag = pulumiConfig.require("ownerTag");
//   // let pubRTName = pulumiConfig.require("publicRouteTableName");
//   // let privRTName = pulumiConfig.require("privateRouteTableName");
//   // let sgName = pulumiConfig.require("sgName");

//   // let sshPort = pulumiConfig.require("SSHport");
//   // let appPort = pulumiConfig.require("Appport");
//   // let httpPort = pulumiConfig.require("HTTPport");
//   // let httpsPort = pulumiConfig.require("HTTPSport");
//   // let openCIDRblock = pulumiConfig.require("openCIDRblock");
//   // let allPort = pulumiConfig.require("allPort");

//   // let AMIShareUsers = pulumiConfig.require("AMIShareUsers");
//   // let AMIFilterRegex = pulumiConfig.require("AMISelectorRegex");

//   // const myIpAddress = process.env.MY_IP_ADDRESS;
//   // if (myIpAddress === undefined) {
//   //   throw new Error("Environment variable MY_IP_ADDRESS is not set.");
//   // }
//   // const ipAddressAsString: string = myIpAddress;

//   // let vpc = await networking.vpc(vpcName, vpcCidr, vpcOwnerTag);
//   // let subnet = await networking.subnets(vpc);
//   // let ig = await networking.internetGateway(igName, igAttachmentName, vpc);
//   // networking.routing(pubRTName, privRTName, pubRouteName, vpc, ig);

//   // let ami = await ec2.ami([AMIShareUsers], AMIFilterRegex);

//   // let lbSecurityGroup = await ec2.emptySecurityGroup(vpc, "loadBalancerSecurityGroup");

//   // await ec2.addCIDRSecurityGroupRule(
//   //   "HTTP Port",
//   //   "tcp",
//   //   lbSecurityGroup.id,
//   //   httpPort,
//   //   httpPort,
//   //   "ingress",
//   //   openCIDRblock
//   // );
//   // await ec2.addCIDRSecurityGroupRule(
//   //   "HTTPS Port",
//   //   "tcp",
//   //   lbSecurityGroup.id,
//   //   httpsPort,
//   //   httpsPort,
//   //   "ingress",
//   //   openCIDRblock
//   // );
//   // await ec2.addCIDRSecurityGroupRule(
//   //   "lbOutbound",
//   //   "-1",
//   //   lbSecurityGroup.id,
//   //   allPort,
//   //   allPort,
//   //   "egress",
//   //   openCIDRblock
//   // );

//   // let ec2SecurityGroup = await ec2.emptySecurityGroup(vpc, sgName);
  
//   // await ec2.addCIDRSecurityGroupRule(
//   //   "SSH Port",
//   //   "tcp",
//   //   ec2SecurityGroup.id,
//   //   sshPort,
//   //   sshPort,
//   //   "ingress",
//   //   ipAddressAsString
//   // );

//   // await ec2.addSecurityGroupRule(
//   //   pulumiConfig.require("sgName")+"app",
//   //   "tcp",
//   //   ec2SecurityGroup.id,
//   //   lbSecurityGroup.id,
//   //   appPort,
//   //   appPort,
//   //   "ingress"
//   // );

//   // await ec2.addCIDRSecurityGroupRule(
//   //   "Outbound",
//   //   "-1",
//   //   ec2SecurityGroup.id,
//   //   allPort,
//   //   allPort,
//   //   "egress",
//   //   openCIDRblock
//   // );

//   // let rdspg = await rds.createRDSparametergroup();
//   // let rdssubnet = await rds.createSubnetGroup(subnet[1]);
//   // let rdsSecurityGroup = await ec2.emptySecurityGroup(
//   //   vpc,
//   //   pulumiConfig.require("rdsSecurityGroupName")
//   // );

//   // await ec2.addSecurityGroupRule(
//   //   pulumiConfig.require("rdsSecurityGroupName"),
//   //   "-1",
//   //   rdsSecurityGroup.id,
//   //   ec2SecurityGroup.id,
//   //   allPort,
//   //   allPort,
//   //   "ingress"
//   // );

//   // await ec2.addSecurityGroupRule(
//   //   pulumiConfig.require("rdsSecurityGroupName")+"egress",
//   //   "-1",
//   //   rdsSecurityGroup.id,
//   //   ec2SecurityGroup.id,
//   //   allPort,
//   //   allPort,
//   //   "egress"
//   // );
  
//   // let rdsinstance = await rds.createRDSinstance(
//   //   rdssubnet,
//   //   rdspg,
//   //   rdsSecurityGroup.id
//   // );

//   // pulumi.all([rdsinstance.address]).apply(async ([serverName]) => {
//   //   let env = await ec2.createEnvFile(serverName, "/opt/csye6225/.env");
//   //   // let env = await ec2.createEnvFile("localhost", "/opt/csye6225/.env");

//   //   let cloudWatchRole = await ec2.cloudWatchRole();
//   //   let instanceProfile = await ec2.instanceprofile(cloudWatchRole);
//   //   let autoScalingGroup= await scaling.createautoScaling(ami.id, env, instanceProfile, ec2SecurityGroup.id, subnet);
//   //   const targetGroup = await scaling.createTargetGroup(vpc);

//   //   let alb = await scaling.createLoadBalancer(lbSecurityGroup, subnet[0], targetGroup);
//   //   let asAttach = await scaling.autoScalingAttach(autoScalingGroup, targetGroup);
//   //   let scaleUpPolicy = await scaling.asUpPolicy(autoScalingGroup);
//   //   let scaleDownPolicy = await scaling.asDownPolicy(autoScalingGroup);
//   //   let cpuUsageUpAlert = await scaling.cpuUsageUpAlert(autoScalingGroup, scaleUpPolicy);
//   //   let cpuUsageDownAlert = await scaling.cpuUsageDownAlert(autoScalingGroup, scaleDownPolicy);
    
//   //   await routing.createAliasARecord(alb,awsConfig.require("profile"));
//   // });
  let snsTopic = await sns.createSnsTopic();
  let lambdaFunction = await lambda.createLambda();

  const snsSubscription = pulumi.all([snsTopic.arn, lambdaFunction.arn]).apply(
    ([topicArn, lambdaArn]) => { sns.createSnsSubscription(topicArn, lambdaArn)}
  );

  await lambda.setPermission(lambdaFunction, snsTopic)
  await lambda.createDynamoTable();
}

main();
