import { formatError } from "./assertions.js";
import { resetRuntimeState } from "./worldState.js";

export async function runTestCases(testCases) {
  for (const testCase of testCases) {
    console.warn(`[PvZ Test Runner] CASE ${testCase.id} START`);
    resetRuntimeState();

    try {
      await testCase.run();
      console.warn(`[PvZ Test Runner] CASE ${testCase.id} PASSED`);
    } catch (err) {
      console.warn(
        `[PvZ Test Runner] CASE ${testCase.id} FAILED: ${formatError(err)}`,
      );
      throw new Error(`${testCase.id}: ${formatError(err)}`);
    }
  }

  resetRuntimeState();
}
