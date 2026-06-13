import { world, system } from "@minecraft/server";
import * as rg from "@minecraft/server-gametest";

const TEST_NAME = "PvZTests:sanity_check";
const TEST_RUN_COMMAND = `gametest run ${TEST_NAME}`;
const TEST_STRUCTURE = "PvZTests:sanity_check";

// Register a basic PvZ sanity test
rg.register("PvZTests", "sanity_check", (test) => {
  // Verify that the custom entity registry is available to commands.
  try {
    const dimension = world.getDimension("overworld");
    dimension.runCommand("summon bn:crazy_steve 0 80 0");
  } catch (e) {
    console.warn(`[PvZ Test Runner] ${TEST_NAME} FAILED: Crazy Dave failed to spawn: ${e}`);
    test.fail(`Crazy Dave failed to spawn: ${e}`);
    return;
  }

  console.warn(`[PvZ Test Runner] ${TEST_NAME} PASSED`);
  test.succeed();
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
