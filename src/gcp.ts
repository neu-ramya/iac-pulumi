import * as gcp from "@pulumi/gcp";
import { Account } from "@pulumi/gcp/serviceaccount/account";
import * as pulumi from "@pulumi/pulumi";

export async function createBucket(bucketName: string) {
    const bucket = new gcp.storage.Bucket(bucketName, {
        location: "US",
        forceDestroy: true,
    });

    return bucket;
}
 
export async function attachBucketIAM(bucketName: pulumi.Output<string>, serviceAccount: Account, role: string) {
    const bucketIAMBinding = new gcp.storage.BucketIAMMember("seviceaccount-admin-access", {
        bucket: bucketName,
        role: role,
        member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
    });
}

export async function createServiceAccount(serviceAccountName: string){
    const serviceAccount = new gcp.serviceaccount.Account(serviceAccountName, {
        accountId: serviceAccountName,
        displayName: serviceAccountName,
    });

    return serviceAccount;
}

export async function createServiceAccountAccessKey(serviceAccount: Account) {
    const accountKey = new gcp.serviceaccount.Key("sa-access-key", {
        serviceAccountId: serviceAccount.accountId,
    });

    return accountKey;
}

module.exports = {
    createBucket: createBucket,
    createServiceAccount: createServiceAccount,
    createServiceAccountAccessKey: createServiceAccountAccessKey,
    attachBucketIAM: attachBucketIAM,
};
  