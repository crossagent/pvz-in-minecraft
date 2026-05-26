# Fetch the latest available Ubuntu 22.04 LTS Image in the current region
data "volcengine_images" "ubuntu" {
  os_type  = "Linux"
  platform = "Ubuntu"
  # Volcano Engine Ubuntu 22.04 LTS images typically contain "ubuntu_22_04" in their name
  name_regex = "ubuntu_22_04"
}

# Create the ECS Instance
resource "volcengine_ecs_instance" "mc_server" {
  instance_name        = var.instance_name
  image_id             = data.volcengine_images.ubuntu.images[0].image_id
  instance_type        = var.instance_type
  subnet_id            = volcengine_subnet.subnet.id
  security_group_ids   = [volcengine_security_group.sg.id]
  instance_charge_type = "PostPaid" # Pay-as-you-go to avoid lock-in

  system_volume_type = "ESSD_PL0"
  system_volume_size = 40 # 40GB is plenty for OS + Bedrock Server + worlds

  password = var.server_password

  # Startup script (run on first boot as root)
  # Installs necessary dependencies (unzip for server extraction, libcurl4 for Bedrock Dedicated Server, screen for running in background)
  user_data = base64encode(<<-EOF
              #!/bin/bash
              # Update packages
              apt-get update -y
              
              # Install dependencies required by Bedrock Dedicated Server
              apt-get install -y unzip libcurl4 screen ca-certificates curl
              
              # Create minecraft directory
              mkdir -p /opt/minecraft
              
              # Output initialization status
              echo "Minecraft ECS instance initialization complete!" > /var/log/mc-init.log
              EOF
  )

  tags {
    key   = "Environment"
    value = "Minecraft"
  }
}

# Allocate an Elastic IP (EIP)
resource "volcengine_eip_address" "eip" {
  name         = "${var.instance_name}-eip"
  billing_type = "PostPaidByTraffic" # Pay-by-traffic is highly recommended for game servers
  bandwidth    = 100                 # Set high peak bandwidth (100 Mbps) for smooth gameplay connection
  isp          = "BGP"
  description  = "EIP for Minecraft Bedrock Dedicated Server"
}

# Associate EIP with ECS Instance
resource "volcengine_eip_associate" "eip_assoc" {
  allocation_id = volcengine_eip_address.eip.id
  instance_id   = volcengine_ecs_instance.mc_server.id
  instance_type = "EcsInstance"
}
