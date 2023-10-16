import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import ec2 from './ec2';


async function main() {
    let pulumiConfig = new pulumi.Config("pulumi");

    const vpc = new aws.ec2.Vpc(pulumiConfig.require("vpcName"), {
        cidrBlock: pulumiConfig.require("vpcCIDRblock"),
        instanceTenancy: "default",
        tags: {
            Name: "vpc-csye6225",
            Owner: pulumiConfig.require("ownerTag")
        },
    });

    const numberOfAZsToSelect = 3;
    let  numAZsToCreate;

    const availableAZs = await aws.getAvailabilityZones({
        state: "available"
    });

    const numAZs = availableAZs.names.length
    if(numAZs > numberOfAZsToSelect) {
        numAZsToCreate = numberOfAZsToSelect
    } else {
        numAZsToCreate = numAZs
    }

    const selectedAZs = availableAZs.names?.slice(0, numAZsToCreate) 
    let  publicSubnetArray = [];
    let  privateSubnetArray = [];
    let i=1;
    for (const az of selectedAZs) {
        const publicSubnet = new aws.ec2.Subnet(`${az}-public-subnet`, {
            vpcId: vpc.id,
            availabilityZone: az,
            cidrBlock: pulumiConfig.require(`publicSubnetCIDRblock-${i}`),
            mapPublicIpOnLaunch: true,
            tags: {
                Name: "public-subnet",
                Owner: pulumiConfig.require("ownerTag")
            },
        });
        
        const privateSubnet = new aws.ec2.Subnet(`${az}-private-subnet`, {
            vpcId: vpc.id,
            availabilityZone: az,
            cidrBlock: pulumiConfig.require(`privateSubnetCIDRblock-${i}`),
            tags: {
                Name: "private-subnet",
                Owner: pulumiConfig.require("ownerTag")
            },
        });
        i+=1;
        publicSubnetArray.push(publicSubnet);
        privateSubnetArray.push(privateSubnet);
    }

    const internetGateway = new aws.ec2.InternetGateway(pulumiConfig.require("internetGatewayName"), {
        tags: {
            Name: `ig-${pulumiConfig.require("ownerTag")}`,
            Owner: pulumiConfig.require("ownerTag")
        },
    });
    
    const internetGatewayAttachment = new aws.ec2.InternetGatewayAttachment(pulumiConfig.require("internetGatewayAttachmentName"), {
        vpcId: vpc.id,
        internetGatewayId: internetGateway.id,
    });
    

    const publicRouteTable = new aws.ec2.RouteTable(pulumiConfig.require("publicRouteTable"), {
        vpcId: vpc.id,
        tags: {
            Name: "ramya-public-route-table",
            Owner: pulumiConfig.require("ownerTag")
        },
    });
    
    const privateRouteTable = new aws.ec2.RouteTable(pulumiConfig.require("privateRouteTable"), {
        vpcId: vpc.id,
        tags: {
            Name: "private-route-table",
            Owner: pulumiConfig.require("ownerTag")
        },
    });

    for (const pubSubnet of publicSubnetArray) {
        new aws.ec2.RouteTableAssociation(`public-subnet-association-${Math.floor(Math.random() * 1000) + 1}`, {
            subnetId: pubSubnet.id,
            routeTableId: publicRouteTable.id,
        });
    }

    for (const privSubnet of privateSubnetArray) {
        new aws.ec2.RouteTableAssociation(`private-subnet-association-${Math.floor(Math.random() * 1000) + 1}`, {
            subnetId: privSubnet.id,
            routeTableId: privateRouteTable.id,
        });
    }

    new aws.ec2.Route(pulumiConfig.require("publicRouteName"), {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: pulumiConfig.require("openCIDRblock"),
        gatewayId: internetGateway.id,
    });
}

// main();
ec2();