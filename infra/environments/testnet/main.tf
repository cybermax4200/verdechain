terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket = "verdechain-terraform-state"
    key    = "testnet/terraform.tfstate"
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "verdechain"
      Environment = "testnet"
      ManagedBy   = "terraform"
    }
  }
}

# VPC
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ECS
module "ecs" {
  source = "../../modules/ecs"

  environment    = "testnet"
  app_name       = "verdechain"
  container_image = "ghcr.io/verdechain/api:latest"
  desired_count  = 1
  cpu            = 256
  memory         = 512
  subnet_ids     = data.aws_subnets.private.ids
}

# RDS
module "rds" {
  source = "../../modules/rds"

  environment   = "testnet"
  app_name      = "verdechain"
  db_password   = var.db_password
  instance_class = "db.t4g.micro"
  subnet_ids    = data.aws_subnets.private.ids
  multi_az      = false
}

# ElastiCache
module "elasticache" {
  source = "../../modules/elasticache"

  environment  = "testnet"
  app_name     = "verdechain"
  node_type    = "cache.t4g.micro"
  subnet_ids   = data.aws_subnets.private.ids
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}
