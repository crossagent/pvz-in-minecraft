import { world, system } from "@minecraft/server";
import { SettingsManager } from "./SettingsManager.js";
import { LanguageManager } from "./LanguageManager.js";

const DISPLAY_RANGE = 10;
const MIN_DIALOGUE_INTERVAL = 100;
const MAX_DIALOGUE_INTERVAL = 200;
const NAME_DISPLAY_INTERVAL = 200;

export class DialogueManager {
  static updateDialogue() {
    const gameActive = world.getDynamicProperty("gameActive");
    const tutorialActive = world.getDynamicProperty("tutorialActive");
    const showDialogue = SettingsManager.getShowDialogue();

    for (const steveEntity of world
      .getDimension("overworld")
      .getEntities({ type: "bn:crazy_steve" })) {
      if (gameActive || tutorialActive) {
        steveEntity.nameTag = "";
        continue;
      }

      const playersInRange = steveEntity.dimension.getPlayers({
        location: steveEntity.location,
        maxDistance: DISPLAY_RANGE,
      });

      let closestPlayer = null;
      let minDistanceSq = Infinity;

      for (const player of playersInRange) {
        const dx = player.location.x - steveEntity.location.x;
        const dy = player.location.y - steveEntity.location.y;
        const dz = player.location.z - steveEntity.location.z;
        const distanceSq = dx * dx + dy * dy + dz * dz;

        if (distanceSq < minDistanceSq) {
          minDistanceSq = distanceSq;
          closestPlayer = player;
        }
      }

      if (!closestPlayer) {
        steveEntity.nameTag = "Crazy Dave";
        continue;
      }

      if (!showDialogue) {
        const steveName = LanguageManager.get(
          closestPlayer,
          "entity.crazy_steve.name",
        );
        if (steveEntity.nameTag !== steveName) {
          steveEntity.nameTag = steveName;
        }
        continue;
      }

      const currentTick = system.currentTick;
      const lastDialogueChange =
        steveEntity.getDynamicProperty("lastDialogueChange") || 0;
      let dialogueInterval = steveEntity.getDynamicProperty("dialogueInterval");
      let isShowingDialogue =
        steveEntity.getDynamicProperty("isShowingDialogue");

      if (dialogueInterval === undefined) {
        dialogueInterval = NAME_DISPLAY_INTERVAL;
        steveEntity.setDynamicProperty("dialogueInterval", dialogueInterval);
        isShowingDialogue = false;
        steveEntity.setDynamicProperty("isShowingDialogue", isShowingDialogue);
      }

      if (currentTick - lastDialogueChange >= dialogueInterval) {
        const playerLang = LanguageManager.getLanguage(closestPlayer);
        const dialogueKeys = LanguageManager.getKeysWithPrefix(
          "dialogue.crazy_steve.",
          playerLang,
        );

        if (isShowingDialogue) {
          steveEntity.nameTag = LanguageManager.get(
            closestPlayer,
            "entity.crazy_steve.name",
          );
          steveEntity.setDynamicProperty("isShowingDialogue", false);
          steveEntity.setDynamicProperty(
            "dialogueInterval",
            NAME_DISPLAY_INTERVAL,
          );
        } else {
          const randomDialogueKey =
            dialogueKeys[Math.floor(Math.random() * dialogueKeys.length)];
          steveEntity.nameTag = LanguageManager.get(
            closestPlayer,
            randomDialogueKey,
          );
          steveEntity.setDynamicProperty("isShowingDialogue", true);

          const randomInterval =
            Math.floor(
              Math.random() *
                (MAX_DIALOGUE_INTERVAL - MIN_DIALOGUE_INTERVAL + 1),
            ) + MIN_DIALOGUE_INTERVAL;
          steveEntity.setDynamicProperty("dialogueInterval", randomInterval);
        }
        steveEntity.setDynamicProperty("lastDialogueChange", currentTick);
      }
    }
  }
}
