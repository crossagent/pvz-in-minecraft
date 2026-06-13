import { world } from "@minecraft/server";
import { MessageFormData, ActionFormData } from "@minecraft/server-ui";
import { LanguageManager } from "./LanguageManager.js";
import { MenuManager } from "./MenuManager.js";

const PLANT_HEALTH_KEY = "showPlantHealth";
const ZOMBIE_HEALTH_KEY = "showZombieHealth";
const LANGUAGE_KEY = "playerLanguage";
const INTERACT_KEY = "hasInteractedWithSteve";
const DIALOGUE_KEY = "showDialogue";

export class SettingsManager {
  static initializeSettings() {
    if (world.getDynamicProperty(PLANT_HEALTH_KEY) === undefined) {
      world.setDynamicProperty(PLANT_HEALTH_KEY, true);
    }
    if (world.getDynamicProperty(ZOMBIE_HEALTH_KEY) === undefined) {
      world.setDynamicProperty(ZOMBIE_HEALTH_KEY, true);
    }
    if (world.getDynamicProperty(LANGUAGE_KEY) === undefined) {
      world.setDynamicProperty(LANGUAGE_KEY, "en");
    }
    if (world.getDynamicProperty(DIALOGUE_KEY) === undefined) {
      world.setDynamicProperty(DIALOGUE_KEY, true);
    }
  }

  static initializePlayerSettings(player) {
    if (player.getDynamicProperty(LANGUAGE_KEY) === undefined) {
      player.setDynamicProperty(LANGUAGE_KEY, "en");
    }
    if (player.getDynamicProperty(INTERACT_KEY) === undefined) {
      player.setDynamicProperty(INTERACT_KEY, false);
    }
  }

  static getShowPlantHealth() {
    return world.getDynamicProperty(PLANT_HEALTH_KEY) ?? true;
  }

  static togglePlantHealth() {
    const currentVal = this.getShowPlantHealth();
    world.setDynamicProperty(PLANT_HEALTH_KEY, !currentVal);
  }

  static getShowZombieHealth() {
    return world.getDynamicProperty(ZOMBIE_HEALTH_KEY) ?? true;
  }

  static toggleZombieHealth() {
    const currentVal = this.getShowZombieHealth();
    world.setDynamicProperty(ZOMBIE_HEALTH_KEY, !currentVal);
  }

  static getShowDialogue() {
    return world.getDynamicProperty(DIALOGUE_KEY) ?? true;
  }

  static toggleShowDialogue() {
    const currentVal = this.getShowDialogue();
    world.setDynamicProperty(DIALOGUE_KEY, !currentVal);
  }

  static showResetConfirmation(player) {
    const form = new MessageFormData()
      .title(LanguageManager.get(player, "reset.confirm.title"))
      .body(LanguageManager.get(player, "reset.confirm.body"))
      .button2(LanguageManager.get(player, "reset.confirm.yes"))
      .button1(LanguageManager.get(player, "reset.confirm.no"));

    form.show(player).then((response) => {
      if (response.selection === 1) {
        world.setDynamicProperty("completedLevels", "[]");
        for (const p of world.getAllPlayers()) {
          p.setDynamicProperty(INTERACT_KEY, false);
        }
        player.sendMessage(LanguageManager.get(player, "reset.success"));
      } else {
        player.sendMessage(LanguageManager.get(player, "reset.cancelled"));
      }
    });
  }

  static showLanguageSelection(player) {
    const form = new ActionFormData();
    form.title(LanguageManager.get(player, "menu.settings.language", ""));

    const languages = LanguageManager.getAvailableLanguages();
    languages.forEach((lang) => {
      form.button(lang.name);
    });

    form.show(player).then((response) => {
      if (response.canceled) {
        MenuManager.showMainMenu(
          player,
          LanguageManager.get(player, "menu.category.settings"),
        );
        return;
      }

      const selectedLang = languages[response.selection];
      if (selectedLang) {
        LanguageManager.setLanguage(player, selectedLang.code);
      }
      MenuManager.showMainMenu(
        player,
        LanguageManager.get(player, "menu.category.settings"),
      );
    });
  }
}
