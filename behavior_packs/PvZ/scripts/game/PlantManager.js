import { system, world } from "@minecraft/server";
import { LanguageManager } from "./LanguageManager.js";

const laneCooldowns = new Map();
const LANE_COOLDOWN_DURATION = 13;
const POLLEN_SCORE_VALUE = 25;
const POLLEN_PICKUP_RADIUS = 1.35;
const POLLEN_SLOW_FALLING_TICKS = 20 * 60;

export class PlantManager {
  static initialize() {
    world.afterEvents.projectileHitEntity.subscribe((event) => {
      const hitResult = event.getEntityHit();
      if (!hitResult) return;
      const targetEntity = hitResult.entity;
      const projectile = event.projectile;
      if (
        projectile.typeId === "bn:projectile_2" &&
        targetEntity.typeId.startsWith("bn:zombie")
      ) {
        targetEntity.addEffect("slowness", 60, { amplifier: 3 });
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
        cost: 50,
        cooldownCategory: "plant_1",
        cooldownTicks: 100,
      },
    ],
    [
      "bn:plant_2",
      {
        nameKey: "plant.peashooter.name",
        entityId: "bn:peashooter",
        cost: 100,
        cooldownCategory: "plant_2",
        cooldownTicks: 150,
      },
    ],
    [
      "bn:plant_3",
      {
        nameKey: "plant.cherry_bomb.name",
        entityId: "bn:cherry_tnt",
        cost: 150,
        cooldownCategory: "plant_3",
        cooldownTicks: 500,
      },
    ],
    [
      "bn:plant_4",
      {
        nameKey: "plant.wallnut.name",
        entityId: "bn:wallnut",
        cost: 50,
        cooldownCategory: "plant_4",
        cooldownTicks: 600,
      },
    ],
    [
      "bn:plant_5",
      {
        nameKey: "plant.potato_mine.name",
        entityId: "bn:potato_mine",
        cost: 25,
        cooldownCategory: "plant_5",
        cooldownTicks: 600,
      },
    ],
    [
      "bn:plant_6",
      {
        nameKey: "plant.snow_pea.name",
        entityId: "bn:snow_pea",
        cost: 175,
        cooldownCategory: "plant_6",
        cooldownTicks: 150,
      },
    ],
  ]);

  static allPlantEntityIds = new Set(
    Array.from(this.plantData.values()).map((p) => p.entityId),
  );

  static plantShootData = new Map([
    [
      "bn:peashooter",
      { projectile: "bn:projectile_1", cooldown: 40, velocity: 1.2 },
    ],
    [
      "bn:snow_pea",
      { projectile: "bn:projectile_2", cooldown: 40, velocity: 1.2 },
    ],
  ]);

  static spawnPollen(dimension, location) {
    const pollen = dimension.spawnEntity("bn:pollen", location);
    try {
      pollen.addEffect("slow_falling", POLLEN_SLOW_FALLING_TICKS, {
        amplifier: 20,
        showParticles: false,
      });
    } catch (err) {
      console.warn(`[PvZ] Failed to apply slow falling to pollen: ${err}`);
    }
    return pollen;
  }

  static collectPollenEntity(player, pollenEntity) {
    if (!pollenEntity || pollenEntity.typeId !== "bn:pollen") {
      return false;
    }

    try {
      if (pollenEntity.hasTag("pvz_collected")) {
        return false;
      }
      pollenEntity.addTag("pvz_collected");
      pollenEntity.remove();
      world.scoreboard
        .getObjective("pollen")
        ?.addScore(player.scoreboardIdentity, POLLEN_SCORE_VALUE);
      player.playSound("sun.pickup", { volume: 0.8, pitch: 1.5 });
      return true;
    } catch (err) {
      console.warn(`[PvZ] Error collecting pollen entity: ${err}`);
      return false;
    }
  }

  static collectNearbyPollen(player) {
    try {
      const query = {
        location: player.location,
        maxDistance: POLLEN_PICKUP_RADIUS,
        type: "bn:pollen",
      };
      const foundEntities = player.dimension.getEntities(query);
      let collected = false;
      for (const pollenEntity of foundEntities) {
        collected = this.collectPollenEntity(player, pollenEntity) || collected;
      }
      return collected;
    } catch (err) {
      console.warn(`[PvZ] Error collecting nearby pollen: ${err}`);
    }
    return false;
  }

  static collectPollen(player) {
    try {
      const raycastResult = player.getBlockFromViewDirection({
        maxDistance: 150,
      });
      if (raycastResult) {
        const query = {
          location: raycastResult.block.location,
          maxDistance: 2.5,
          type: "bn:pollen",
        };
        const foundEntities = player.dimension.getEntities(query);
        if (foundEntities.length > 0) {
          return this.collectPollenEntity(player, foundEntities[0]);
        }
      }
      return this.collectNearbyPollen(player);
    } catch (err) {
      console.warn(`[PvZ] Error collecting pollen: ${err}`);
      return false;
    }
  }

  static updatePlants() {
    const overworld = world.getDimension("overworld");
    const plants = [];
    const zombies = [];
    for (const entity of overworld.getEntities()) {
      if (this.allPlantEntityIds.has(entity.typeId)) {
        plants.push(entity);
      } else if (entity.typeId.startsWith("bn:zombie")) {
        zombies.push(entity);
      }
    }
    if (plants.length === 0) return;
    const additionalZombies = overworld.getEntities({
      families: ["zombie"],
      excludeTypes: ["bn:zombie", "bn:zombie_cone"],
    });
    const allZombies = [...new Set([...zombies, ...additionalZombies])];
    if (allZombies.length === 0) return;
    const currentTick = system.currentTick;

    for (const plant of plants) {
      const shotCooldown = plant.getDynamicProperty("shotCooldown") ?? 0;
      if (shotCooldown > 0) {
        plant.setDynamicProperty("shotCooldown", shotCooldown - 1);
      }
    }

    for (const plant of plants) {
      const shootConfig = this.plantShootData.get(plant.typeId);
      if (!shootConfig) continue;
      const shotCooldown = plant.getDynamicProperty("shotCooldown") ?? 0;
      if (shotCooldown > 0) continue;
      const laneX = Math.floor(plant.location.x);
      const laneCooldownEnd = laneCooldowns.get(laneX) || 0;
      if (currentTick < laneCooldownEnd) continue;

      for (const zombie of allZombies) {
        if (plant.id === zombie.id) continue;
        const inSameLane = Math.floor(zombie.location.x) === laneX;
        const inSameHeight = Math.abs(plant.location.y - zombie.location.y) < 1;
        const isAhead = zombie.location.z > plant.location.z;
        const withinRange = zombie.location.z - plant.location.z < 15;

        if (inSameLane && inSameHeight && isAhead && withinRange) {
          const spawnPos = {
            x: plant.location.x,
            y: plant.location.y + 1,
            z: plant.location.z + 0.7,
          };
          const projectile = overworld.spawnEntity(
            shootConfig.projectile,
            spawnPos,
          );
          plant.runCommand("playanimation @s animation.plant_2.attack");

          const direction = {
            x: zombie.location.x - plant.location.x,
            y: zombie.location.y - plant.location.y,
            z: zombie.location.z - plant.location.z,
          };
          const distance = Math.sqrt(
            direction.x ** 2 + direction.y ** 2 + direction.z ** 2,
          );
          direction.x /= distance;
          direction.y /= distance;
          direction.z /= distance;

          projectile.applyImpulse({
            x: direction.x * shootConfig.velocity,
            y: direction.y * shootConfig.velocity,
            z: direction.z * shootConfig.velocity,
          });

          plant.setDynamicProperty("shotCooldown", shootConfig.cooldown);
          laneCooldowns.set(laneX, currentTick + LANE_COOLDOWN_DURATION);
          break;
        }
      }
    }
  }

  static handleItemUse(player, item) {
    if (item.typeId === "bn:pollen") {
      return this.collectPollen(player);
    }
    if (item.typeId === "bn:shovel") {
      try {
        const raycastResult = player.getBlockFromViewDirection({
          maxDistance: 150,
        });
        if (!raycastResult) return false;
        const targetBlock = raycastResult.block;
        const belowBlock = targetBlock.below();
        const validBlocks = ["minecraft:gold_block", "minecraft:iron_block"];
        if (!belowBlock || !validBlocks.includes(belowBlock.typeId)) {
          return false;
        }
        const y = belowBlock.location.y;
        const blockTypeId = belowBlock.typeId;
        const x = belowBlock.location.x;
        const z = belowBlock.location.z;
        const offsets = [
          { x: 0, z: 0 },
          { x: -1, z: 0 },
          { x: -2, z: 0 },
          { x: 0, z: -1 },
          { x: -1, z: -1 },
          { x: -2, z: -1 },
        ];
        let gridValid = false;
        let gridPos = { x: 0, y: 0, z: 0 };
        for (const offset of offsets) {
          const checkX = x + offset.x;
          const checkZ = z + offset.z;
          let cellValid = true;
          for (let dx = 0; dx < 3; dx++) {
            for (let dz = 0; dz < 2; dz++) {
              const block = player.dimension.getBlock({
                x: checkX + dx,
                y: y,
                z: checkZ + dz,
              });
              if (block?.typeId !== blockTypeId) {
                cellValid = false;
                break;
              }
            }
            if (!cellValid) break;
          }
          if (cellValid) {
            gridValid = true;
            gridPos = {
              x: checkX + 1.5,
              y: y + 2,
              z: checkZ + 1,
            };
            break;
          }
        }
        if (gridValid) {
          const query = {
            location: gridPos,
            maxDistance: 1.8,
            families: ["plant"],
          };
          const foundPlants = player.dimension.getEntities(query);
          if (foundPlants.length > 0) {
            const plantEntity = foundPlants[0];
            system.run(() => {
              plantEntity.remove();
              player.playSound("dig.grass");
            });
            return true;
          }
        }
      } catch (err) {
        console.error(`[PvZ] Error removing plant: ${err}`);
      }
      return false;
    }
    const plantConfig = this.plantData.get(item.typeId);
    if (!plantConfig) return false;
    try {
      const cooldown = player.getItemCooldown(plantConfig.cooldownCategory);
      if (cooldown > 0) {
        const secondsRemaining = Math.ceil(cooldown / 20);
        const plantName = LanguageManager.get(player, plantConfig.nameKey);
        player.sendMessage(
          LanguageManager.get(
            player,
            "plant.on_cooldown",
            plantName,
            secondsRemaining,
          ),
        );
        player.playSound("note.bass", { pitch: 0.5 });
        return true;
      }
      const pollenObjective = world.scoreboard.getObjective("pollen");
      const currentPollen =
        pollenObjective?.getScore(player.scoreboardIdentity) ?? 0;
      if (currentPollen < plantConfig.cost) {
        const plantName = LanguageManager.get(player, plantConfig.nameKey);
        player.sendMessage(
          LanguageManager.get(
            player,
            "plant.not_enough_pollen",
            plantName,
            plantConfig.cost,
          ),
        );
        player.playSound("note.bass", { pitch: 0.5 });
        return true;
      }
      const raycastResult = player.getBlockFromViewDirection({
        maxDistance: 150,
      });
      if (!raycastResult) return false;
      const targetBlock = raycastResult.block;
      const belowBlock = targetBlock.below();
      const validBlocks = ["minecraft:gold_block", "minecraft:iron_block"];
      if (!belowBlock || !validBlocks.includes(belowBlock.typeId)) {
        player.sendMessage(
          LanguageManager.get(player, "plant.invalid_surface"),
        );
        return false;
      }
      const y = belowBlock.location.y;
      const blockTypeId = belowBlock.typeId;
      const x = belowBlock.location.x;
      const z = belowBlock.location.z;
      const offsets = [
        { x: 0, z: 0 },
        { x: -1, z: 0 },
        { x: -2, z: 0 },
        { x: 0, z: -1 },
        { x: -1, z: -1 },
        { x: -2, z: -1 },
      ];
      let gridValid = false;
      let gridPos = { x: 0, y: 0, z: 0 };
      for (const offset of offsets) {
        const checkX = x + offset.x;
        const checkZ = z + offset.z;
        let cellValid = true;
        for (let dx = 0; dx < 3; dx++) {
          for (let dz = 0; dz < 2; dz++) {
            const block = player.dimension.getBlock({
              x: checkX + dx,
              y: y,
              z: checkZ + dz,
            });
            if (block?.typeId !== blockTypeId) {
              cellValid = false;
              break;
            }
          }
          if (!cellValid) break;
        }
        if (cellValid) {
          gridValid = true;
          gridPos = {
            x: checkX + 1.5,
            y: y + 2,
            z: checkZ + 1,
          };
          break;
        }
      }
      if (!gridValid) {
        player.sendMessage(LanguageManager.get(player, "plant.no_foundation"));
        return false;
      }
      const query = {
        location: gridPos,
        maxDistance: 1.8,
        families: ["plant"],
      };
      const foundPlants = player.dimension.getEntities(query);
      if (foundPlants.length > 0) {
        player.sendMessage(LanguageManager.get(player, "plant.space_occupied"));
        return false;
      }
      system.run(() => {
        player.dimension.spawnEntity(plantConfig.entityId, gridPos);
        player.playSound("dig.grass");
        pollenObjective.addScore(player.scoreboardIdentity, -plantConfig.cost);
        player.startItemCooldown(
          plantConfig.cooldownCategory,
          plantConfig.cooldownTicks,
        );
      });
      return true;
    } catch (err) {
      console.error(`[PvZ] Error in placePlant: ${err}`);
    }
    return false;
  }
}
