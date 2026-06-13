# Deploy Minecraft Mod Skill

This skill deploys the behavior packs and resource packs from the workspace to either a Bedrock Dedicated Server (BDS) or directly to the local Minecraft client's development folder.

## Configuration File
- **Configuration File**: [.env](file:///d:/MyProject/minecraft_mod/.env)
  - `MINECRAFT_SERVER_PATH`: Path to your Bedrock Dedicated Server (e.g. `d:\MyProject\minecraft_mod\bedrock-server`)
  - `MINECRAFT_CLIENT_PATH`: Path to your local Mojang client games folder (e.g. `C:\Users\zxy19\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang`)

---

## Option A: Deploy to Local Client (Standard / Direct Mode)

### Purpose
- Synchronize Behavior Packs (BP) to `<client>/development_behavior_packs/`
- Synchronize Resource Packs (RP) to `<client>/development_resource_packs/`

### Usage Instructions
Run the following PowerShell command in the workspace directory:
```powershell
powershell -ExecutionPolicy Bypass -File .agent\skills\deploy_client.ps1
```

### World Setup (Required First Time Only)
1. Open Minecraft Client.
2. Create a new world or edit an existing world.
3. Scroll down in the settings and enable **Beta APIs** under **Experiments**.
4. Go to **Resource Packs** and activate the `PvZ` pack.
5. Go to **Behavior Packs** and activate the `PvZ` pack.
6. Enter the world. For future modifications, simply run the deploy command and type `/reload` in the game's chat.

---

## Option B: Deploy to Dedicated Server (BDS Mode)

### Purpose
- Synchronize Behavior Packs (BP) to `<server>/development_behavior_packs/`
- Synchronize Resource Packs (RP) to `<server>/development_resource_packs/`
- Register packs automatically in the active world's `world_behavior_packs.json` and `world_resource_packs.json`.

### Usage Instructions
Run the following PowerShell command in the workspace directory:
```powershell
powershell -ExecutionPolicy Bypass -File .agent\skills\deploy.ps1
```

After deploying, run `/reload` in the Dedicated Server console or game console.
