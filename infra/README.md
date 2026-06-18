# VerdeChain Infrastructure

This directory contains Terraform configurations for deploying VerdeChain to AWS.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- An S3 bucket for Terraform state (`verdechain-terraform-state`)

## Directory Structure

```
infra/
├── modules/              # Reusable infrastructure modules
│   ├── ecs/              # ECS Fargate cluster + service
│   ├── rds/              # PostgreSQL RDS instance
│   ├── elasticache/      # Redis ElastiCache cluster
│   └── cloudfront/       # CloudFront CDN distribution
├── environments/         # Environment-specific configurations
│   ├── testnet/          # Testnet environment
│   └── mainnet/          # Mainnet environment
└── README.md             # This file
```

## Usage

### Testnet

```bash
cd infra/environments/testnet
terraform init
terraform plan -var="db_password=<your-password>"
terraform apply -var="db_password=<your-password>"
```

### Mainnet

```bash
cd infra/environments/mainnet
terraform init
terraform plan -var="db_password=<your-password>"
terraform apply -var="db_password=<your-password>"
```

## Modules

### ECS

Deploys an ECS Fargate cluster with an application load balancer. The module creates:

- ECS cluster with Container Insights
- Task definition with configurable CPU/memory
- Service with configurable desired count
- Application Load Balancer with HTTPS listener
- CloudWatch log group
- IAM roles for execution and task

### RDS

Deploys a PostgreSQL 16 RDS instance. The module creates:

- RDS instance with configurable class and storage
- Subnet group
- Automated backups (7-day retention)
- Performance Insights
- CloudWatch logs export
- SSM parameter for connection string

### ElastiCache

Deploys a Redis 7 ElastiCache cluster. The module creates:

- Replication group with configurable node type
- Subnet group
- Encryption at rest and in transit
- Automated snapshots
- SSM parameter for connection string

### CloudFront

Deploys a CloudFront CDN distribution for certificate delivery. The module creates:

- CloudFront distribution with S3 origin
- Origin Access Control (OAC)
- Custom cache behaviors for certificate paths
- Logging bucket with lifecycle policy

## Variables

Each module accepts the following common variables:

| Variable      | Description      | Type           | Default      |
| ------------- | ---------------- | -------------- | ------------ |
| `environment` | Environment name | `string`       | —            |
| `app_name`    | Application name | `string`       | `verdechain` |
| `subnet_ids`  | VPC subnet IDs   | `list(string)` | —            |

See individual module `main.tf` files for module-specific variables.

## State Management

Terraform state is stored in S3:

- Bucket: `verdechain-terraform-state`
- Testnet key: `testnet/terraform.tfstate`
- Mainnet key: `mainnet/terraform.tfstate`

Create the state bucket before first use:

```bash
aws s3 mb s3://verdechain-terraform-state
```

## Security

- Database passwords should be managed via AWS Secrets Manager or SSM Parameter Store
- Sensitive variables are marked as `sensitive = true`
- Secrets are stored in SSM Parameter Store as SecureString
- RDS deletion protection is enabled for mainnet
- ElastiCache encryption is enabled by default
