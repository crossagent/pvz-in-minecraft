import { world, system } from "@minecraft/server";
import { levelData } from "../levels.js";
import { LevelManager } from "./LevelManager.js";
import { AudioManager } from "./AudioManager.js";
import { CutsceneManager } from "./CutsceneManager.js";
import { LanguageManager } from "./LanguageManager.js";
export class GameManager {
  static initialize() {
    world.afterEvents.entityDie.subscribe((_0x48f295) => {
      this.handleEntityDeath(_0x48f295);
    });
    world.afterEvents.entityHitEntity.subscribe((_0x55dbab) => {
      this.handleEntityHit(_0x55dbab);
    });
  }
  static resumeGameOnLoad() {
    const _0xbf0105 = world.getDynamicProperty("gameActive");
    if (_0xbf0105) {
      for (const _0x2a070e of world.getAllPlayers()) {
        AudioManager.playRandomLevelMusic(_0x2a070e);
      }
    }
  }
  static onTick() {
    const _0x2fd35c = world.getDynamicProperty("nextWaveStartTick");
    if (_0x2fd35c && system.currentTick >= _0x2fd35c) {
      world.setDynamicProperty("nextWaveStartTick", 0);
      for (const _0x2bb18e of world.getAllPlayers()) {
        LevelManager.startCurrentWave(_0x2bb18e);
      }
    }
  }
  static handleEntityHit(_0x3574ec) {
    if (!world.getDynamicProperty("gameActive")) return;
    const { damagingEntity: _0x5cb16f, hitEntity: _0x375ef9 } = _0x3574ec;
    if (
      _0x5cb16f &&
      _0x375ef9 &&
      _0x5cb16f.typeId.startsWith("bn:zombie") &&
      _0x375ef9.typeId === "bn:dummy"
    ) {
      this.endLevel(![]);
    }
  }
  static handleEntityDeath(_0x31340f) {
    if (!world.getDynamicProperty("gameActive")) return;
    const { deadEntity: _0x5deab2 } = _0x31340f;
    if (_0x5deab2.typeId.startsWith("bn:zombie")) {
      const _0x322a08 = world.getDynamicProperty("currentLevelId");
      const _0x37fbe6 = levelData.get(_0x322a08);
      if (!_0x37fbe6) return;
      const _0x414c95 = world.scoreboard.getObjective("points");
      if (_0x414c95) {
        for (const _0x1fffc8 of world.getAllPlayers()) {
          _0x414c95.addScore(
            _0x1fffc8.scoreboardIdentity,
            _0x37fbe6.zombieKillPoints || 10,
          );
        }
      }
      const _0x3d8e1f = world.getDynamicProperty("currentWave");
      const _0x5ea9ee = _0x37fbe6.zombieSpawning.waves[_0x3d8e1f];
      let _0x1c4911 = world.getDynamicProperty("zombiesKilledThisWave");
      _0x1c4911++;
      world.setDynamicProperty("zombiesKilledThisWave", _0x1c4911);
      if (_0x1c4911 >= _0x5ea9ee.zombieCount) {
        const _0x17d90a =
          _0x3d8e1f >= _0x37fbe6.zombieSpawning.waves.length - 1;
        if (_0x17d90a) {
          this.endLevel(!![]);
        } else {
          world.setDynamicProperty("nextZombieSpawnTick", 0);
          const _0x1c96c7 = _0x3d8e1f + 1;
          world.setDynamicProperty("currentWave", _0x1c96c7);
          world.setDynamicProperty("zombiesKilledThisWave", 0);
          world.setDynamicProperty("zombiesSpawnedThisWave", 0);
          const _0x1bfee2 = _0x37fbe6.zombieSpawning.intermission;
          for (const _0x99f487 of world.getAllPlayers()) {
            _0x99f487.onScreenDisplay.setTitle(
              LanguageManager.get(_0x99f487, "game.wave_cleared"),
              {
                subtitle: LanguageManager.get(
                  _0x99f487,
                  "game.next_wave_in",
                  _0x1bfee2,
                ),
                fadeInDuration: 0x14,
                stayDuration: _0x1bfee2 * 20 - 40,
                fadeOutDuration: 0x14,
              },
            );
          }
          world.setDynamicProperty(
            "nextWaveStartTick",
            system.currentTick + _0x1bfee2 * 20,
          );
        }
      }
    }
  }
  static endLevel(_0x5b2a2d) {
    if (!world.getDynamicProperty("gameActive")) return;
    AudioManager.stopMusic();
    const _0x164f72 = world.getDynamicProperty("currentLevelId");
    const _0x31db91 = levelData.get(_0x164f72);
    if (_0x5b2a2d) {
      const _0x1d817b = world.getDynamicProperty("completedLevels") || "[]";
      const _0x5f366b = JSON.parse(_0x1d817b);
      if (!_0x5f366b.includes(_0x164f72)) {
        _0x5f366b.push(_0x164f72);
        world.setDynamicProperty("completedLevels", JSON.stringify(_0x5f366b));
      }
      if (_0x31db91.unlocksPlant) {
        this.startPlantUnlockSequence(_0x31db91.unlocksPlant);
        return;
      }
    }
    this.finalizeLevelEnd(_0x5b2a2d);
  }
  static async startPlantUnlockSequence(_0x45b3ba) {
    world.setDynamicProperty("awaitingPlantCollection", !![]);
    world.setDynamicProperty("unlockedPlantId", _0x45b3ba.entityId);
    const _0x45431f = world.getDimension("overworld");
    const _0x5a368b = _0x45431f.spawnEntity(
      _0x45b3ba.entityId,
      _0x45b3ba.spawnLocation,
    );
    AudioManager.playSoundAtLocation("random.levelup", _0x45b3ba.spawnLocation);
    try {
      if (_0x45b3ba.scale) {
        const _0x3c2822 = _0x5a368b.getComponent("minecraft:scale");
        if (_0x3c2822) {
          _0x3c2822.value = _0x45b3ba.scale;
        }
      }
      if (_0x45b3ba.onSpawnEvents && Array.isArray(_0x45b3ba.onSpawnEvents)) {
        for (const _0x22406d of _0x45b3ba.onSpawnEvents) {
          _0x5a368b.triggerEvent(_0x22406d);
        }
      }
    } catch (_0x2f05ce) {
      console.warn(
        "[PvZ] Could not apply unlock effects to " +
          _0x45b3ba.name +
          ": " +
          _0x2f05ce,
      );
    }
    for (const _0x3f39c6 of world.getAllPlayers()) {
      const _0x5edb5e = LanguageManager.get(_0x3f39c6, _0x45b3ba.name);
      _0x3f39c6.onScreenDisplay.setTitle(
        LanguageManager.get(_0x3f39c6, "game.plant_unlocked"),
        {
          subtitle: LanguageManager.get(
            _0x3f39c6,
            "game.collect_plant_prompt",
            _0x5edb5e,
          ),
          fadeInDuration: 0x14,
          stayDuration: 0x64,
          fadeOutDuration: 0x14,
        },
      );
      await CutsceneManager.playStartCutscene(_0x3f39c6, _0x45b3ba.cutscene);
    }
  }
  static handleUnlockedPlantCollection(_0x555be9) {
    const _0x30dd20 = world.getDynamicProperty("awaitingPlantCollection");
    if (!_0x30dd20) return;
    const _0x4774ad = world.getDynamicProperty("unlockedPlantId");
    if (_0x555be9.typeId === _0x4774ad) {
      system.run(() => {
        _0x555be9.remove();
        this.finalizeLevelEnd(!![]);
      });
    }
  }
  static finalizeLevelEnd(_0x48778b) {
    world.setDynamicProperty("gameActive", ![]);
    world.setDynamicProperty("awaitingPlantCollection", ![]);
    world.setDynamicProperty("currentLevelId", "");
    world.setDynamicProperty("currentWave", 0);
    world.setDynamicProperty("zombiesKilledThisWave", 0);
    world.setDynamicProperty("zombiesSpawnedThisWave", 0);
    world.setDynamicProperty("nextPollenSpawnTick", 0);
    world.setDynamicProperty("nextZombieSpawnTick", 0);
    world.setDynamicProperty("nextWaveStartTick", 0);
    world.setDynamicProperty("waveSpawnDeck", "[]");
    world.setDynamicProperty(
      "waveLocationDeck",
      "][".split("").reverse().join(""),
    );
    const _0x2c5ab0 = { x: -33, y: 0x3a, z: 0xb4 };
    system.run(() => {
      for (const _0x1bb46a of world.getAllPlayers()) {
        const _0x208e68 = _0x48778b
          ? LanguageManager.get(_0x1bb46a, "game.level_complete")
          : LanguageManager.get(_0x1bb46a, "game.game_over");
        const _0x57fe7b = _0x48778b
          ? LanguageManager.get(_0x1bb46a, "game.win_message")
          : LanguageManager.get(_0x1bb46a, "game.lose_message");
        const _0x842bf3 = world.scoreboard.getObjective("pollen");
        if (_0x48778b) {
          _0x1bb46a.runCommandAsync(
            "playsound victory.jingle @s " +
              _0x2c5ab0.x +
              " " +
              _0x2c5ab0.y +
              " " +
              _0x2c5ab0.z,
          );
        }
        _0x1bb46a.onScreenDisplay.setTitle(_0x208e68, {
          subtitle: _0x57fe7b,
          fadeInDuration: 0x14,
          stayDuration: 0x64,
          fadeOutDuration: 0x14,
        });
        _0x1bb46a.getComponent("inventory")["container"]["clearAll"]();
        _0x1bb46a.teleport(_0x2c5ab0, { rotation: { x: 0x0, y: 0xb4 } });
        if (_0x842bf3) {
          _0x842bf3.setScore(_0x1bb46a.scoreboardIdentity, 0);
        }
      }
      const _0x30c7e4 = [
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
      const _0x551b8f = world.getDimension("overworld")["getEntities"]();
      for (const _0x2ad3e8 of _0x551b8f) {
        if (
          _0x30c7e4.some(
            (_0x2f0939) =>
              _0x2ad3e8.typeId.startsWith(_0x2f0939) ||
              _0x2ad3e8.typeId === _0x2f0939,
          )
        ) {
          try {
            _0x2ad3e8.remove();
          } catch (_0x2984bc) {}
        }
      }
    });
  }
}
