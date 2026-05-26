output "minecraft_server_public_ip" {
  value       = volcengine_eip_address.eip.eip_address
  description = "The public IP address of the Minecraft server"
}

output "ssh_connection_command" {
  value       = "ssh root@${volcengine_eip_address.eip.eip_address}"
  description = "The command to connect to your server via SSH"
}

output "minecraft_connection_info" {
  value       = "Connect in Minecraft client using IP: ${volcengine_eip_address.eip.eip_address} and Port: ${var.minecraft_port}"
  description = "The details to enter in your Minecraft game client to connect"
}
