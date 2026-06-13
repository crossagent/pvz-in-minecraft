import { world, DisplaySlotId } from "@minecraft/server";
export class ScoreboardManager {
  static initializeScoreboards() {
    world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
    this.addScoreboard("pollen", "§ePollen");
    this.addScoreboard("points", "§aPoints");
  }
  static addScoreboard(_0x29049c, _0x28aac5) {
    world.scoreboard.getObjective(_0x29049c) ??
      world.scoreboard.addObjective(_0x29049c, _0x28aac5);
  }
}
