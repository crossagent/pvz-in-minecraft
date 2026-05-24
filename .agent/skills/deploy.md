# Deploy Minecraft Mod Skill

This skill deploys the behavior packs and resource packs from the workspace to the Bedrock Dedicated Server specified in the `.env` file, and automatically registers the packs in the active world.

## Purpose
- Synchronize Behavior Packs (BP) to `<server>/development_behavior_packs/`
- Synchronize Resource Packs (RP) to `<server>/development_resource_packs/`
- Read the UUID and version of the packs and automatically register them in the active world's `world_behavior_packs.json` and `world_resource_packs.json`.

## File Paths
- **Execution Script**: [.agent/skills/deploy.ps1](file:///d:/MyProject/minecraft_mod/.agent/skills/deploy.ps1)
- **Configuration File**: [.env](file:///d:/MyProject/minecraft_mod/.env) (contains `MINECRAFT_SERVER_PATH`)

## Usage Instructions
Run the following PowerShell command in the workspace directory to deploy:
```powershell
powershell -ExecutionPolicy Bypass -File .agent\skills\deploy.ps1
```

After deploying, run `/reload` in the Minecraft game console to reload the behaviors and scripts.
