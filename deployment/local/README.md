# Minecraft Bedrock Server Manager

This directory contains scripts to help manage and upgrade your Minecraft Bedrock Dedicated Server.

## Scripts

### 1. `upgrade_server.bat` (and `upgrade_server.ps1`)
Safely upgrades your dedicated server to a newer version downloaded directly from Mojang.

**Features:**
- Reads the server path dynamically from the `.env` file.
- Checks if a server is currently running and stops it to prevent file locks.
- **Data Preservation**: Backs up your `worlds/` (custom maps), `server.properties`, `allowlist.json`, and `permissions.json` before performing the upgrade.
- Downloads the specified version zip file.
- Extracts and overwrites the server binaries.
- Restores all your backed-up worlds and configurations.

**Usage:**
1. Check the version of your Minecraft client (visible in the lower-right corner of the main menu, e.g., `1.21.111.01`).
2. Double-click `upgrade_server.bat` (or right-click and select "Run as administrator" if your server is located in a protected C: drive folder).
3. Enter the exact version string when prompted.
4. Wait for the upgrade to complete, then start the server using `start_server.bat` at the project root.
