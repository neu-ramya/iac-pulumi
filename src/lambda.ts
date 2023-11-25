import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export async function createDynamoTable() {
    const dynamoTable = new aws.dynamodb.Table("cyse-assignment-email-tracker", {
        attributes: [
            { name: "id", type: "S" },
            { name: "assignmentNumber", type: "N" },
            { name: "emailaddress", type: "S" },
            { name: "valid", type: "B" }
        ],
        hashKey: "id",
        rangeKey: "emailaddress",
    readCapacity: 1,
    writeCapacity: 1,
    globalSecondaryIndexes: [
        {
            name: "valid",
            hashKey: "valid",
            rangeKey: "assignmentNumber",
            writeCapacity: 1,
            readCapacity: 1,
            projectionType: "ALL",
        }],
    });

    return dynamoTable; 
}

export async function setPermission(lambdaFn: { name: any; }, snsTopic: { arn: any; }) {
    let lambdaPermission = new aws.lambda.Permission("permission", {
        action: "lambda:InvokeFunction",
        function: lambdaFn.name,
        principal: "sns.amazonaws.com",
        sourceArn: snsTopic.arn,
      });

    return lambdaPermission;
}

export async function createLambda() {    
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

    const githubUrl = `https://github.com/neu-ramya/serverless/archive/main.zip`;
    const lambdaFunction = new aws.lambda.Function("csye-lambda-function", {
        runtime:  "nodejs20.x",
        handler: "index.js",
        timeout: 10,
        memorySize: 256,
        role: lambdaRole.arn,
        code: new pulumi.asset.FileArchive("./serverless/serverless.zip"),
    });

    return lambdaFunction;
}

module.exports = {
  createLambda: createLambda,
  setPermission: setPermission,
  createDynamoTable: createDynamoTable,
};
