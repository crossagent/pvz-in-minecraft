import { world } from "@minecraft/server";
import { GameManager } from "../../game/GameManager.js";
import { LevelManager } from "../../game/LevelManager.js";
import { PlantManager } from "../../game/PlantManager.js";
import { levelData } from "../../levels.js";
import { assert, assertEquals } from "../harness/assertions.js";
import { createFakePlayer } from "../harness/fakePlayer.js";
import { deleteTestLevel } from "../harness/worldState.js";

const WAVE_LEVEL_ID = "gametest_wave_spawning";
const LOSS_LEVEL_ID = "gametest_loss_state";

function createWaveTestLevel() {
  return {
    name: "level.1.name",
    playerStartLocation: { x: 50, y: 80, z: 50 },
    lawnmowers: [],
    startItems: [],
    scoreboardsToReset: [],
    zombieKillPoints: 10,
    zombieSpawning: {
      initialDelay: 1,
      intermission: 1,
      waves: [
        {
          waveName: "level.1.wave.1",
          zombieCount: 3,
          minSpawnInterval: 1,
          maxSpawnInterval: 1,
          mobs: ["bn:zombie"],
          specialZombies: [{ typeId: "bn:zombie_cone", count: 1 }],
        },
      ],
      locations: [
        { x: 52.5, y: 80, z: 62.5 },
        { x: 53.5, y: 80, z: 62.5 },
      ],
    },
  };
}

export const unitInteractionCases = [
  {
    id: "unit_interactions.peashooter_fires_at_zombie_in_lane",
    run() {
      const dimension = world.getDimension("overworld");
      const plant = dimension.spawnEntity("bn:peashooter", {
        x: 60.5,
        y: 80,
        z: 60.5,
      });
      dimension.spawnEntity("bn:zombie", {
        x: 60.5,
        y: 80,
        z: 62.5,
      });

      PlantManager.updatePlants();

      const projectiles = dimension.getEntities({
        type: "bn:projectile_1",
        location: { x: 60.5, y: 81, z: 61.2 },
        maxDistance: 6,
      });
      assert(projectiles.length > 0, "Peashooter did not fire a projectile.");
      assert(
        (plant.getDynamicProperty("shotCooldown") ?? 0) > 0,
        "Peashooter did not enter shot cooldown.",
      );
    },
  },
  {
    id: "unit_interactions.wave_spawner_builds_deck_and_spawns",
    run() {
      const player = createFakePlayer({
        location: { x: 90, y: 80, z: 90 },
      });

      try {
        levelData.set(WAVE_LEVEL_ID, createWaveTestLevel());
        world.setDynamicProperty("gameActive", true);
        world.setDynamicProperty("currentLevelId", WAVE_LEVEL_ID);
        world.setDynamicProperty("currentWave", 0);
        world.setDynamicProperty("zombiesKilledThisWave", 0);
        world.setDynamicProperty("zombiesSpawnedThisWave", 0);

        LevelManager.startCurrentWave(player);

        const spawnDeck = JSON.parse(
          world.getDynamicProperty("waveSpawnDeck"),
        );
        const locationDeck = JSON.parse(
          world.getDynamicProperty("waveLocationDeck"),
        );

        assertEquals(
          spawnDeck.length,
          3,
          "Wave spawn deck did not match wave zombie count.",
        );
        assert(
          spawnDeck.includes("bn:zombie_cone"),
          "Wave spawn deck did not include the configured special zombie.",
        );
        assertEquals(
          locationDeck.length,
          3,
          "Wave location deck did not match wave zombie count.",
        );

        LevelManager.spawnNextZombie();
        assertEquals(
          world.getDynamicProperty("zombiesSpawnedThisWave"),
          1,
          "Wave spawner did not increment spawned zombie count.",
        );

        const spawnedZombies = world
          .getDimension("overworld")
          .getEntities()
          .filter((entity) => entity.typeId.startsWith("bn:zombie"));
        assert(spawnedZombies.length > 0, "Wave spawner did not spawn zombie.");
      } finally {
        deleteTestLevel(levelData, WAVE_LEVEL_ID);
      }
    },
  },
  {
    id: "unit_interactions.zombie_reaching_house_ends_level",
    run() {
      try {
        levelData.set(LOSS_LEVEL_ID, createWaveTestLevel());
        world.setDynamicProperty("gameActive", true);
        world.setDynamicProperty("currentLevelId", LOSS_LEVEL_ID);

        GameManager.handleEntityHit({
          damagingEntity: { typeId: "bn:zombie" },
          hitEntity: { typeId: "bn:dummy" },
        });

        assertEquals(
          world.getDynamicProperty("gameActive"),
          false,
          "Zombie hitting the house dummy did not end the level.",
        );
        assertEquals(
          world.getDynamicProperty("currentLevelId"),
          "",
          "Losing the level did not clear currentLevelId.",
        );
      } finally {
        deleteTestLevel(levelData, LOSS_LEVEL_ID);
      }
    },
  },
];
