resource "volcengine_security_group" "sg" {
  security_group_name = var.security_group_name
  vpc_id              = volcengine_vpc.vpc.id
}

# Inbound SSH rule
resource "volcengine_security_group_rule" "ssh" {
  security_group_id = volcengine_security_group.sg.id
  direction         = "ingress"
  protocol          = "tcp"
  port_start        = var.ssh_port
  port_end          = var.ssh_port
  cidr_ip           = "0.0.0.0/0"
  policy            = "accept"
  priority          = 1
  description       = "Allow inbound SSH access"
}

# Inbound Minecraft game server rule (Bedrock uses UDP, Java uses TCP)
resource "volcengine_security_group_rule" "minecraft" {
  security_group_id = volcengine_security_group.sg.id
  direction         = "ingress"
  # Support both tcp and udp depending on the minecraft port type (Bedrock: UDP, Java: TCP)
  # For Bedrock Dedicated Server, it uses UDP.
  protocol          = var.minecraft_port == 19132 ? "udp" : "tcp"
  port_start        = var.minecraft_port
  port_end          = var.minecraft_port
  cidr_ip           = "0.0.0.0/0"
  policy            = "accept"
  priority          = 1
  description       = "Allow inbound Minecraft server traffic"
}

# Outbound rule (Allow all egress traffic)
resource "volcengine_security_group_rule" "egress" {
  security_group_id = volcengine_security_group.sg.id
  direction         = "egress"
  protocol          = "all"
  port_start        = -1
  port_end          = -1
  cidr_ip           = "0.0.0.0/0"
  policy            = "accept"
  priority          = 1
  description       = "Allow all outbound traffic"
}
