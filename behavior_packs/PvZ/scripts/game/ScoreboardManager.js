import { world, DisplaySlotId, ObjectiveSortOrder } from "@minecraft/server";

export class ScoreboardManager {
  static initializeScoreboards() {
    world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
    const pollenObjective = this.addScoreboard("pollen", "Sun");
    this.addScoreboard("points", "Points");
    this.showPollenSidebar(pollenObjective);
  }

  static addScoreboard(objectiveId, displayName) {
    return (
      world.scoreboard.getObjective(objectiveId) ??
      world.scoreboard.addObjective(objectiveId, displayName)
    );
  }

  static showPollenSidebar(objective = world.scoreboard.getObjective("pollen")) {
    if (!objective) {
      return;
    }

    try {
      world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
        objective,
        sortOrder: ObjectiveSortOrder.Descending,
      });
    } catch (err) {
      console.warn(`[PvZ] Failed to show pollen sidebar: ${err}`);
    }
  }
}
