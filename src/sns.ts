import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export async function createSnsTopic(){
const csyeSnsTopic = new aws.sns.Topic("csyeSnsTopic", {});
const snsTopicPolicy = csyeSnsTopic.arn.apply(arn => aws.iam.getPolicyDocumentOutput({
    policyId: "__default_policy_ID",
    statements: [{
        actions: [
            "SNS:Subscribe",
            "SNS:SetTopicAttributes",
            "SNS:RemovePermission",
            "SNS:Receive",
            "SNS:Publish",
            "SNS:ListSubscriptionsByTopic",
            "SNS:GetTopicAttributes",
            "SNS:DeleteTopic",
            "SNS:AddPermission",
        ],
        conditions: [{
            test: "StringEquals",
            variable: "AWS:SourceOwner",
            values: ["042487768049"],
        }],
        effect: "Allow",
        principals: [{
            type: "AWS",
            identifiers: ["*"],
        }],
        resources: [arn],
        sid: "__default_statement_ID",
    }],
}));
const snsPolicy = new aws.sns.TopicPolicy("snsPolicy", {
    arn: csyeSnsTopic.arn,
    policy: snsTopicPolicy.apply(snsTopicPolicy => snsTopicPolicy.json),
});
return snsPolicy;
}

module.exports = {
    createSnsTopic: createSnsTopic,
  };
  