import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { InstanceProfile } from "@pulumi/aws/iam/instanceProfile";
import { Group } from "@pulumi/aws/autoscaling/group";
import { Topic } from "@pulumi/aws/sns/topic";
import { LoadBalancer } from "@pulumi/aws/elb/loadBalancer";
import { SecurityGroup } from "@pulumi/aws/ec2/securityGroup";
import { Subnet } from "@pulumi/aws/ec2/subnet";
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

  const asTemplate = new aws.ec2.LaunchTemplate("Auto Scaling Template", {
    namePrefix: "Auto-Scaling-Template",
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
  const asGroup = new aws.autoscaling.Group("auto-scaling-group", {
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
    "cpuUtilizationHigh",
    {
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 300, // 5 minutes
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
    "cpuUtilizationLow",
    {
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 1,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 300, // 5 minutes
      threshold: 3,
      statistic: "Average",
      dimensions: { AutoScalingGroupName: autoScalingGroup.name },
      alarmActions: [scaleDownPolicy.arn],
    }
  );
  return cpuUtilizationAlarmLow;
}

export async function createLoadBalancer(
  lbSecurityGroup: SecurityGroup,
  availabilityZone: string[],
  publicSubnet: Subnet
) {
  const loadBalancer = new aws.elb.LoadBalancer("loadBalancer", {
    // availabilityZones: availabilityZone,
    subnets: [publicSubnet.id],
    listeners: [
      {
        instancePort: 3000,
        instanceProtocol: "http",
        lbPort: 80,
        lbProtocol: "http",
      },
    ],
    securityGroups: [lbSecurityGroup.id],
  });
  return loadBalancer;
}

export async function autoScalingAttach(
  autoscaling_group: Group,
  aws_elb: LoadBalancer
) {
  const asAttachLB = new aws.autoscaling.Attachment("asAttachLB", {
    autoscalingGroupName: autoscaling_group.id,
    elb: aws_elb.id,
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
};
