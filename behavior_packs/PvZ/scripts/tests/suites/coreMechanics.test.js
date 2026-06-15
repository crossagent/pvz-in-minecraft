import { system, world } from "@minecraft/server";
import { LevelManager } from "../../game/LevelManager.js";
import { PlantManager } from "../../game/PlantManager.js";
import { TutorialManager } from "../../game/TutorialManager.js";
import { levelData } from "../../levels.js";
import { assert, assertEquals } from "../harness/assertions.js";
import {
  createFakePlayer,
  createFoundationViewBlock,
  createPlantingDimension,
} from "../harness/fakePlayer.js";
import {
  deleteTestLevel,
  getScore,
  setScore,
} from "../harness/worldState.js";
import { waitTicks } from "../harness/time.js";

const TUTORIAL_LEVEL_ID = "gametest_tutorial_flow";

function createTutorialTestLevel() {
  return {
    name: "level.1.name",
    isTutorial: true,
    playerStartLocation: { x: 40, y: 80, z: 40 },
    lawnmowers: [],
    startItems: [],
    scoreboardsToReset: ["pollen", "points"],
    startingPollen: 0,
    zombieKillPoints: 10,
    zombieSpawning: {
      initialDelay: 1,
      intermission: 1,
      waves: [
        {
          waveName: "level.1.wave.1",
          zombieCount: 1,
          minSpawnInterval: 1,
          maxSpawnInterval: 1,
          mobs: ["bn:zombie"],
        },
      ],
      locations: [{ x: 44.5, y: 80, z: 49.5 }],
    },
    pollenSpawning: {
      spawnInterval: 1,
      centerLocation: { x: 40, y: 82, z: 40 },
      radius: 1,
    },
  };
}

export const coreMechanicsCases = [
  {
    id: "core_mechanics.pollen_collection_scores_and_feedback",
    run() {
      const player = createFakePlayer({
        location: { x: 30, y: 80, z: 30 },
      });
      setScore("pollen", player.scoreboardIdentity, 0);

      const pollen = PlantManager.spawnPollen(player.dimension, {
        x: 30,
        y: 80,
        z: 30,
      });

      assert(
        PlantManager.collectPollenEntity(player, pollen),
        "Pollen collection helper returned false.",
      );
      assertEquals(
        getScore("pollen", player.scoreboardIdentity),
        25,
        "Pollen collection did not add sun score.",
      );
      assert(
        player.actionBars.some((text) => text.includes("Sun:")),
        "Pollen collection did not update actionbar feedback.",
      );
    },
  },
  {
    id: "core_mechanics.tutorial_flow_reaches_gameplay",
    async run() {
      const player = createFakePlayer({
        location: { x: 40, y: 80, z: 40 },
      });
      const originalFirstPollenLocation = TutorialManager.firstPollenLocation;
      const originalSecondPollenLocations =
        TutorialManager.secondPollenLocations;
      const originalThirdPollenLocations = TutorialManager.thirdPollenLocations;

      try {
        TutorialManager.firstPollenLocation = { x: 40, y: 80, z: 40 };
        TutorialManager.secondPollenLocations = [
          { x: 39, y: 80, z: 40 },
          { x: 41, y: 80, z: 40 },
          { x: 40, y: 80, z: 39 },
        ];
        TutorialManager.thirdPollenLocations = [
          { x: 39, y: 80, z: 41 },
          { x: 41, y: 80, z: 41 },
          { x: 40, y: 80, z: 42 },
          { x: 40, y: 80, z: 38 },
        ];

        levelData.set(TUTORIAL_LEVEL_ID, createTutorialTestLevel());
        world.setDynamicProperty("gameActive", true);
        world.setDynamicProperty("currentLevelId", TUTORIAL_LEVEL_ID);
        setScore("pollen", player.scoreboardIdentity, 0);

        TutorialManager.startTutorial(
          player,
          levelData.get(TUTORIAL_LEVEL_ID),
        );
        assert(
          world.getDynamicProperty("tutorialActive"),
          "Tutorial did not activate.",
        );

        setScore("pollen", player.scoreboardIdentity, 25);
        TutorialManager.updatePlayer(player);
        assertEquals(
          TutorialManager.getTutorialState(player),
          2,
          "Tutorial did not move to collect-more-sun state.",
        );

        setScore("pollen", player.scoreboardIdentity, 100);
        TutorialManager.updatePlayer(player);
        assertEquals(
          TutorialManager.getTutorialState(player),
          3,
          "Tutorial did not move to first peashooter placement state.",
        );
        assert(
          player.inventoryContainer.addedItems.some(
            (itemStack) => itemStack.typeId === "bn:plant_2",
          ),
          "Tutorial did not give the peashooter item.",
        );

        player.dimension.spawnEntity("bn:peashooter", {
          x: 40.5,
          y: 80,
          z: 41.5,
        });
        TutorialManager.updatePlayer(player);
        assertEquals(
          TutorialManager.getTutorialState(player),
          4,
          "Tutorial did not detect the first peashooter.",
        );

        setScore("pollen", player.scoreboardIdentity, 100);
        TutorialManager.updatePlayer(player);
        assertEquals(
          TutorialManager.getTutorialState(player),
          5,
          "Tutorial did not move to second peashooter placement state.",
        );

        player.dimension.spawnEntity("bn:peashooter", {
          x: 41.5,
          y: 80,
          z: 41.5,
        });
        TutorialManager.updatePlayer(player);
        assertEquals(
          TutorialManager.getTutorialState(player),
          6,
          "Tutorial did not complete after the second peashooter.",
        );

        TutorialManager.updatePlayer(player);
        assertEquals(
          world.getDynamicProperty("tutorialActive"),
          false,
          "Tutorial did not deactivate after completion.",
        );
        assert(
          world.getDynamicProperty("nextWaveStartTick") > system.currentTick,
          "Tutorial completion did not schedule gameplay waves.",
        );
      } finally {
        TutorialManager.firstPollenLocation = originalFirstPollenLocation;
        TutorialManager.secondPollenLocations = originalSecondPollenLocations;
        TutorialManager.thirdPollenLocations = originalThirdPollenLocations;
        deleteTestLevel(levelData, TUTORIAL_LEVEL_ID);
      }
    },
  },
  {
    id: "core_mechanics.planting_spends_sun_and_spawns_plant",
    async run() {
      const foundationLocation = { x: 60, y: 80, z: 60 };
      const expectedPlantLocation = { x: 61.5, y: 82, z: 61 };
      const player = createFakePlayer({
        location: { x: 60, y: 82, z: 58 },
        dimension: createPlantingDimension(),
        viewBlock: {
          block: createFoundationViewBlock(foundationLocation),
        },
      });

      setScore("pollen", player.scoreboardIdentity, 100);

      assert(
        PlantManager.handleItemUse(player, { typeId: "bn:plant_2" }),
        "Plant item use did not handle peashooter placement.",
      );

      await waitTicks(2);

      assertEquals(
        getScore("pollen", player.scoreboardIdentity),
        0,
        "Planting did not spend the peashooter sun cost.",
      );
      assertEquals(
        player.cooldowns.get("plant_2"),
        150,
        "Planting did not start the peashooter cooldown.",
      );

      const planted = world.getDimension("overworld").getEntities({
        type: "bn:peashooter",
        location: expectedPlantLocation,
        maxDistance: 1.5,
      });
      assert(planted.length > 0, "Planting did not spawn a peashooter.");
    },
  },
];
