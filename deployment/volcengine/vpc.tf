resource "volcengine_vpc" "vpc" {
  vpc_name   = var.vpc_name
  cidr_block = var.vpc_cidr
}

resource "volcengine_subnet" "subnet" {
  subnet_name = var.subnet_name
  cidr_block  = var.subnet_cidr
  vpc_id      = volcengine_vpc.vpc.id
  zone_id     = var.availability_zone
}
