import * as aws from "@pulumi/aws";
import { LoadBalancer } from "@pulumi/aws/lb/loadBalancer";

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

export async function createAliasARecord(alb: LoadBalancer, profile: any){
    const myZone = aws.route53.getZone({
        name: `${profile}.ramyadevie.me`,
    });
    const ARecord = new aws.route53.Record("ARecord", {
        zoneId: (await myZone).id,
        name: `${profile}.ramyadevie.me`,
        type: "A",
        aliases: [{
            name: alb.dnsName,
            zoneId: alb.zoneId,
            evaluateTargetHealth: true,
        }],
    });
    return ARecord;
}

module.exports = {
    createAliasARecord: createAliasARecord,
    createARecord: createARecord
  };