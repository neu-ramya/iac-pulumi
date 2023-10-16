import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
const  networking= require("./index");

export default async function ec2() {
    const defaultVpc = await aws.ec2.getVpc({
        default: true,
      });
    
    const securityGroup = new aws.ec2.SecurityGroup("application security group", {
        description: "Allow TLS inbound traffic",
        vpcId: defaultVpc.id,
        ingress: [{
            description: "SSH from VPC",
            fromPort: 22,
            toPort: 22,
            protocol: "tcp",
            cidrBlocks: ["127.0.0.1/32"],
        },
        {
            description: "HTTP from VPC",
            fromPort: 80,
            toPort: 80,
            protocol: "tcp",
            cidrBlocks: ["127.0.0.1/32"],
        },
        {
            description: "TLS from VPC",
            fromPort: 443,
            toPort: 443,
            protocol: "tcp",
            cidrBlocks: ["127.0.0.1/32"],
        },
        {
            description: "Application port",
            fromPort: 3000,
            toPort: 3000,
            protocol: "tcp",
            cidrBlocks: ["127.0.0.1/32"],
        }],
        egress: [{
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
            ipv6CidrBlocks: ["::/0"],
        }],
        tags: {
            Name: "application security group",
        },
    });

    // const ami = pulumi.output(aws.ec2.getAmi({
    //     mostRecent: true,
    //     owners: [ "042487768049" ],
    //     nameRegex: "csye6225-debian12*",
    // }));
    
    // // Create and launch an Amazon Linux EC2 instance into the public subnet.
    // const instance = new aws.ec2.Instance("instance", {
    //     ami: ami.id,
    //     instanceType: "t3.nano",
    //     subnetId: networking. subnet.id,
    //     vpcSecurityGroupIds: [
    //         securityGroup.id,
    //     ],
    // });
    
    // // Export the instance's publicly accessible URL.
    // module.exports = {
    //     instanceURL: pulumi.interpolate `http://${instance.publicIp}`,
    // };

}