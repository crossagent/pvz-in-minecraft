import { system } from "@minecraft/server";

export function waitTicks(ticks = 1) {
  return new Promise((resolve) => {
    system.runTimeout(resolve, ticks);
  });
}
