import { world, system } from "@minecraft/server";
import { levelData } from "../levels.js";
import { LevelManager } from "./LevelManager.js";
import { AudioManager } from "./AudioManager.js";
import { CutsceneManager } from "./CutsceneManager.js";
import { LanguageManager } from "./LanguageManager.js";

export class GameManager {
  static initialize() {
    world.afterEvents.entityDie.subscribe((event) => {
      this.handleEntityDeath(event);
    });
    world.afterEvents.entityHitEntity.subscribe((event) => {
      this.handleEntityHit(event);
    });
  }

  static resumeGameOnLoad() {
    const isGameActive = world.getDynamicProperty("gameActive");
    if (isGameActive) {
      for (const player of world.getAllPlayers()) {
        AudioManager.playRandomLevelMusic(player);
      }
    }
  }

  static onTick() {
    const nextWaveStartTick = world.getDynamicProperty("nextWaveStartTick");
    if (nextWaveStartTick && system.currentTick >= nextWaveStartTick) {
      world.setDynamicProperty("nextWaveStartTick", 0);
      for (const player of world.getAllPlayers()) {
        LevelManager.startCurrentWave(player);
      }
    }
  }

  static handleEntityHit(event) {
    if (!world.getDynamicProperty("gameActive")) return;
    const { damagingEntity, hitEntity } = event;
    if (
      damagingEntity &&
      hitEntity &&
      damagingEntity.typeId.startsWith("bn:zombie") &&
      hitEntity.typeId === "bn:dummy"
    ) {
      this.endLevel(false);
    }
  }

  static handleEntityDeath(event) {
    if (!world.getDynamicProperty("gameActive")) return;
    const { deadEntity } = event;
    if (deadEntity.typeId.startsWith("bn:zombie")) {
      const currentLevelId = world.getDynamicProperty("currentLevelId");
      const level = levelData.get(currentLevelId);
      if (!level) return;

      const pointsObjective = world.scoreboard.getObjective("points");
      if (pointsObjective) {
        for (const player of world.getAllPlayers()) {
          pointsObjective.addScore(
            player.scoreboardIdentity,
            level.zombieKillPoints || 10,
          );
        }
      }

      const currentWave = world.getDynamicProperty("currentWave");
      const waveConfig = level.zombieSpawning.waves[currentWave];
      let zombiesKilled = world.getDynamicProperty("zombiesKilledThisWave");
      zombiesKilled++;
      world.setDynamicProperty("zombiesKilledThisWave", zombiesKilled);

      if (zombiesKilled >= waveConfig.zombieCount) {
        const isLastWave = currentWave >= level.zombieSpawning.waves.length - 1;
        if (isLastWave) {
          this.endLevel(true);
        } else {
          world.setDynamicProperty("nextZombieSpawnTick", 0);
          const nextWave = currentWave + 1;
          world.setDynamicProperty("currentWave", nextWave);
          world.setDynamicProperty("zombiesKilledThisWave", 0);
          world.setDynamicProperty("zombiesSpawnedThisWave", 0);
          const intermission = level.zombieSpawning.intermission;

          for (const player of world.getAllPlayers()) {
            player.onScreenDisplay.setTitle(
              LanguageManager.get(player, "game.wave_cleared"),
              {
                subtitle: LanguageManager.get(
                  player,
                  "game.next_wave_in",
                  intermission,
                ),
                fadeInDuration: 20,
                stayDuration: intermission * 20 - 40,
                fadeOutDuration: 20,
              },
            );
          }
          world.setDynamicProperty(
            "nextWaveStartTick",
            system.currentTick + intermission * 20,
          );
        }
      }
    }
  }

  static endLevel(isWin) {
    if (!world.getDynamicProperty("gameActive")) return;
    AudioManager.stopMusic();
    const currentLevelId = world.getDynamicProperty("currentLevelId");
    const level = levelData.get(currentLevelId);

    if (isWin) {
      const completedLevelsStr =
        world.getDynamicProperty("completedLevels") || "[]";
      const completedLevels = JSON.parse(completedLevelsStr);
      if (!completedLevels.includes(currentLevelId)) {
        completedLevels.push(currentLevelId);
        world.setDynamicProperty(
          "completedLevels",
          JSON.stringify(completedLevels),
        );
      }
      if (level.unlocksPlant) {
        this.startPlantUnlockSequence(level.unlocksPlant);
        return;
      }
    }
    this.finalizeLevelEnd(isWin);
  }

  static async startPlantUnlockSequence(unlockConfig) {
    world.setDynamicProperty("awaitingPlantCollection", true);
    world.setDynamicProperty("unlockedPlantId", unlockConfig.entityId);
    const overworld = world.getDimension("overworld");
    const spawnedPlant = overworld.spawnEntity(
      unlockConfig.entityId,
      unlockConfig.spawnLocation,
    );

    AudioManager.playSoundAtLocation(
      "random.levelup",
      unlockConfig.spawnLocation,
    );
    try {
      if (unlockConfig.scale) {
        const scaleComponent = spawnedPlant.getComponent("minecraft:scale");
        if (scaleComponent) {
          scaleComponent.value = unlockConfig.scale;
        }
      }
      if (
        unlockConfig.onSpawnEvents &&
        Array.isArray(unlockConfig.onSpawnEvents)
      ) {
        for (const spawnEvent of unlockConfig.onSpawnEvents) {
          spawnedPlant.triggerEvent(spawnEvent);
        }
      }
    } catch (err) {
      console.warn(
        `[PvZ] Could not apply unlock effects to ${unlockConfig.name}: ${err}`,
      );
    }

    for (const player of world.getAllPlayers()) {
      const plantName = LanguageManager.get(player, unlockConfig.name);
      player.onScreenDisplay.setTitle(
        LanguageManager.get(player, "game.plant_unlocked"),
        {
          subtitle: LanguageManager.get(
            player,
            "game.collect_plant_prompt",
            plantName,
          ),
          fadeInDuration: 20,
          stayDuration: 100,
          fadeOutDuration: 20,
        },
      );
      await CutsceneManager.playStartCutscene(player, unlockConfig.cutscene);
    }
  }

  static handleUnlockedPlantCollection(entity) {
    const awaitingCollection = world.getDynamicProperty(
      "awaitingPlantCollection",
    );
    if (!awaitingCollection) return;
    const unlockedPlantId = world.getDynamicProperty("unlockedPlantId");
    if (entity.typeId === unlockedPlantId) {
      system.run(() => {
        entity.remove();
        this.finalizeLevelEnd(true);
      });
    }
  }

  static finalizeLevelEnd(isWin) {
    world.setDynamicProperty("gameActive", false);
    world.setDynamicProperty("awaitingPlantCollection", false);
    world.setDynamicProperty("currentLevelId", "");
    world.setDynamicProperty("currentWave", 0);
    world.setDynamicProperty("zombiesKilledThisWave", 0);
    world.setDynamicProperty("zombiesSpawnedThisWave", 0);
    world.setDynamicProperty("nextPollenSpawnTick", 0);
    world.setDynamicProperty("nextZombieSpawnTick", 0);
    world.setDynamicProperty("nextWaveStartTick", 0);
    world.setDynamicProperty("waveSpawnDeck", "[]");
    world.setDynamicProperty("waveLocationDeck", "[]");

    const lobbySpawn = { x: -33, y: 58, z: 180 };
    system.run(() => {
      for (const player of world.getAllPlayers()) {
        const titleText = isWin
          ? LanguageManager.get(player, "game.level_complete")
          : LanguageManager.get(player, "game.game_over");
        const subtitleText = isWin
          ? LanguageManager.get(player, "game.win_message")
          : LanguageManager.get(player, "game.lose_message");
        const pollenScoreboard = world.scoreboard.getObjective("pollen");

        if (isWin) {
          player.runCommand(
            `playsound victory.jingle @s ${lobbySpawn.x} ${lobbySpawn.y} ${lobbySpawn.z}`,
          );
        }

        player.onScreenDisplay.setTitle(titleText, {
          subtitle: subtitleText,
          fadeInDuration: 20,
          stayDuration: 100,
          fadeOutDuration: 20,
        });

        player.getComponent("inventory").container.clearAll();
        player.teleport(lobbySpawn, { rotation: { x: 0, y: 180 } });
        if (pollenScoreboard) {
          pollenScoreboard.setScore(player.scoreboardIdentity, 0);
        }
      }

      const pvzEntityPrefixes = [
        "bn:plant_",
        "bn:pollen",
        "bn:lawnmower",
        "bn:zombie",
        "bn:projectile_1",
        "bn:cherry_tnt",
        "bn:wallnut",
        "bn:potato_mine",
        "bn:snow_pea",
        "bn:projectile_2",
        "bn:sunflower",
        "bn:peashooter",
      ];

      const allEntities = world.getDimension("overworld").getEntities();
      for (const entity of allEntities) {
        if (
          pvzEntityPrefixes.some(
            (prefix) =>
              entity.typeId.startsWith(prefix) || entity.typeId === prefix,
          )
        ) {
          try {
            entity.remove();
          } catch (err) {}
        }
      }
    });
  }
}
