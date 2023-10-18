# iac-pulumi
csye6225-fall2023

## Pulumi
- Pulumi allows continuous delivery of cloud applications and infrastructure in any cloud environment
- install pulumi using 'brew install pulumi/tap/pulumi'

## VPC
- create VPC using pulumi by following steps in 'https://www.pulumi.com/registry/packages/aws/api-docs/ec2/vpc/' 
### subnet
- create subnet using pulumi by following steps in 'https://www.pulumi.com/registry/packages/aws/api-docs/ec2/instance/'
### internet gateway
- create internet gateway using pulumi  by following steps in 'https://www.pulumi.com/registry/packages/aws/api-docs/ec2/internetgateway/'
### route table
- create route table using pulumi  by following steps in 'https://www.pulumi.com/registry/packages/aws/api-docs/ec2/routetable/
- route table should contain both publiuc and private routes, where public route is connected to the internet gateway
  
## EC2
- create ec2 instance using pulumi  by following steps in 'https://www.pulumi.com/registry/packages/aws/api-docs/ec2/instance/'
### security group
- create ec2 security group using pulumi  by following steps in 'https://www.pulumi.com/registry/packages/aws/api-docs/ec2/securitygroup/'
- Security groups for SSH,HTTP,HTTPS and the network in which the webapp is running.
### AMI and filtering
- Filter the most recent AMI to launch the ec2 instance ('pulumi up')
### keypairs
- A key pair is used to control login access to EC2 instances.
- An existing keypair is used when launching the EC2 instance using pulumi