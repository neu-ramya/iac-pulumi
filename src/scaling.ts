import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { InstanceProfile } from "@pulumi/aws/iam/instanceProfile";
import { Group } from "@pulumi/aws/autoscaling/group";
import { Topic } from "@pulumi/aws/sns/topic";
import { SecurityGroup } from "@pulumi/aws/ec2/securityGroup";
import { Subnet } from "@pulumi/aws/ec2/subnet";
import { Vpc } from "@pulumi/aws/ec2/vpc";
import { TargetGroup } from "@pulumi/aws/lb/targetGroup";
let pulumiConfig = new pulumi.Config("pulumi");

export async function createautoScaling(
  amiId: pulumi.Output<string>,
  userData: string,
  roleProfile: InstanceProfile,
  ec2SG: pulumi.Output<string>,
  subnet: Subnet[][]
) {
  const encodedUserData = pulumi
    .output(userData)
    .apply((data) => Buffer.from(data).toString("base64"));

  const asTemplate = new aws.ec2.LaunchTemplate("csye-launch-template", {
    namePrefix: "csye-6225-launch-template",
    imageId: amiId,
    instanceType: "t2.micro",
    keyName: pulumiConfig.require("keyPairName"),
    networkInterfaces: [
      {
        securityGroups: [ec2SG],
        subnetId: subnet[0][0].id,
      },
    ],
    userData: encodedUserData,
    iamInstanceProfile: {
      arn: roleProfile.arn,
    },
  });

  const asGroup = new aws.autoscaling.Group("csye-auto-scaling-group", {
    desiredCapacity: 1,
    maxSize: 3,
    minSize: 1,
    defaultCooldown: 60,
    launchTemplate: {
      id: asTemplate.id,
      version: "$Latest",
    },
    tags: [
      {
        key: "Environment",
        value: "Production",
        propagateAtLaunch: true,
      },
    ],
  });
  return asGroup;
}

export async function asUpPolicy(asGroup: Group) {
  const scaleUpPolicy = new aws.autoscaling.Policy("scaleUpPolicy", {
    scalingAdjustment: 1,
    adjustmentType: "ChangeInCapacity",
    cooldown: 60,
    autoscalingGroupName: asGroup.name,
  });

  return scaleUpPolicy;
}

export async function asDownPolicy(asGroup: Group) {
  const scaleDownPolicy = new aws.autoscaling.Policy("scaleDownPolicy", {
    scalingAdjustment: -1,
    adjustmentType: "ChangeInCapacity",
    cooldown: 60,
    autoscalingGroupName: asGroup.name,
  });
  return scaleDownPolicy;
}

export async function cpuUsageUpAlert(
  autoScalingGroup: Group,
  scaleUpPolicy: { arn: pulumi.Input<string | Topic> }
) {
  const cpuUtilizationAlarmHigh = new aws.cloudwatch.MetricAlarm(
    "csye-cpuUtilizationHigh",
    {
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 100,
      threshold: 5,
      statistic: "Average",
      dimensions: { AutoScalingGroupName: autoScalingGroup.name },
      alarmActions: [scaleUpPolicy.arn],
    }
  );
  return cpuUtilizationAlarmHigh;
}

export async function cpuUsageDownAlert(
  autoScalingGroup: Group,
  scaleDownPolicy: { arn: pulumi.Input<string | Topic> }
) {
  const cpuUtilizationAlarmLow = new aws.cloudwatch.MetricAlarm(
    "csye-cpuUtilizationLow",
    {
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 1,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 100,
      threshold: 3,
      statistic: "Average",
      dimensions: { AutoScalingGroupName: autoScalingGroup.name },
      alarmActions: [scaleDownPolicy.arn],
    }
  );
  return cpuUtilizationAlarmLow;
}

export async function createTargetGroup(vpc: Vpc) {
  let tg = new aws.lb.TargetGroup("csye-6225-targetGroup", {
    port: 3000,
    protocol: "HTTP",
    targetType: "instance",
    vpcId: vpc.id,
    healthCheck: {
      path: "/healthz",
      port: "3000",
      protocol: "HTTP",
      interval: 30,
      timeout: 10,
      healthyThreshold: 3,
      unhealthyThreshold: 3,
      matcher: "200-299",
    },
  });

  return tg;
}

export async function createLoadBalancer(
  lbSecurityGroup: SecurityGroup,
  publicSubnet: any[],
  targetGroup: TargetGroup
) {
  const alb = new aws.lb.LoadBalancer("csye-6225-alb", {
    internal: false,
    loadBalancerType: "application",
    ipAddressType: "ipv4",
    securityGroups: [lbSecurityGroup.id],
    subnets: publicSubnet.map((subnet) => subnet.id),
  });

  const listener = new aws.lb.Listener("myListener", {
    loadBalancerArn: alb.arn,
    port: 80,
    defaultActions: [
      {
        type: "forward",
        targetGroupArn: targetGroup.arn,
      },
    ],
  });

  return alb;
}

export async function autoScalingAttach(
  autoscaling_group: Group,
  targetGroup: TargetGroup
) {
  const asAttachLB = new aws.autoscaling.Attachment("asAttachLB", {
    autoscalingGroupName: autoscaling_group.id,
    lbTargetGroupArn: targetGroup.arn,
  });
}

module.exports = {
  createautoScaling: createautoScaling,
  autoScalingAttach: autoScalingAttach,
  asUpPolicy: asUpPolicy,
  asDownPolicy: asDownPolicy,
  cpuUsageUpAlert: cpuUsageUpAlert,
  cpuUsageDownAlert: cpuUsageDownAlert,
  createLoadBalancer: createLoadBalancer,
  createTargetGroup: createTargetGroup,
};
