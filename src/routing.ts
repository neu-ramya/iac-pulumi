import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Instance } from "@pulumi/aws/ec2/instance";

export async function routing(ec2instace: Instance, profile: any){
    const myZone = aws.route53.getZone({
        name: `${profile}.ramyadevie.me`,
    });
const ARecord = new aws.route53.Record("ARecord", {
    zoneId: (await myZone).id,
    name: `${profile}.ramyadevie.me`,
    type: "A",
    ttl: 60,
    records: [ec2instace.publicIp],
});
return ARecord;
}

module.exports = {
    routing: routing,
  };