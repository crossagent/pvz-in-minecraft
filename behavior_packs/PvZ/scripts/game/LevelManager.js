import { world, system, ItemStack } from "@minecraft/server";
import { levelData } from "../levels.js";
import { PlantManager } from "./PlantManager.js";
import { CutsceneManager } from "./CutsceneManager.js";
import { AudioManager } from "./AudioManager.js";
import { TutorialManager } from "./TutorialManager.js";
import { LanguageManager } from "./LanguageManager.js";

export class LevelManager {
  static async startLevel(player, levelId) {
    const level = levelData.get(levelId);
    if (!level) {
      console.error(
        `Attempted to start a level with an invalid ID: ${levelId}`,
      );
      return;
    }

    PlantManager.resetCooldowns();
    world.setDynamicProperty("gameActive", true);
    world.setDynamicProperty("currentLevelId", levelId);
    world.setDynamicProperty("currentWave", 0);
    world.setDynamicProperty("zombiesKilledThisWave", 0);
    world.setDynamicProperty("zombiesSpawnedThisWave", 0);
    world.setDynamicProperty("nextWaveStartTick", 0);
    world.setDynamicProperty("waveSpawnDeck", "[]");
    world.setDynamicProperty("waveLocationDeck", "[]");

    player.teleport(level.playerStartLocation, {
      rotation: { x: 0, y: 0 },
    });

    if (level.structure && level.structure.name && level.structure.location) {
      try {
        world.structureManager.place(
          level.structure.name,
          player.dimension,
          level.structure.location,
        );
      } catch (err) {
        console.error(
          `Failed to place structure '${level.structure.name}': ${err}`,
        );
      }
    }

    for (const mowerPos of level.lawnmowers) {
      player.dimension.spawnEntity("bn:lawnmower", mowerPos);
    }

    if (level.cutscene && level.cutscene.length > 0) {
      await CutsceneManager.playStartCutscene(player, level.cutscene);
    }

    const inventory = player.getComponent("inventory").container;
    inventory.clearAll();
    for (const startItem of level.startItems) {
      const itemStack = new ItemStack(startItem.typeId, startItem.amount);
      inventory.setItem(startItem.slot, itemStack);
    }

    for (const sbName of level.scoreboardsToReset) {
      const scoreboard = world.scoreboard.getObjective(sbName);
      if (scoreboard) {
        if (sbName === "pollen") {
          scoreboard.setScore(player, level.startingPollen ?? 0);
        } else {
          scoreboard.setScore(player, 0);
        }
      }
    }

    const levelNameText = LanguageManager.get(player, level.name);
    player.sendMessage(
      LanguageManager.get(player, "game.level_start", levelNameText),
    );

    if (level.isTutorial) {
      TutorialManager.startTutorial(player, level);
    } else {
      this.startLevelGameplay(player, levelId);
    }
  }

  static startLevelGameplay(player, levelId) {
    const level = levelData.get(levelId);
    if (!level) return;
    AudioManager.playRandomLevelMusic(player);

    if (level.pollenSpawning) {
      const nextPollenTick =
        system.currentTick + level.pollenSpawning.spawnInterval * 20;
      world.setDynamicProperty("nextPollenSpawnTick", nextPollenTick);
    }
    if (level.zombieSpawning) {
      const nextWaveTick =
        system.currentTick + (level.zombieSpawning.initialDelay || 10) * 20;
      world.setDynamicProperty("nextWaveStartTick", nextWaveTick);
    }
  }

  static onTick() {
    const currentTick = system.currentTick;
    const nextPollenSpawnTick = world.getDynamicProperty("nextPollenSpawnTick");
    if (nextPollenSpawnTick && currentTick >= nextPollenSpawnTick) {
      const currentLevelId = world.getDynamicProperty("currentLevelId");
      const level = levelData.get(currentLevelId);
      if (level && level.pollenSpawning) {
        const config = level.pollenSpawning;
        const center = config.centerLocation;
        const radius = config.radius;
        const angle = Math.random() * 2 * Math.PI;
        const dist = Math.random() * radius;
        const spawnX = center.x + dist * Math.cos(angle);
        const spawnZ = center.z + dist * Math.sin(angle);
        const spawnPos = { x: spawnX, y: center.y, z: spawnZ };

        world.getDimension("overworld").spawnEntity("bn:pollen", spawnPos);
        const nextTick = currentTick + config.spawnInterval * 20;
        world.setDynamicProperty("nextPollenSpawnTick", nextTick);
      }
    }

    const nextZombieSpawnTick = world.getDynamicProperty("nextZombieSpawnTick");
    if (nextZombieSpawnTick && currentTick >= nextZombieSpawnTick) {
      this.spawnNextZombie();
    }
  }

  static startCurrentWave(player) {
    if (!world.getDynamicProperty("gameActive")) return;
    const currentLevelId = world.getDynamicProperty("currentLevelId");
    const level = levelData.get(currentLevelId);
    const currentWave = world.getDynamicProperty("currentWave");
    const waveConfig = level.zombieSpawning.waves[currentWave];
    if (!waveConfig) {
      print("Attempted to start a non-existent wave.");
      return;
    }

    const spawnDeck = [];
    let basicZombieCount = waveConfig.zombieCount;
    if (waveConfig.specialZombies) {
      for (const special of waveConfig.specialZombies) {
        for (let i = 0; i < special.count; i++) {
          spawnDeck.push(special.typeId);
        }
        basicZombieCount -= special.count;
      }
    }

    for (let i = 0; i < basicZombieCount; i++) {
      const randomMob =
        waveConfig.mobs[Math.floor(Math.random() * waveConfig.mobs.length)];
      spawnDeck.push(randomMob);
    }

    // Shuffle spawnDeck
    for (let i = spawnDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spawnDeck[i], spawnDeck[j]] = [spawnDeck[j], spawnDeck[i]];
    }
    world.setDynamicProperty("waveSpawnDeck", JSON.stringify(spawnDeck));

    // Shuffle and build locationDeck
    const locations = [...level.zombieSpawning.locations];
    let locationDeck = [];
    for (let i = locations.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [locations[i], locations[j]] = [locations[j], locations[i]];
    }

    for (let i = 0; i < waveConfig.zombieCount; i++) {
      locationDeck.push(locations[i % locations.length]);
    }

    for (let i = locationDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [locationDeck[i], locationDeck[j]] = [locationDeck[j], locationDeck[i]];
    }
    world.setDynamicProperty("waveLocationDeck", JSON.stringify(locationDeck));
    world.setDynamicProperty("nextZombieSpawnTick", system.currentTick + 1);

    if (currentWave === 0) AudioManager.playSound("initial.wave", player);
    else if (currentWave === 1) AudioManager.playSound("second.wave", player);

    const waveTitle = LanguageManager.get(player, waveConfig.waveName);
    player.onScreenDisplay.setTitle(waveTitle, {
      subtitle: LanguageManager.get(player, "game.wave_approaching"),
      fadeInDuration: 20,
      stayDuration: 60,
      fadeOutDuration: 20,
    });
  }

  static spawnNextZombie() {
    const currentLevelId = world.getDynamicProperty("currentLevelId");
    const level = levelData.get(currentLevelId);
    const currentWave = world.getDynamicProperty("currentWave");
    const waveConfig = level.zombieSpawning.waves[currentWave];
    let spawnedCount = world.getDynamicProperty("zombiesSpawnedThisWave");

    if (spawnedCount >= waveConfig.zombieCount) {
      world.setDynamicProperty("nextZombieSpawnTick", 0);
      return;
    }

    const spawnDeckStr = world.getDynamicProperty("waveSpawnDeck");
    const spawnDeck = JSON.parse(spawnDeckStr);
    const zombieTypeId = spawnDeck[spawnedCount];

    const locationDeckStr = world.getDynamicProperty("waveLocationDeck");
    const locationDeck = JSON.parse(locationDeckStr);
    const spawnPos = locationDeck[spawnedCount];

    if (zombieTypeId && spawnPos) {
      world.getDimension("overworld").spawnEntity(zombieTypeId, spawnPos);
      world.setDynamicProperty("zombiesSpawnedThisWave", spawnedCount + 1);
    } else {
      console.warn(
        `Spawn deck or location deck is missing an entry for wave ${currentWave} at index ${spawnedCount}.`,
      );
    }

    const { minSpawnInterval, maxSpawnInterval } = waveConfig;
    const interval =
      Math.random() * (maxSpawnInterval - minSpawnInterval) + minSpawnInterval;
    world.setDynamicProperty(
      "nextZombieSpawnTick",
      system.currentTick + interval * 20,
    );
  }
}
