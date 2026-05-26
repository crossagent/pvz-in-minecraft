variable "volc_access_key" {
  type        = string
  description = "Volcengine Access Key ID (AK)"
}

variable "volc_secret_key" {
  type        = string
  description = "Volcengine Secret Key (SK)"
  sensitive   = true
}

variable "volc_region" {
  type        = string
  description = "Volcengine Region"
  default     = "cn-beijing"
}

variable "availability_zone" {
  type        = string
  description = "Volcengine Availability Zone (e.g. cn-beijing-a)"
  default     = "cn-beijing-a"
}

variable "vpc_name" {
  type        = string
  description = "Name of the VPC"
  default     = "minecraft-vpc"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR Block"
  default     = "172.16.0.0/16"
}

variable "subnet_name" {
  type        = string
  description = "Name of the subnet"
  default     = "minecraft-subnet"
}

variable "subnet_cidr" {
  type        = string
  description = "Subnet CIDR Block"
  default     = "172.16.1.0/24"
}

variable "security_group_name" {
  type        = string
  description = "Name of the security group"
  default     = "minecraft-sg"
}

variable "instance_name" {
  type        = string
  description = "Name of the ECS instance"
  default     = "minecraft-server"
}

variable "instance_type" {
  type        = string
  description = "Volcengine ECS Instance Type (Default is ecs.e-c1m2.large: 2 vCPU, 4GB RAM 共享经济型 e 实例)"
  default     = "ecs.e-c1m2.large"
}

variable "server_password" {
  type        = string
  description = "Root password for the ECS instance (must meet complexity requirements: 8-30 characters, including uppercase, lowercase, numbers, and special characters)"
  sensitive   = true
}

variable "minecraft_port" {
  type        = number
  description = "Minecraft Server port (19132 for Bedrock default, 25565 for Java)"
  default     = 19132
}

variable "ssh_port" {
  type        = number
  description = "SSH port"
  default     = 22
}
