import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export default async function ec2() {
    const defaultVpc = await aws.ec2.getVpc({
        default: true,
      });
    
    const allowTls = new aws.ec2.SecurityGroup("allowTls", {
        description: "Allow TLS inbound traffic",
        vpcId: defaultVpc.id,
        ingress: [{
            description: "TLS from VPC",
            fromPort: 443,
            toPort: 443,
            protocol: "tcp",
            // cidrBlocks: [defaultVpc.cidrBlock],
            // ipv6CidrBlocks: [defaultVpc.ipv6CidrBlock],
        }],
        egress: [{
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
            ipv6CidrBlocks: ["::/0"],
        }],
        tags: {
            Name: "allow_tls",
        },
    });

}