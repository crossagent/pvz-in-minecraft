import { world, DisplaySlotId } from "@minecraft/server";

export class ScoreboardManager {
  static initializeScoreboards() {
    world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
    this.addScoreboard("pollen", "§ePollen");
    this.addScoreboard("points", "§aPoints");
  }

  static addScoreboard(objectiveId, displayName) {
    world.scoreboard.getObjective(objectiveId) ??
      world.scoreboard.addObjective(objectiveId, displayName);
  }
}
