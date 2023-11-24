import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export async function createLambda() {
    const githubUrl = `https://github.com/neu-ramya/serverless/archive/main.zip`;
    
    const lambdaRole = new aws.iam.Role("cyse-lambda-role", {
        assumeRolePolicy: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
            },
          ],
        },
      });

      new aws.iam.RolePolicyAttachment("csye-lambda-policy-attachment", {
        role: lambdaRole,
        policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole as any,
      });

    const lambdaFunction = new aws.lambda.Function("csye-lambda-function", {
        runtime:  "nodejs20.x",
        handler: "index.handler",
        timeout: 10,
        memorySize: 256,
        role: lambdaRole.arn,
        code: new pulumi.asset.FileArchive("./serverless/serverless.zip"),
    });
}

module.exports = {
  createLambda: createLambda,
};
