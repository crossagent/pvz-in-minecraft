# Minecraft Bedrock Modding AI Agent System

This document outlines the roles, responsibilities, workflows, and specifications for AI agents designed to build and maintain Minecraft Bedrock Edition mods (Add-ons). 

---

## 1. Minecraft Bedrock Add-on Overview
Minecraft Bedrock Add-ons are composed of two primary components:
1. **Behavior Packs (BP)**: Define the logic, properties, and behaviors of entities, items, blocks, recipes, loot tables, animations, and scripts.
2. **Resource Packs (RP)**: Define the visual representation, including textures, models, sounds, UI, client entities, particles, and language files.

Modern Bedrock modding heavily leverages the **Minecraft Scripting API** (`@minecraft/server` and associated modules) written in JavaScript or TypeScript.

---

## 2. AI Agent Roles & Specifications

### 🤖 Architect Agent (The Coordinator)
*   **Role**: Coordinates the modding process. Translates high-level user feature requests into technical tasks and delegates them to specialist agents.
*   **Key Responsibilities**:
    *   Design the architectural layout of the mod.
    *   Generate and maintain the `manifest.json` files for both Behavior and Resource packs.
    *   Generate UUIDs (Universally Unique Identifiers) for manifests and maintain dependencies between BP and RP.
    *   Manage versioning (`format_version` and mod versions).
*   **Output**: High-level design documents, step-by-step task lists for specialists, manifest configurations.

### 🧱 Behavior Specialist Agent
*   **Role**: Creates and modifies game logic components represented in Behavior Pack JSON.
*   **Key Responsibilities**:
    *   Write and modify entities (`entities/*.json`), blocks (`blocks/*.json`), and items (`items/*.json`).
    *   Configure components, component groups, and event triggers (e.g., `minecraft:health`, `minecraft:damage_sensor`).
    *   Create loot tables (`loot_tables/*.json`), recipes (`recipes/*.json`), and trade tables (`trading/*.json`).
    *   Write server-side animation controllers and animations.
*   **Output**: Well-formatted, schema-compliant Behavior Pack JSON files.

### 🎨 Resource Specialist Agent
*   **Role**: Manages the visual, audio, and client-side presentation elements.
*   **Key Responsibilities**:
    *   Define client entity configurations (`client_entities/*.json`) mapping behaviors to models and textures.
    *   Configure render controllers (`render_controllers/*.json`) and materials.
    *   Generate or modify block and item texture mappings (`textures/terrain_texture.json`, `textures/item_texture.json`).
    *   Coordinate asset paths for textures, models (Geo JSON), particles, and sounds.
*   **Output**: Resource Pack JSON configs, texture reference tables, client-side animations.

### 📜 Scripting Engineer Agent
*   **Role**: Writes high-performance JavaScript/TypeScript code using the Bedrock Scripting API.
*   **Key Responsibilities**:
    *   Write scripts in the `scripts/` directory targeting `@minecraft/server`, `@minecraft/server-ui`, etc.
    *   Subscribe to game events (e.g., `world.afterEvents.playerInteractWithEntity`, `system.runInterval`).
    *   Implement custom gameplay mechanics, dynamic GUIs, custom block behaviors, and complex boss battles.
    *   Maintain script performance, avoiding excessive tick loops and memory leaks.
*   **Output**: JavaScript/TypeScript source code, build scripts (if using TypeScript/bundlers).

### 🔍 Validator / QA Agent
*   **Role**: Validates JSON syntax, schema compliance, API versions, and cross-pack consistency.
*   **Key Responsibilities**:
    *   Validate all JSON files against official Bedrock schemas.
    *   Ensure all referenced textures, models, and sounds exist in the Resource Pack.
    *   Verify UUID compatibility and check that dependency versions in `manifest.json` match.
    *   Check for deprecations or syntax errors in Scripts.
*   **Output**: Validation reports, error/warning lists, syntax corrections.

---

## 3. Recommended Project Directory Structure

AI agents must adhere to the standard Bedrock Add-on workspace structure:

```text
minecraft_mod/
|-- behavior_packs/
|   `-- PvZ/
|       |-- manifest.json      # BP manifest
|       |-- entities/          # Entity behavior JSONs
|       |-- blocks/            # Custom block behaviors
|       |-- items/             # Custom item behaviors
|       |-- loot_tables/       # Drop tables
|       |-- structures/        # Level and GameTest structures
|       `-- scripts/           # Bedrock Scripting API files
|           `-- main.js
|-- resource_packs/
|   `-- PvZ/
|       |-- manifest.json      # RP manifest
|       |-- pack_icon.png      # Pack icon
|       |-- entity/            # Client entity setup
|       |-- models/
|       |   `-- entity/        # Custom Bedrock geometry JSON
|       |-- textures/
|       |   |-- blocks/
|       |   |-- items/
|       |   |-- terrain_texture.json
|       |   `-- item_texture.json
|       `-- texts/
|           `-- en_US.lang     # Localization file
|-- deployment/
|   `-- local/                 # Client and BDS deploy/test scripts
`-- tests/                     # Python checks and GameTest harness
```

---

## 4. Current Debugging Environment

This project is normally played and debugged through the local Minecraft Bedrock client, not through the bundled Bedrock Dedicated Server.

### Primary client world

- Client data root: `C:\Users\zxy19\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang`
- Active local world folder: `minecraftWorlds\pvz_world`
- In-game world name: `Plants vs Zombies BedrockEdition`
- Active Behavior Pack UUID: `4389a98d-c504-4ee3-a12c-81be1f8f7f21`
- Active Resource Pack UUID: `1daccff2-4b9f-4bbd-8c2b-6156e4cbca5d`

### Deployment rule for local play

When the user says they are testing in the client, deploy to both of these locations:

```text
C:\Users\zxy19\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang\development_behavior_packs\PvZ
C:\Users\zxy19\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang\development_resource_packs\PvZ
C:\Users\zxy19\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang\minecraftWorlds\pvz_world\behavior_packs\PvZ
C:\Users\zxy19\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang\minecraftWorlds\pvz_world\resource_packs\PvZ
```

The world-internal pack copies can shadow or lag behind the `development_*_packs` copies. If the world has `behavior_packs\PvZ` or `resource_packs\PvZ`, update those copies too; otherwise the client can reload cleanly with no visible changes.

Use `deployment/local/deploy_client.ps1` for this sync. After syncing packs into a local world, `/reload` may not be enough; the reliable loop is to exit the world and re-enter it, or fully restart the Minecraft client.

### Dedicated server usage

The bundled server at `D:\MyProject\minecraft_mod\bedrock-server` is a headless validation environment for automated GameTest and API loading checks. It is not the user's normal play session unless the user explicitly says they are connecting to that dedicated server.

Use `deployment/local/deploy.ps1` and `tests/run_gametest.ps1` for BDS validation. Passing BDS tests proves script/module loading, but it does not prove the client world has received the latest pack files. GameTest code must not be imported by the normal client `scripts/main.js`; `tests/run_gametest.ps1` injects the GameTest runner only into the deployed BDS copy.

---

## 5. Workflows & Collaboration Protocol

```mermaid
graph TD
    User([User Request]) --> Arch[Architect Agent]
    Arch -->|Analyze & Break Down| Plan[Implementation Plan]
    Plan -->|Create/Modify Behaviors| BP[Behavior Specialist]
    Plan -->|Create/Modify Visuals| RP[Resource Specialist]
    Plan -->|Implement Script Logic| Script[Scripting Engineer]
    BP & RP & Script -->|Submit Output| QA[Validator Agent]
    QA -->|Verify & Test| Result{Passed?}
    Result -->|No: Fix Issues| Arch
    Result -->|Yes: Final Output| User
```

1. **Step 1 (Ingestion)**: The **Architect** receives the user's prompt (e.g., "Add a fire-breathing dragon mount").
2. **Step 2 (Planning)**: The **Architect** determines the needed files:
   - Entity behavior file (`behavior_packs/PvZ/entities/dragon.json`).
   - Client entity file (`resource_packs/PvZ/entity/dragon.json`).
   - Geometry and texture mappings.
   - Script event handler for mounting and fire-breathing.
3. **Step 3 (Delegation)**:
   - **Behavior Specialist** creates the dragon behavior entity.
   - **Resource Specialist** sets up client entity configuration and points to geometry/textures.
   - **Scripting Engineer** implements input listeners or tick loops for the dragon behavior.
4. **Step 4 (Verification)**: The **Validator** reviews files for schema errors, missing links, and script reference errors.

---

## 6. Development Guidelines & Rules for Agents

- **UUID Generation**: Always generate fresh, unique UUIDs for manifests (`version 2` or `version 4`). Never duplicate UUIDs from other templates.
- **Minification**: Keep JSON human-readable (with indentation) to allow easier debugging and code review.
- **Manifest Dependencies**: The `behavior_packs/.../manifest.json` must contain a dependency pointing to the exact UUID and version of the corresponding `resource_packs/.../manifest.json`.
- **Script Module Imports**: Use ESM imports for scripting:
  ```javascript
  import { world, system } from "@minecraft/server";
  ```
- **File Naming**: Use `snake_case` for all resource/behavior files, directories, and identifiers. Use `camelCase` for JavaScript variables and functions.
- **No Code Obfuscation / Use Clean Code**: All JavaScript scripts in the behavior pack have been fully deobfuscated and formatted. Agents must maintain this readability. Do not introduce minified, obfuscated, or hex/unicode-escaped strings (like `\uXXXX`) in any script file. All API calls, property names, and variables must use clear, standard JavaScript naming.
- **Safe Event Subscriptions**: The Bedrock Scripting API is subject to breaking changes and experimental flags. Always wrap event subscriptions (e.g., `world.afterEvents.*.subscribe`) in try-catch blocks or use a `safeSubscribe` helper to prevent a single missing/beta API from crashing script initialization.
- **Multi-Path Deployments**: Bedrock clients load packs from several locations. For this project, local play must sync the client `development_*_packs` and the active world's internal `minecraftWorlds/pvz_world/*_packs` copies as described in Section 4. BDS deployment is separate and only covers the headless server test environment.
