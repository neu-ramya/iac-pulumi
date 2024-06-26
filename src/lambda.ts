import * as aws from "@pulumi/aws";
import { Table } from "@pulumi/aws/dynamodb/table";
import { Key } from "@pulumi/gcp/serviceaccount/key";
import * as pulumi from "@pulumi/pulumi";
import * as path from "path";
let pulumiConfig = new pulumi.Config("pulumi");

export async function createDynamoTable(tableName: string) {
  const dynamoTable = new aws.dynamodb.Table(tableName, {
    attributes: [
      { name: "id", type: "S" },
      { name: "assignmentNumber", type: "S" },
      { name: "assignmentAttempt", type: "N" },
      { name: "emailaddress", type: "S" },
      { name: "emailSent", type: "S" },
      { name: "deadlineExceeded", type: "S" },
    ],
    hashKey: "id",
    rangeKey: "emailaddress",
    readCapacity: 1,
    writeCapacity: 1,
    globalSecondaryIndexes: [
      {
        name: "assignmentNumberIndex",
        hashKey: "assignmentNumber",
        writeCapacity: 1,
        readCapacity: 1,
        projectionType: "ALL",
      },
      {
        name: "emailSentIndex",
        hashKey: "emailSent",
        writeCapacity: 1,
        readCapacity: 1,
        projectionType: "ALL",
      },
      {
        name: "deadlineExceededIndex",
        hashKey: "deadlineExceeded",
        writeCapacity: 1,
        readCapacity: 1,
        projectionType: "ALL",
      },
      {
        name: "assignmentAttemptIndex",
        hashKey: "assignmentAttempt",
        writeCapacity: 1,
        readCapacity: 1,
        projectionType: "ALL",
      },
    ],
  });

  return dynamoTable;
}

export async function setPermission(
  lambdaFn: { name: any },
  snsTopic: { arn: any }
) {
  let lambdaPermission = new aws.lambda.Permission("permission", {
    action: "lambda:InvokeFunction",
    function: lambdaFn.name,
    principal: "sns.amazonaws.com",
    sourceArn: snsTopic.arn,
  });

  return lambdaPermission;
}

export async function createLambda(
  lamdbaName: string,
  dynamoTableName: string,
  gcpSaJSON: string,
  gcpBucketName: pulumi.Output<string>,
  gcpProjectID: string,
  mailgunAPIKey: string,
) {
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

  new aws.iam.RolePolicyAttachment("lambdaDynamoPolicyAttachment", {
    role: lambdaRole.name,
    policyArn: aws.iam.ManagedPolicies.AmazonDynamoDBFullAccess,
  });

  let lamdbaLayerDeps = pulumiConfig.require("jsDepsPath");
  let lamdbaFunctionCode = pulumiConfig.require("serverlessPath");
  const layer = new aws.lambda.LayerVersion("node-deps", {
    layerName: "node-deps",
    code: new pulumi.asset.FileArchive(lamdbaLayerDeps),
    compatibleRuntimes: ["nodejs20.x"],
  });

  const lambdaFunction = new aws.lambda.Function(lamdbaName, {
    runtime: "nodejs20.x",
    handler: "index.handler",
    timeout: 10,
    layers: [layer.arn],
    memorySize: 256,
    role: lambdaRole.arn,
    code: new pulumi.asset.FileArchive(lamdbaFunctionCode),
    environment: {
      variables: {
        tableName: dynamoTableName,
        gcpSaJSON: gcpSaJSON,
        gcpBucketName:gcpBucketName,
        gcpProjectID: gcpProjectID,
        mailgunAPIKey: mailgunAPIKey,
      },
    },
  });

  return lambdaFunction;
}

module.exports = {
  createLambda: createLambda,
  setPermission: setPermission,
  createDynamoTable: createDynamoTable,
};
