import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

async function main() {
    const awsRegion = "us-west-2";

    const vpc = new aws.ec2.Vpc("vpc-csye6225", {
        cidrBlock: "10.0.0.0/16",
        instanceTenancy: "default",
        tags: {
            Name: "vpc-csye6225",
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

    // Choose 3 availability zones from the list.
    const selectedAZs = availableAZs.names?.slice(0, numAZsToCreate) 
    
    
    for (const az of selectedAZs) {
        const publicSubnet = new aws.ec2.Subnet(`${az}-public-subnet`, {
            vpcId: vpc.id,
            availabilityZone: az,
            cidrBlock: "10.0.0.0/24",
            mapPublicIpOnLaunch: true,
            tags: {
                Name: "public-subnet",
            },
        });
    
        const privateSubnet = new aws.ec2.Subnet(`${az}-private-subnet`, {
            vpcId: vpc.id,
            availabilityZone: az,
            cidrBlock: "10.0.1.0/24",
            tags: {
                Name: "private-subnet",
            },
        });
    }


    

}

main();