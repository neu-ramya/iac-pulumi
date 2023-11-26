import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

let gcpConfig = new pulumi.Config("gcp");


// Create a GCP storage bucket
export async function createBucket(name: string, region: string, project: string) {
    const myBucket = new gcp.storage.Bucket("MyBucket", {
        // project: "csye-6225",  // Replace with your Project ID
        name: "csye-6225",  // Replace with your desired bucket name
        location: "EU",
    });
    

    return myBucket;
}

// Create a GCP Service Account
// const sa = new gcp.serviceAccount.Account("my-service-account", {});

// // Create access keys for the new service account
// const saKeys = new gcp.serviceAccount.Key("my-service-account-key", { serviceAccountId: sa.accountId });

module.exports = {
    createBucket: createBucket,
  };
  