terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "verdechain"
}

variable "subnet_ids" {
  description = "VPC subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
  default     = []
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.app_name}-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.app_name}-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "${var.app_name}-${var.environment}"
  description          = "${var.app_name} ${var.environment} Redis cluster"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = var.node_type

  num_cache_clusters = var.num_cache_nodes

  parameter_group_name = "default.redis7"

  port = 6379

  subnet_group_name          = aws_elasticache_subnet_group.this.name
  security_group_ids         = var.security_group_ids
  automatic_failover_enabled = var.num_cache_nodes > 1

  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true

  maintenance_window = "sun:05:00-sun:06:00"
  snapshot_window    = "02:00-03:00"
  snapshot_retention_limit = 3

  tags = {
    Name        = "${var.app_name}-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "connection_string" {
  name  = "/${var.app_name}/${var.environment}/REDIS_URL"
  type  = "SecureString"
  value = "redis://${aws_elasticache_replication_group.this.primary_endpoint_address}:6379"

  tags = {
    Name        = "${var.app_name}-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

output "primary_endpoint" {
  value = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "reader_endpoint" {
  value = aws_elasticache_replication_group.this.reader_endpoint_address
}

output "connection_string_arn" {
  value = aws_ssm_parameter.connection_string.arn
}
