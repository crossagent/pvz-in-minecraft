import { world, system, DisplaySlotId } from "@minecraft/server";
import * as rg from "@minecraft/server-gametest";
import { CutsceneManager } from "../game/CutsceneManager.js";
import { LevelManager } from "../game/LevelManager.js";
import { MenuManager } from "../game/MenuManager.js";
import { PlantManager } from "../game/PlantManager.js";
import { levelData } from "../levels.js";

const TEST_NAME = "PvZTests:sanity_check";
const TEST_RUN_COMMAND = `gametest run ${TEST_NAME}`;
const TEST_STRUCTURE = "PvZTests:sanity_check";
const TEST_LEVEL_ID = "gametest_level_start";

function createFakePlayer() {
  const commands = [];
  const cameraCalls = [];
  const actionBars = [];
  const titles = [];

  const fakePlayer = {
    commands,
    cameraCalls,
    actionBars,
    titles,
    location: { x: 0, y: 80, z: 0 },
    dimension: world.getDimension("overworld"),
    scoreboardIdentity: "PvZGameTestFakePlayer",
    messages: [],
    teleportLocation: null,
    teleportOptions: null,
    getHeadLocation() {
      return { x: 0, y: 81.6, z: 0 };
    },
    getRotation() {
      return { x: 0, y: 0 };
    },
    runCommand(command) {
      commands.push(command);
    },
    teleport(location, options) {
      this.teleportLocation = location;
      this.teleportOptions = options;
      this.location = location;
    },
    getComponent(componentId) {
      if (componentId !== "inventory") {
        return undefined;
      }
      return {
        container: {
          clearAll() {},
          setItem() {},
          addItem() {},
        },
      };
    },
    sendMessage(message) {
      this.messages.push(message);
    },
    playSound() {},
    onScreenDisplay: {
      setActionBar(message) {
        actionBars.push(message);
      },
      setTitle(title, options) {
        titles.push({ title, options });
      },
    },
    getDynamicProperty() {
      return undefined;
    },
    setDynamicProperty() {},
    camera: {
      setCamera(cameraPreset, options) {
        cameraCalls.push({ cameraPreset, options });
      },
      clear() {
        cameraCalls.push({ clear: true });
      },
    },
  };

  return fakePlayer;
}

function clearGameTestLevelState() {
  levelData.delete(TEST_LEVEL_ID);
  world.setDynamicProperty("gameActive", false);
  world.setDynamicProperty("tutorialActive", false);
  world.setDynamicProperty("awaitingPlantCollection", false);
  world.setDynamicProperty("unlockedPlantId", "");
  world.setDynamicProperty("currentLevelId", "");
  world.setDynamicProperty("nextPollenSpawnTick", 0);
  world.setDynamicProperty("nextZombieSpawnTick", 0);
  world.setDynamicProperty("nextWaveStartTick", 0);

  for (const entity of world.getDimension("overworld").getEntities({
    type: "bn:pollen",
  })) {
    try {
      entity.remove();
    } catch (err) {}
  }
}

// Register a basic PvZ sanity test
rg.register("PvZTests", "sanity_check", (test) => {
  // Verify that the custom entity registry is available to commands.
  try {
    const dimension = world.getDimension("overworld");
    dimension.runCommand("summon bn:crazy_steve 0 80 0");
    const sidebar = world.scoreboard.getObjectiveAtDisplaySlot(
      DisplaySlotId.Sidebar,
    );
    const sidebarObjectiveId = sidebar?.id ?? sidebar?.objective?.id;
    if (sidebarObjectiveId !== "pollen") {
      throw new Error(`Expected pollen sidebar, got ${sidebarObjectiveId}`);
    }
  } catch (e) {
    console.warn(`[PvZ Test Runner] ${TEST_NAME} FAILED: Initial sanity check failed: ${e}`);
    test.fail(`Initial sanity check failed: ${e}`);
    return;
  }

  const fakePlayer = createFakePlayer();

  CutsceneManager.playStartCutscene(fakePlayer, [])
    .then(() => {
      const commandLog = fakePlayer.commands.join("\n");
      if (!commandLog.includes("inputpermission set @s camera disabled")) {
        throw new Error("Cutscene did not disable camera input.");
      }
      if (!commandLog.includes("inputpermission set @s camera enabled")) {
        throw new Error("Cutscene did not restore camera input.");
      }
      if (fakePlayer.cameraCalls.length < 2) {
        throw new Error("Cutscene did not exercise camera set/clear calls.");
      }

      levelData.set(TEST_LEVEL_ID, {
        name: "level.1.name",
        playerStartLocation: { x: 1, y: 80, z: 1 },
        lawnmowers: [],
        startItems: [],
        scoreboardsToReset: [],
      });

      return LevelManager.startLevel(fakePlayer, TEST_LEVEL_ID);
    })
    .then(() => {
      if (!fakePlayer.teleportLocation) {
        throw new Error("Level start did not teleport the player.");
      }
      if (world.getDynamicProperty("currentLevelId") !== TEST_LEVEL_ID) {
        throw new Error("Level start did not set currentLevelId.");
      }
      if (!world.getDynamicProperty("gameActive")) {
        throw new Error("Level start did not activate gameplay.");
      }

      const pollenObjective = world.scoreboard.getObjective("pollen");
      pollenObjective?.setScore(fakePlayer.scoreboardIdentity, 0);
      const pollen = PlantManager.spawnPollen(fakePlayer.dimension, {
        x: 0,
        y: 80,
        z: 0,
      });
      if (!PlantManager.collectPollenEntity(fakePlayer, pollen)) {
        throw new Error("Pollen collection helper returned false.");
      }
      if ((pollenObjective?.getScore(fakePlayer.scoreboardIdentity) ?? 0) < 25) {
        throw new Error("Pollen collection did not add score.");
      }
      if (!fakePlayer.actionBars.some((text) => text.includes("Sun:"))) {
        throw new Error("Pollen collection did not update actionbar.");
      }

      fakePlayer.teleportLocation = null;
      fakePlayer.messages = [];
      world.setDynamicProperty("gameActive", true);
      world.setDynamicProperty("tutorialActive", true);
      world.setDynamicProperty("currentLevelId", "level1");

      const levelKeys = Array.from(levelData.keys());
      const testLevelSelection = levelKeys.indexOf(TEST_LEVEL_ID);
      const previousLevelId = levelKeys[testLevelSelection - 1];
      world.setDynamicProperty(
        "completedLevels",
        JSON.stringify([previousLevelId]),
      );

      return MenuManager.handleLevelSelection(fakePlayer, {
        selection: testLevelSelection,
      });
    })
    .then(() => {
      if (!fakePlayer.messages.includes("[PvZ] Restarting the current run.")) {
        throw new Error("Menu did not report restart for an active run.");
      }
      if (!fakePlayer.teleportLocation) {
        throw new Error("Menu restart did not start the selected level.");
      }
      if (world.getDynamicProperty("currentLevelId") !== TEST_LEVEL_ID) {
        throw new Error("Menu restart did not switch to the selected level.");
      }

      clearGameTestLevelState();
      console.warn(`[PvZ Test Runner] ${TEST_NAME} PASSED`);
      test.succeed();
    })
    .catch((e) => {
      clearGameTestLevelState();
      console.warn(`[PvZ Test Runner] ${TEST_NAME} FAILED: ${e}`);
      test.fail(`Sanity check failed: ${e}`);
    });
})
.structureName(TEST_STRUCTURE);

// Automatically run tests and stop Dedicated Server if in automated test mode
try {
  world.afterEvents.worldLoad.subscribe(() => {
    system.runTimeout(() => {
      // If no human players are in the world, we assume we are running in the CLI test runner.
      const players = world.getAllPlayers();
      if (players.length > 0) {
        return;
      }

      console.warn("[PvZ Test Runner] Headless mode detected. Triggering GameTests...");
      const dimension = world.getDimension("overworld");

      try {
        dimension.runCommand(TEST_RUN_COMMAND);
      } catch (e) {
        console.warn(`[PvZ Test Runner] GAME_TEST_COMMAND_FAILED: ${TEST_RUN_COMMAND}: ${e}`);
      }

      // Dedicated Server may reject stop from Script API, so the PowerShell runner
      // also watches for pass/fail log sentinels and terminates the process.
      system.runTimeout(() => {
        console.warn("[PvZ Test Runner] Test run completed. Attempting server shutdown...");
        try {
          dimension.runCommand("stop");
        } catch (e) {
          console.warn(`[PvZ Test Runner] STOP_COMMAND_FAILED: ${e}`);
        }
      }, 100);
    }, 100);
  });
} catch (e) {
  console.warn(`[PvZ Test Runner] WORLD_LOAD_SUBSCRIBE_FAILED: ${e}`);
}
