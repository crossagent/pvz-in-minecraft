import { world, system, ItemStack } from "@minecraft/server";
import { levelData } from "../levels.js";
import { PlantManager } from "./PlantManager.js";
import { CutsceneManager } from "./CutsceneManager.js";
import { AudioManager } from "./AudioManager.js";
import { TutorialManager } from "./TutorialManager.js";
import { LanguageManager } from "./LanguageManager.js";
export class LevelManager {
  static async startLevel(_0xb9a3d7, _0x43e37f) {
    const _0x11a0a7 = levelData.get(_0x43e37f);
    if (!_0x11a0a7) {
      console.error(
        "Attempted to start a level with an invalid ID: " + _0x43e37f,
      );
      return;
    }
    PlantManager.resetCooldowns();
    world.setDynamicProperty("gameActive", !![]);
    world.setDynamicProperty("currentLevelId", _0x43e37f);
    world.setDynamicProperty("currentWave", 0);
    world.setDynamicProperty("zombiesKilledThisWave", 0);
    world.setDynamicProperty("zombiesSpawnedThisWave", 0);
    world.setDynamicProperty("nextWaveStartTick", 0);
    world.setDynamicProperty(
      "waveSpawnDeck",
      "][".split("").reverse().join(""),
    );
    world.setDynamicProperty("waveLocationDeck", "[]");
    _0xb9a3d7.teleport(_0x11a0a7.playerStartLocation, {
      rotation: { x: 0x0, y: 0x0 },
    });
    if (
      _0x11a0a7.structure &&
      _0x11a0a7.structure.name &&
      _0x11a0a7.structure.location
    ) {
      try {
        world.structureManager.place(
          _0x11a0a7.structure.name,
          _0xb9a3d7.dimension,
          _0x11a0a7.structure.location,
        );
      } catch (_0xffde20) {
        console.error(
          "Failed to place structure \x27" +
            _0x11a0a7.structure.name +
            "\x27: " +
            _0xffde20,
        );
      }
    }
    for (const _0x1b3822 of _0x11a0a7.lawnmowers) {
      _0xb9a3d7.dimension.spawnEntity("bn:lawnmower", _0x1b3822);
    }
    if (_0x11a0a7.cutscene && _0x11a0a7.cutscene.length > 0) {
      await CutsceneManager.playStartCutscene(_0xb9a3d7, _0x11a0a7.cutscene);
    }
    const _0x148b94 = _0xb9a3d7.getComponent("inventory")["container"];
    _0x148b94.clearAll();
    for (const _0x1df6be of _0x11a0a7.startItems) {
      const _0x34e3f2 = new ItemStack(_0x1df6be.typeId, _0x1df6be.amount);
      _0x148b94.setItem(_0x1df6be.slot, _0x34e3f2);
    }
    for (const _0x354cd9 of _0x11a0a7.scoreboardsToReset) {
      const _0x15ebbd = world.scoreboard.getObjective(_0x354cd9);
      if (_0x15ebbd) {
        if (_0x354cd9 === "pollen") {
          _0x15ebbd.setScore(_0xb9a3d7, _0x11a0a7.startingPollen ?? 0);
        } else {
          _0x15ebbd.setScore(_0xb9a3d7, 0);
        }
      }
    }
    const _0x242326 = LanguageManager.get(_0xb9a3d7, _0x11a0a7.name);
    _0xb9a3d7.sendMessage(
      LanguageManager.get(_0xb9a3d7, "game.level_start", _0x242326),
    );
    if (_0x11a0a7.isTutorial) {
      TutorialManager.startTutorial(_0xb9a3d7, _0x11a0a7);
    } else {
      this.startLevelGameplay(_0xb9a3d7, _0x43e37f);
    }
  }
  static startLevelGameplay(_0x3644dc, _0x38420e) {
    const _0x27d051 = levelData.get(_0x38420e);
    if (!_0x27d051) return;
    AudioManager.playRandomLevelMusic(_0x3644dc);
    if (_0x27d051.pollenSpawning) {
      const _0x410b9c =
        system.currentTick + _0x27d051.pollenSpawning.spawnInterval * 20;
      world.setDynamicProperty("nextPollenSpawnTick", _0x410b9c);
    }
    if (_0x27d051.zombieSpawning) {
      const _0x25ffa1 =
        system.currentTick + (_0x27d051.zombieSpawning.initialDelay || 10) * 20;
      world.setDynamicProperty("nextWaveStartTick", _0x25ffa1);
    }
  }
  static onTick() {
    const _0x465402 = system.currentTick;
    const _0x4b1c53 = world.getDynamicProperty("nextPollenSpawnTick");
    if (_0x4b1c53 && _0x465402 >= _0x4b1c53) {
      const _0x503c48 = world.getDynamicProperty("currentLevelId");
      const _0xdcd8a3 = levelData.get(_0x503c48);
      if (_0xdcd8a3 && _0xdcd8a3.pollenSpawning) {
        const _0x48e6fb = _0xdcd8a3.pollenSpawning;
        const _0x43e989 = _0x48e6fb.centerLocation;
        const _0x5a5445 = _0x48e6fb.radius;
        const _0x1ba541 = Math.random() * 2 * Math.PI;
        const _0x36dd03 = Math.random() * _0x5a5445;
        const _0x7e61a = _0x43e989.x + _0x36dd03 * Math.cos(_0x1ba541);
        const _0x4bba94 = _0x43e989.z + _0x36dd03 * Math.sin(_0x1ba541);
        const _0x4e0331 = { x: _0x7e61a, y: _0x43e989.y, z: _0x4bba94 };
        world.getDimension("overworld")["spawnEntity"]("bn:pollen", _0x4e0331);
        const _0xdb9ee5 = _0x465402 + _0x48e6fb.spawnInterval * 20;
        world.setDynamicProperty("nextPollenSpawnTick", _0xdb9ee5);
      }
    }
    const _0x1fe1bc = world.getDynamicProperty("nextZombieSpawnTick");
    if (_0x1fe1bc && _0x465402 >= _0x1fe1bc) {
      this.spawnNextZombie();
    }
  }
  static startCurrentWave(_0x1514bb) {
    if (!world.getDynamicProperty("gameActive")) return;
    const _0x1bc9e3 = world.getDynamicProperty("currentLevelId");
    const _0x16b3ea = levelData.get(_0x1bc9e3);
    const _0x59db56 = world.getDynamicProperty("currentWave");
    const _0x4dfdcb = _0x16b3ea.zombieSpawning.waves[_0x59db56];
    if (!_0x4dfdcb) {
      console.error("Attempted to start a non-existent wave.");
      return;
    }
    const _0x2515b0 = [];
    let _0x2346cf = _0x4dfdcb.zombieCount;
    if (_0x4dfdcb.specialZombies) {
      for (const _0xc121ff of _0x4dfdcb.specialZombies) {
        for (let _0x1cbb5a = 0; _0x1cbb5a < _0xc121ff.count; _0x1cbb5a++) {
          _0x2515b0.push(_0xc121ff.typeId);
        }
        _0x2346cf -= _0xc121ff.count;
      }
    }
    for (let _0x33de69 = 0; _0x33de69 < _0x2346cf; _0x33de69++) {
      const _0x2c9487 =
        _0x4dfdcb.mobs[Math.floor(Math.random() * _0x4dfdcb.mobs.length)];
      _0x2515b0.push(_0x2c9487);
    }
    for (let _0x58815c = _0x2515b0.length - 1; _0x58815c > 0; _0x58815c--) {
      const _0x6c730 = Math.floor(Math.random() * (_0x58815c + 1));
      [_0x2515b0[_0x58815c], _0x2515b0[_0x6c730]] = [
        _0x2515b0[_0x6c730],
        _0x2515b0[_0x58815c],
      ];
    }
    world.setDynamicProperty("waveSpawnDeck", JSON.stringify(_0x2515b0));
    const _0x701bee = [..._0x16b3ea.zombieSpawning.locations];
    let _0x2fa7a6 = [];
    for (let _0x2b1c14 = _0x701bee.length - 1; _0x2b1c14 > 0; _0x2b1c14--) {
      const _0x4e9529 = Math.floor(Math.random() * (_0x2b1c14 + 1));
      [_0x701bee[_0x2b1c14], _0x701bee[_0x4e9529]] = [
        _0x701bee[_0x4e9529],
        _0x701bee[_0x2b1c14],
      ];
    }
    for (let _0x1c127a = 0; _0x1c127a < _0x4dfdcb.zombieCount; _0x1c127a++) {
      _0x2fa7a6.push(_0x701bee[_0x1c127a % _0x701bee.length]);
    }
    for (let _0x3b2fa4 = _0x2fa7a6.length - 1; _0x3b2fa4 > 0; _0x3b2fa4--) {
      const _0x8ee6cb = Math.floor(Math.random() * (_0x3b2fa4 + 1));
      [_0x2fa7a6[_0x3b2fa4], _0x2fa7a6[_0x8ee6cb]] = [
        _0x2fa7a6[_0x8ee6cb],
        _0x2fa7a6[_0x3b2fa4],
      ];
    }
    world.setDynamicProperty("waveLocationDeck", JSON.stringify(_0x2fa7a6));
    world.setDynamicProperty("nextZombieSpawnTick", system.currentTick + 1);
    if (_0x59db56 === 0) AudioManager.playSound("initial.wave", _0x1514bb);
    else if (_0x59db56 === 1) AudioManager.playSound("second.wave", _0x1514bb);
    const _0x382676 = LanguageManager.get(_0x1514bb, _0x4dfdcb.waveName);
    _0x1514bb.onScreenDisplay.setTitle(_0x382676, {
      subtitle: LanguageManager.get(_0x1514bb, "game.wave_approaching"),
      fadeInDuration: 0x14,
      stayDuration: 0x3c,
      fadeOutDuration: 0x14,
    });
  }
  static spawnNextZombie() {
    const _0x37f765 = world.getDynamicProperty("currentLevelId");
    const _0x470f14 = levelData.get(_0x37f765);
    const _0x39413b = world.getDynamicProperty("currentWave");
    const _0x37ade7 = _0x470f14.zombieSpawning.waves[_0x39413b];
    let _0x425505 = world.getDynamicProperty("zombiesSpawnedThisWave");
    if (_0x425505 >= _0x37ade7.zombieCount) {
      world.setDynamicProperty("nextZombieSpawnTick", 0);
      return;
    }
    const _0x479fc5 = world.getDynamicProperty("waveSpawnDeck");
    const _0x546996 = JSON.parse(_0x479fc5);
    const _0x41ff68 = _0x546996[_0x425505];
    const _0x1bce25 = world.getDynamicProperty("waveLocationDeck");
    const _0x55cbf0 = JSON.parse(_0x1bce25);
    const _0x59448b = _0x55cbf0[_0x425505];
    if (_0x41ff68 && _0x59448b) {
      world.getDimension("overworld")["spawnEntity"](_0x41ff68, _0x59448b);
      world.setDynamicProperty("zombiesSpawnedThisWave", _0x425505 + 1);
    } else {
      console.warn(
        "Spawn deck or location deck is missing an entry for wave " +
          _0x39413b +
          " at index " +
          _0x425505 +
          ".",
      );
    }
    const { minSpawnInterval: _0x9369c2, maxSpawnInterval: _0x2cc7d3 } =
      _0x37ade7;
    const _0x1945d0 = Math.random() * (_0x2cc7d3 - _0x9369c2) + _0x9369c2;
    world.setDynamicProperty(
      "nextZombieSpawnTick",
      system.currentTick + _0x1945d0 * 20,
    );
  }
}
