import { world, DisplaySlotId } from "@minecraft/server";
import { assert, assertEquals } from "../harness/assertions.js";

export const environmentCases = [
  {
    id: "environment.custom_entity_registry",
    run() {
      const dimension = world.getDimension("overworld");
      const entity = dimension.spawnEntity("bn:crazy_steve", {
        x: 0,
        y: 80,
        z: 0,
      });

      try {
        assertEquals(
          entity.typeId,
          "bn:crazy_steve",
          "Custom entity registry is not available.",
        );
      } finally {
        try {
          entity.remove();
        } catch (err) {}
      }
    },
  },
  {
    id: "environment.scoreboards_and_sidebar",
    run() {
      assert(
        world.scoreboard.getObjective("pollen"),
        "Missing pollen scoreboard objective.",
      );
      assert(
        world.scoreboard.getObjective("points"),
        "Missing points scoreboard objective.",
      );

      const sidebar = world.scoreboard.getObjectiveAtDisplaySlot(
        DisplaySlotId.Sidebar,
      );
      const sidebarObjectiveId = sidebar?.id ?? sidebar?.objective?.id;
      assertEquals(
        sidebarObjectiveId,
        "pollen",
        "Pollen objective is not visible in the sidebar.",
      );
    },
  },
];
