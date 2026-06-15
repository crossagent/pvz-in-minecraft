import { world, system } from "@minecraft/server";
import * as rg from "@minecraft/server-gametest";
import { formatError } from "./harness/assertions.js";
import { runTestCases } from "./harness/runCases.js";
import { resetRuntimeState } from "./harness/worldState.js";
import { allTestCases } from "./suites/index.js";

const TEST_NAME = "PvZTests:sanity_check";
const TEST_RUN_COMMAND = `gametest run ${TEST_NAME}`;
const TEST_STRUCTURE = "PvZTests:sanity_check";

rg.register("PvZTests", "sanity_check", (test) => {
  runTestCases(allTestCases)
    .then(() => {
      resetRuntimeState();
      console.warn(
        `[PvZ Test Runner] ${TEST_NAME} PASSED (${allTestCases.length} cases)`,
      );
      test.succeed();
    })
    .catch((err) => {
      resetRuntimeState();
      console.warn(
        `[PvZ Test Runner] ${TEST_NAME} FAILED: ${formatError(err)}`,
      );
      test.fail(`Sanity check failed: ${formatError(err)}`);
    });
})
  .structureName(TEST_STRUCTURE);

try {
  world.afterEvents.worldLoad.subscribe(() => {
    system.runTimeout(() => {
      const players = world.getAllPlayers();
      if (players.length > 0) {
        return;
      }

      console.warn("[PvZ Test Runner] Headless mode detected. Triggering GameTests...");
      const dimension = world.getDimension("overworld");

      try {
        dimension.runCommand(TEST_RUN_COMMAND);
      } catch (err) {
        console.warn(
          `[PvZ Test Runner] GAME_TEST_COMMAND_FAILED: ${TEST_RUN_COMMAND}: ${formatError(err)}`,
        );
      }

      system.runTimeout(() => {
        console.warn("[PvZ Test Runner] Test run completed. Attempting server shutdown...");
        try {
          dimension.runCommand("stop");
        } catch (err) {
          console.warn(`[PvZ Test Runner] STOP_COMMAND_FAILED: ${formatError(err)}`);
        }
      }, 100);
    }, 100);
  });
} catch (err) {
  console.warn(`[PvZ Test Runner] WORLD_LOAD_SUBSCRIBE_FAILED: ${formatError(err)}`);
}
