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
      world.setDynamicProperty(PLANT_HEALTH_KEY, !![]);
    }
    if (world.getDynamicProperty(ZOMBIE_HEALTH_KEY) === undefined) {
      world.setDynamicProperty(ZOMBIE_HEALTH_KEY, !![]);
    }
    if (world.getDynamicProperty(LANGUAGE_KEY) === undefined) {
      world.setDynamicProperty(LANGUAGE_KEY, "en");
    }
    if (world.getDynamicProperty(DIALOGUE_KEY) === undefined) {
      world.setDynamicProperty(DIALOGUE_KEY, !![]);
    }
  }
  static initializePlayerSettings(_0x52b087) {
    if (_0x52b087.getDynamicProperty(LANGUAGE_KEY) === undefined) {
      _0x52b087.setDynamicProperty(LANGUAGE_KEY, "en");
    }
    if (_0x52b087.getDynamicProperty(INTERACT_KEY) === undefined) {
      _0x52b087.setDynamicProperty(INTERACT_KEY, ![]);
    }
  }
  static getShowPlantHealth() {
    return world.getDynamicProperty(PLANT_HEALTH_KEY) ?? !![];
  }
  static togglePlantHealth() {
    const _0x3f737d = this.getShowPlantHealth();
    world.setDynamicProperty(PLANT_HEALTH_KEY, !_0x3f737d);
  }
  static getShowZombieHealth() {
    return world.getDynamicProperty(ZOMBIE_HEALTH_KEY) ?? !![];
  }
  static toggleZombieHealth() {
    const _0x43bade = this.getShowZombieHealth();
    world.setDynamicProperty(ZOMBIE_HEALTH_KEY, !_0x43bade);
  }
  static getShowDialogue() {
    return world.getDynamicProperty(DIALOGUE_KEY) ?? !![];
  }
  static toggleShowDialogue() {
    const _0x75cf0a = this.getShowDialogue();
    world.setDynamicProperty(DIALOGUE_KEY, !_0x75cf0a);
  }
  static showResetConfirmation(_0x487be1) {
    const _0x52639a = new MessageFormData()
      ["title"](LanguageManager.get(_0x487be1, "reset.confirm.title"))
      ["body"](LanguageManager.get(_0x487be1, "reset.confirm.body"))
      ["button2"](LanguageManager.get(_0x487be1, "reset.confirm.yes"))
      ["button1"](LanguageManager.get(_0x487be1, "reset.confirm.no"));
    _0x52639a.show(_0x487be1)["then"]((_0x1cbaf4) => {
      if (_0x1cbaf4.selection === 1) {
        world.setDynamicProperty("completedLevels", "[]");
        for (const _0x5202c4 of world.getAllPlayers()) {
          _0x5202c4.setDynamicProperty(INTERACT_KEY, ![]);
        }
        _0x487be1.sendMessage(LanguageManager.get(_0x487be1, "reset.success"));
      } else {
        _0x487be1.sendMessage(
          LanguageManager.get(_0x487be1, "reset.cancelled"),
        );
      }
    });
  }
  static showLanguageSelection(_0xb5699e) {
    const _0x4280ae = new ActionFormData();
    _0x4280ae.title(
      LanguageManager.get(_0xb5699e, "menu.settings.language", ""),
    );
    const _0x3b76a9 = LanguageManager.getAvailableLanguages();
    _0x3b76a9.forEach((_0x1aa8fa) => {
      _0x4280ae.button(_0x1aa8fa.name);
    });
    _0x4280ae.show(_0xb5699e)["then"]((_0x1e546d) => {
      if (_0x1e546d.canceled) {
        MenuManager.showMainMenu(
          _0xb5699e,
          LanguageManager.get(_0xb5699e, "menu.category.settings"),
        );
        return;
      }
      const _0x3eef50 = _0x3b76a9[_0x1e546d.selection];
      if (_0x3eef50) {
        LanguageManager.setLanguage(_0xb5699e, _0x3eef50.code);
      }
      MenuManager.showMainMenu(
        _0xb5699e,
        LanguageManager.get(_0xb5699e, "menu.category.settings"),
      );
    });
  }
}
