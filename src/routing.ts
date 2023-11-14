import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Instance } from "@pulumi/aws/ec2/instance";
import { LoadBalancer } from "@pulumi/aws/elb/loadBalancer";

export async function createARecord(elb: LoadBalancer, profile: any){
    const myZone = aws.route53.getZone({
        name: `${profile}.ramyadevie.me`,
    });
    const ARecord = new aws.route53.Record("ARecord", {
        zoneId: (await myZone).id,
        name: `${profile}.ramyadevie.me`,
        type: "A",
        ttl: 60,
        records: [elb.dnsName],
    });
    return ARecord;
}

export async function createAliasARecord(elb: LoadBalancer, profile: any){
    const myZone = aws.route53.getZone({
        name: `${profile}.ramyadevie.me`,
    });
    const ARecord = new aws.route53.Record("ARecord", {
        zoneId: (await myZone).id,
        name: `${profile}.ramyadevie.me`,
        type: "A",
        aliases: [{
            name: elb.dnsName,
            zoneId: elb.zoneId,
            evaluateTargetHealth: true,
        }],
    });
    return ARecord;
}

module.exports = {
    createAliasARecord: createAliasARecord,
    createARecord: createARecord
  };