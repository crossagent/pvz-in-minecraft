terraform {
  required_version = ">= 1.0.0"
  required_providers {
    volcengine = {
      source  = "volcengine/volcengine"
      version = ">= 0.0.90"
    }
  }
}

provider "volcengine" {
  access_key = var.volc_access_key
  secret_key = var.volc_secret_key
  region     = var.volc_region
}
