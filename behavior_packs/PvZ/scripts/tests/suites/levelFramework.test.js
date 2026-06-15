import { world } from "@minecraft/server";
import { CutsceneManager } from "../../game/CutsceneManager.js";
import { LevelManager } from "../../game/LevelManager.js";
import { MenuManager } from "../../game/MenuManager.js";
import { levelData } from "../../levels.js";
import {
  assert,
  assertEquals,
  assertIncludes,
  assertLocationClose,
} from "../harness/assertions.js";
import { createFakePlayer } from "../harness/fakePlayer.js";
import {
  deleteTestLevel,
  getScore,
} from "../harness/worldState.js";

const FRAMEWORK_LEVEL_ID = "gametest_level_framework";
const MENU_LEVEL_ID = "gametest_menu_restart";

function createTestLevel(overrides = {}) {
  return {
    name: "level.1.name",
    playerStartLocation: { x: 11, y: 80, z: 12 },
    lawnmowers: [{ x: 12.5, y: 80, z: 13.5 }],
    startItems: [
      { slot: 0, typeId: "bn:plant_1", amount: 1 },
      { slot: 8, typeId: "bn:shovel", amount: 1 },
    ],
    scoreboardsToReset: ["pollen", "points"],
    startingPollen: 75,
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
      locations: [{ x: 14.5, y: 80, z: 18.5 }],
    },
    pollenSpawning: {
      spawnInterval: 1,
      centerLocation: { x: 12, y: 82, z: 14 },
      radius: 1,
    },
    ...overrides,
  };
}

export const levelFrameworkCases = [
  {
    id: "level_framework.cutscene_recovers_controls",
    async run() {
      const player = createFakePlayer();

      await CutsceneManager.playStartCutscene(player, []);

      assertIncludes(
        player.commands,
        "inputpermission set @s camera disabled",
        "Cutscene did not disable camera input.",
      );
      assertIncludes(
        player.commands,
        "inputpermission set @s movement disabled",
        "Cutscene did not disable movement input.",
      );
      assertIncludes(
        player.commands,
        "inputpermission set @s camera enabled",
        "Cutscene did not restore camera input.",
      );
      assertIncludes(
        player.commands,
        "inputpermission set @s movement enabled",
        "Cutscene did not restore movement input.",
      );
      assert(
        player.cameraCalls.some((call) => call.clear),
        "Cutscene did not clear the scripted camera.",
      );
    },
  },
  {
    id: "level_framework.start_level_initializes_runtime",
    async run() {
      const player = createFakePlayer();

      try {
        levelData.set(FRAMEWORK_LEVEL_ID, createTestLevel());

        await LevelManager.startLevel(player, FRAMEWORK_LEVEL_ID);

        assertLocationClose(
          player.teleportLocation,
          { x: 11, y: 80, z: 12 },
          0.01,
          "Level start did not teleport the player.",
        );
        assertEquals(
          world.getDynamicProperty("currentLevelId"),
          FRAMEWORK_LEVEL_ID,
          "Level start did not set currentLevelId.",
        );
        assert(
          world.getDynamicProperty("gameActive"),
          "Level start did not activate gameplay.",
        );
        assertEquals(
          getScore("pollen", player.scoreboardIdentity),
          75,
          "Level start did not initialize sun score.",
        );
        assertEquals(
          getScore("points", player.scoreboardIdentity),
          0,
          "Level start did not reset points score.",
        );
        assertEquals(
          player.inventoryContainer.getItem(0)?.typeId,
          "bn:plant_1",
          "Level start did not place the starting plant item.",
        );
        assertEquals(
          player.inventoryContainer.getItem(8)?.typeId,
          "bn:shovel",
          "Level start did not place the shovel item.",
        );

        const mowerCount = player.dimension.getEntities({
          type: "bn:lawnmower",
          location: { x: 12.5, y: 80, z: 13.5 },
          maxDistance: 2,
        }).length;
        assert(mowerCount > 0, "Level start did not spawn lawnmowers.");
      } finally {
        deleteTestLevel(levelData, FRAMEWORK_LEVEL_ID);
      }
    },
  },
  {
    id: "level_framework.menu_restarts_active_run",
    async run() {
      const player = createFakePlayer();

      try {
        levelData.set(
          MENU_LEVEL_ID,
          createTestLevel({
            playerStartLocation: { x: 21, y: 80, z: 22 },
            lawnmowers: [],
            startItems: [],
            scoreboardsToReset: [],
          }),
        );

        const levelKeys = Array.from(levelData.keys());
        const testSelection = levelKeys.indexOf(MENU_LEVEL_ID);
        const previousLevelId = levelKeys[testSelection - 1];

        world.setDynamicProperty("gameActive", true);
        world.setDynamicProperty("tutorialActive", true);
        world.setDynamicProperty("currentLevelId", "level1");
        world.setDynamicProperty(
          "completedLevels",
          JSON.stringify([previousLevelId]),
        );

        await MenuManager.handleLevelSelection(player, {
          selection: testSelection,
        });

        assertIncludes(
          player.messages,
          "[PvZ] Restarting the current run.",
          "Menu did not report active run restart.",
        );
        assertLocationClose(
          player.teleportLocation,
          { x: 21, y: 80, z: 22 },
          0.01,
          "Menu restart did not start the selected level.",
        );
        assertEquals(
          world.getDynamicProperty("currentLevelId"),
          MENU_LEVEL_ID,
          "Menu restart did not switch to the selected level.",
        );
      } finally {
        deleteTestLevel(levelData, MENU_LEVEL_ID);
      }
    },
  },
];
