import { system, world } from "@minecraft/server";
import { LanguageManager } from "./LanguageManager.js";
const laneCooldowns = new Map();
const LANE_COOLDOWN_DURATION = 13;
export class PlantManager {
  static initialize() {
    world.afterEvents.projectileHitEntity.subscribe((_0x5c5a07) => {
      const _0x1e5de0 = _0x5c5a07.getEntityHit();
      if (!_0x1e5de0) return;
      const _0x3230a7 = _0x1e5de0.entity;
      const _0x272b1b = _0x5c5a07.projectile;
      if (
        _0x272b1b.typeId === "bn:projectile_2" &&
        _0x3230a7.typeId.startsWith("bn:zombie")
      ) {
        _0x3230a7.addEffect("slowness", 60, { amplifier: 0x3 });
      }
    });
  }
  static resetCooldowns() {
    laneCooldowns.clear();
  }
  static plantData = new Map([
    [
      "bn:plant_1",
      {
        nameKey: "plant.sunflower.name",
        entityId: "bn:sunflower",
        cost: 0x32,
        cooldownCategory: "plant_1",
        cooldownTicks: 0x64,
      },
    ],
    [
      "bn:plant_2",
      {
        nameKey: "plant.peashooter.name",
        entityId: "bn:peashooter",
        cost: 0x64,
        cooldownCategory: "plant_2",
        cooldownTicks: 0x96,
      },
    ],
    [
      "bn:plant_3",
      {
        nameKey: "plant.cherry_bomb.name",
        entityId: "bn:cherry_tnt",
        cost: 0x96,
        cooldownCategory: "plant_3",
        cooldownTicks: 0x1f4,
      },
    ],
    [
      "bn:plant_4",
      {
        nameKey: "plant.wallnut.name",
        entityId: "bn:wallnut",
        cost: 0x32,
        cooldownCategory: "plant_4",
        cooldownTicks: 0x258,
      },
    ],
    [
      "bn:plant_5",
      {
        nameKey: "plant.potato_mine.name",
        entityId: "bn:potato_mine",
        cost: 0x19,
        cooldownCategory: "plant_5",
        cooldownTicks: 0x258,
      },
    ],
    [
      "bn:plant_6",
      {
        nameKey: "plant.snow_pea.name",
        entityId: "bn:snow_pea",
        cost: 0xaf,
        cooldownCategory: "plant_6",
        cooldownTicks: 0x96,
      },
    ],
  ]);
  static allPlantEntityIds = new Set(
    Array.from(this.plantData.values())["map"]((p) => p.entityId),
  );
  static plantShootData = new Map([
    [
      "bn:peashooter",
      { projectile: "bn:projectile_1", cooldown: 0x28, velocity: 1.2 },
    ],
    [
      "bn:snow_pea",
      { projectile: "bn:projectile_2", cooldown: 0x28, velocity: 1.2 },
    ],
  ]);
  static collectPollen(_0x30123a) {
    try {
      const _0x423494 = _0x30123a.getBlockFromViewDirection({
        maxDistance: 0x96,
      });
      if (!_0x423494) return ![];
      const _0x412c8c = {
        location: _0x423494.block.location,
        maxDistance: 0x2,
        type: "bn:pollen",
      };
      const _0x34cf17 = _0x30123a.dimension.getEntities(_0x412c8c);
      if (_0x34cf17.length > 0) {
        const _0x33e437 = _0x34cf17[0];
        system.run(() => {
          _0x33e437.remove();
          world.scoreboard
            .getObjective("pollen")
            ?.["addScore"](_0x30123a.scoreboardIdentity, 25);
          _0x30123a.playSound("sun.pickup", { volume: 0.8, pitch: 1.5 });
        });
        return !![];
      }
    } catch (_0x5418c0) {
      console.error("[PvZ] Error collecting pollen: " + _0x5418c0);
    }
    return ![];
  }
  static updatePlants() {
    const _0x39d13e = world.getDimension("overworld");
    const _0x24a69d = [];
    const _0x311603 = [];
    for (const _0x37a808 of _0x39d13e.getEntities()) {
      if (this.allPlantEntityIds.has(_0x37a808.typeId)) {
        _0x24a69d.push(_0x37a808);
      } else if (_0x37a808.typeId.startsWith("bn:zombie")) {
        _0x311603.push(_0x37a808);
      }
    }
    if (_0x24a69d.length === 0) return;
    const _0x24003e = _0x39d13e.getEntities({
      families: ["zombie"],
      excludeTypes: ["bn:zombie", "bn:zombie_cone"],
    });
    const _0x6d7ad3 = [...new Set([..._0x311603, ..._0x24003e])];
    if (_0x6d7ad3.length === 0) return;
    const _0x274c20 = system.currentTick;
    for (const _0x198789 of _0x24a69d) {
      const _0x8814aa = _0x198789.getDynamicProperty("shotCooldown") ?? 0;
      if (_0x8814aa > 0) {
        _0x198789.setDynamicProperty("shotCooldown", _0x8814aa - 1);
      }
    }
    for (const _0x1be6d1 of _0x24a69d) {
      const _0x17aef4 = this.plantShootData.get(_0x1be6d1.typeId);
      if (!_0x17aef4) continue;
      const _0x926a0 = _0x1be6d1.getDynamicProperty("shotCooldown") ?? 0;
      if (_0x926a0 > 0) continue;
      const _0x1ec76b = Math.floor(_0x1be6d1.location.x);
      const _0x488c26 = laneCooldowns.get(_0x1ec76b) || 0;
      if (_0x274c20 < _0x488c26) continue;
      for (const _0xe60fc7 of _0x6d7ad3) {
        if (_0x1be6d1.id === _0xe60fc7.id) continue;
        const _0x6f5070 = Math.floor(_0xe60fc7.location.x) === _0x1ec76b;
        const _0x50461e =
          Math.abs(_0x1be6d1.location.y - _0xe60fc7.location.y) < 1;
        const _0x1e31cf = _0xe60fc7.location.z > _0x1be6d1.location.z;
        const _0x1b0688 = _0xe60fc7.location.z - _0x1be6d1.location.z < 15;
        if (_0x6f5070 && _0x50461e && _0x1e31cf && _0x1b0688) {
          const _0x692909 = {
            x: _0x1be6d1.location.x,
            y: _0x1be6d1.location.y + 1,
            z: _0x1be6d1.location.z + 0.7,
          };
          const _0x14291e = _0x39d13e.spawnEntity(
            _0x17aef4.projectile,
            _0x692909,
          );
          _0x1be6d1.runCommandAsync(
            "playanimation @s animation.plant_2.attack",
          );
          const _0xf1bb10 = {
            x: _0xe60fc7.location.x - _0x1be6d1.location.x,
            y: _0xe60fc7.location.y - _0x1be6d1.location.y,
            z: _0xe60fc7.location.z - _0x1be6d1.location.z,
          };
          const _0x22e86d = Math.sqrt(
            _0xf1bb10.x ** 2 + _0xf1bb10.y ** 2 + _0xf1bb10.z ** 2,
          );
          _0xf1bb10.x /= _0x22e86d;
          _0xf1bb10.y /= _0x22e86d;
          _0xf1bb10.z /= _0x22e86d;
          _0x14291e.applyImpulse({
            x: _0xf1bb10.x * _0x17aef4.velocity,
            y: _0xf1bb10.y * _0x17aef4.velocity,
            z: _0xf1bb10.z * _0x17aef4.velocity,
          });
          _0x1be6d1.setDynamicProperty("shotCooldown", _0x17aef4.cooldown);
          laneCooldowns.set(_0x1ec76b, _0x274c20 + LANE_COOLDOWN_DURATION);
          break;
        }
      }
    }
  }
  static handleItemUse(_0x24f21e, _0x4656a0) {
    if (_0x4656a0.typeId === "bn:pollen") {
      return this.collectPollen(_0x24f21e);
    }
    if (_0x4656a0.typeId === "bn:shovel") {
      try {
        const _0x1bbcb2 = _0x24f21e.getBlockFromViewDirection({
          maxDistance: 0x96,
        });
        if (!_0x1bbcb2) return ![];
        const _0x6670fe = _0x1bbcb2.block;
        const _0xb38dfc = _0x6670fe.below();
        const _0x528025 = ["minecraft:gold_block", "minecraft:iron_block"];
        if (!_0xb38dfc || !_0x528025.includes(_0xb38dfc.typeId)) {
          return ![];
        }
        const _0x4170c5 = _0xb38dfc.location.y;
        const _0x5ca731 = _0xb38dfc.typeId;
        const _0x270385 = _0xb38dfc.location.x;
        const _0x488d35 = _0xb38dfc.location.z;
        const _0x3357d4 = [
          { x: 0x0, z: 0x0 },
          { x: -1, z: 0x0 },
          { x: -2, z: 0x0 },
          { x: 0x0, z: -1 },
          { x: -1, z: -1 },
          { x: -2, z: -1 },
        ];
        let _0x268a8d = ![];
        let _0x2607bf = { x: 0x0, y: 0x0, z: 0x0 };
        for (const _0x5bd31e of _0x3357d4) {
          const _0x1d238e = _0x270385 + _0x5bd31e.x;
          const _0x1b2eb3 = _0x488d35 + _0x5bd31e.z;
          let _0x28c2b2 = !![];
          for (let _0x2d8eac = 0; _0x2d8eac < 3; _0x2d8eac++) {
            for (let _0x547c90 = 0; _0x547c90 < 2; _0x547c90++) {
              const _0x526c7f = _0x24f21e.dimension.getBlock({
                x: _0x1d238e + _0x2d8eac,
                y: _0x4170c5,
                z: _0x1b2eb3 + _0x547c90,
              });
              if (_0x526c7f?.["typeId"] !== _0x5ca731) {
                _0x28c2b2 = ![];
                break;
              }
            }
            if (!_0x28c2b2) break;
          }
          if (_0x28c2b2) {
            _0x268a8d = !![];
            _0x2607bf = {
              x: _0x1d238e + 1.5,
              y: _0x4170c5 + 2,
              z: _0x1b2eb3 + 1,
            };
            break;
          }
        }
        if (_0x268a8d) {
          const _0x5481d0 = {
            location: _0x2607bf,
            maxDistance: 1.8,
            families: ["plant"],
          };
          const _0x6ed2e0 = _0x24f21e.dimension.getEntities(_0x5481d0);
          if (_0x6ed2e0.length > 0) {
            const _0x57f9fb = _0x6ed2e0[0];
            system.run(() => {
              _0x57f9fb.remove();
              _0x24f21e.playSound("dig.grass");
            });
            return !![];
          }
        }
      } catch (_0x463177) {
        console.error("[PvZ] Error removing plant: " + _0x463177);
      }
      return ![];
    }
    const _0x39b0e2 = this.plantData.get(_0x4656a0.typeId);
    if (!_0x39b0e2) return ![];
    try {
      const _0x4023a5 = _0x24f21e.getItemCooldown(_0x39b0e2.cooldownCategory);
      if (_0x4023a5 > 0) {
        const _0x3884b2 = Math.ceil(_0x4023a5 / 20);
        const _0x546f2a = LanguageManager.get(_0x24f21e, _0x39b0e2.nameKey);
        _0x24f21e.sendMessage(
          LanguageManager.get(
            _0x24f21e,
            "plant.on_cooldown",
            _0x546f2a,
            _0x3884b2,
          ),
        );
        _0x24f21e.playSound("note.bass", { pitch: 0.5 });
        return !![];
      }
      const _0x2effe5 = world.scoreboard.getObjective("pollen");
      const _0x3b1ae3 =
        _0x2effe5?.["getScore"](_0x24f21e.scoreboardIdentity) ?? 0;
      if (_0x3b1ae3 < _0x39b0e2.cost) {
        const _0x38da0f = LanguageManager.get(_0x24f21e, _0x39b0e2.nameKey);
        _0x24f21e.sendMessage(
          LanguageManager.get(
            _0x24f21e,
            "plant.not_enough_pollen",
            _0x38da0f,
            _0x39b0e2.cost,
          ),
        );
        _0x24f21e.playSound("note.bass", { pitch: 0.5 });
        return !![];
      }
      const _0x3a4883 = _0x24f21e.getBlockFromViewDirection({
        maxDistance: 0x96,
      });
      if (!_0x3a4883) return ![];
      const _0x268331 = _0x3a4883.block;
      const _0x3789df = _0x268331.below();
      const _0x4b287a = ["minecraft:gold_block", "minecraft:iron_block"];
      if (!_0x3789df || !_0x4b287a.includes(_0x3789df.typeId)) {
        _0x24f21e.sendMessage(
          LanguageManager.get(_0x24f21e, "plant.invalid_surface"),
        );
        return ![];
      }
      const _0x371192 = _0x3789df.location.y;
      const _0x182259 = _0x3789df.typeId;
      const _0x4306b5 = _0x3789df.location.x;
      const _0xbeaec5 = _0x3789df.location.z;
      const _0x2f9f66 = [
        { x: 0x0, z: 0x0 },
        { x: -1, z: 0x0 },
        { x: -2, z: 0x0 },
        { x: 0x0, z: -1 },
        { x: -1, z: -1 },
        { x: -2, z: -1 },
      ];
      let _0x1ff3aa = ![];
      let _0x1e8f17 = { x: 0x0, y: 0x0, z: 0x0 };
      for (const _0x257a24 of _0x2f9f66) {
        const _0x338701 = _0x4306b5 + _0x257a24.x;
        const _0x2d0263 = _0xbeaec5 + _0x257a24.z;
        let _0x1bc1ef = !![];
        for (let _0x3a794e = 0; _0x3a794e < 3; _0x3a794e++) {
          for (let _0x193b2f = 0; _0x193b2f < 2; _0x193b2f++) {
            const _0x2f5662 = _0x24f21e.dimension.getBlock({
              x: _0x338701 + _0x3a794e,
              y: _0x371192,
              z: _0x2d0263 + _0x193b2f,
            });
            if (_0x2f5662?.["typeId"] !== _0x182259) {
              _0x1bc1ef = ![];
              break;
            }
          }
          if (!_0x1bc1ef) break;
        }
        if (_0x1bc1ef) {
          _0x1ff3aa = !![];
          _0x1e8f17 = {
            x: _0x338701 + 1.5,
            y: _0x371192 + 2,
            z: _0x2d0263 + 1,
          };
          break;
        }
      }
      if (!_0x1ff3aa) {
        _0x24f21e.sendMessage(
          LanguageManager.get(_0x24f21e, "plant.no_foundation"),
        );
        return ![];
      }
      const _0x5be511 = {
        location: _0x1e8f17,
        maxDistance: 1.8,
        families: ["plant"],
      };
      const _0x5f5321 = _0x24f21e.dimension.getEntities(_0x5be511);
      if (_0x5f5321.length > 0) {
        _0x24f21e.sendMessage(
          LanguageManager.get(_0x24f21e, "plant.space_occupied"),
        );
        return ![];
      }
      system.run(() => {
        _0x24f21e.dimension.spawnEntity(_0x39b0e2.entityId, _0x1e8f17);
        _0x24f21e.playSound("dig.grass");
        _0x2effe5.addScore(_0x24f21e.scoreboardIdentity, -_0x39b0e2.cost);
        _0x24f21e.startItemCooldown(
          _0x39b0e2.cooldownCategory,
          _0x39b0e2.cooldownTicks,
        );
      });
      return !![];
    } catch (_0x46dd1b) {
      console.error("[PvZ] Error in placePlant: " + _0x46dd1b);
    }
    return ![];
  }
}
