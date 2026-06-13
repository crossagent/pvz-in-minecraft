import { world } from "@minecraft/server";
import { CustomForm } from "../lib/CustomForm.js";
import { levelData } from "../levels.js";
import { LevelManager } from "./LevelManager.js";
import { SettingsManager } from "./SettingsManager.js";
import { LanguageManager } from "./LanguageManager.js";
export class MenuManager {
  static showMainMenu(_0x53be76, _0x3c4f6c = "Levels") {
    const _0xa66944 = new CustomForm();
    _0xa66944
      .title(LanguageManager.get(_0x53be76, "menu.title"))
      ["body"](LanguageManager.get(_0x53be76, "menu.body"));
    const _0x203cb3 = world.getDynamicProperty("completedLevels") || "[]";
    const _0x4e0f06 = JSON.parse(_0x203cb3);
    const _0x51f46a = Array.from(levelData.keys());
    const _0x4b4832 = LanguageManager.get(_0x53be76, "menu.category.levels");
    _0x51f46a.forEach((_0x553ff1, _0x2e210b) => {
      const _0x4f49e3 =
        _0x2e210b === 0 || _0x4e0f06.includes(_0x51f46a[_0x2e210b - 1]);
      const _0x331998 = _0x4f49e3
        ? "textures/ui/icon_unlocked"
        : "textures/ui/lock_color";
      _0xa66944.button(
        _0x4b4832,
        LanguageManager.get(_0x53be76, "menu.level", _0x2e210b + 1),
        _0x331998,
      );
    });
    const _0xf4640a = LanguageManager.get(_0x53be76, "menu.category.shop");
    _0xa66944.button(
      _0xf4640a,
      LanguageManager.get(_0x53be76, "menu.shop.button"),
      "textures/ui/sidebar_icons/marketplace",
    );
    const _0x4ea153 = LanguageManager.get(_0x53be76, "menu.category.settings");
    const _0x1fc55b = SettingsManager.getShowPlantHealth();
    const _0x26eb1b = SettingsManager.getShowZombieHealth();
    const _0x141e30 = SettingsManager.getShowDialogue();
    const _0x101bd2 = LanguageManager.get(_0x53be76, "language.name");
    const _0x4ff6c5 = LanguageManager.get(_0x53be76, "misc.on");
    const _0x1961f3 = LanguageManager.get(_0x53be76, "misc.off");
    _0xa66944.button(
      _0x4ea153,
      LanguageManager.get(
        _0x53be76,
        "menu.settings.plant_health",
        _0x1fc55b ? _0x4ff6c5 : _0x1961f3,
      ),
      "textures/ui/heart_new",
    );
    _0xa66944.button(
      _0x4ea153,
      LanguageManager.get(
        _0x53be76,
        "menu.settings.zombie_health",
        _0x26eb1b ? _0x4ff6c5 : _0x1961f3,
      ),
      "textures/ui/poison_heart",
    );
    _0xa66944.button(
      _0x4ea153,
      LanguageManager.get(
        _0x53be76,
        "menu.settings.dialogue",
        _0x141e30 ? _0x4ff6c5 : _0x1961f3,
      ),
      "textures/ui/speech_bubble_glyph_color",
    );
    _0xa66944.button(
      _0x4ea153,
      LanguageManager.get(_0x53be76, "menu.settings.language", _0x101bd2),
      "textures/ui/language_glyph_color",
    );
    _0xa66944.button(
      _0x4ea153,
      LanguageManager.get(_0x53be76, "menu.settings.reset_progress"),
      "textures/ui/gear",
    );
    _0xa66944.show(_0x53be76, _0x3c4f6c)["then"]((_0x490af9) => {
      if (_0x490af9.canceled) return;
      const _0x416dc6 = LanguageManager.get(_0x53be76, "menu.category.levels");
      const _0x56f27c = LanguageManager.get(_0x53be76, "menu.category.shop");
      const _0x58655c = LanguageManager.get(
        _0x53be76,
        "menu.category.settings",
      );
      switch (_0x490af9.category) {
        case _0x416dc6:
          this.handleLevelSelection(_0x53be76, _0x490af9);
          break;
        case _0x56f27c:
          _0x53be76.sendMessage(
            LanguageManager.get(_0x53be76, "menu.shop.not_implemented"),
          );
          break;
        case _0x58655c:
          this.handleSettingsSelection(_0x53be76, _0x490af9);
          break;
      }
    });
  }
  static handleLevelSelection(_0x3e9a13, _0x44f8a9) {
    const _0x405ed3 = world.getDynamicProperty("gameActive");
    if (_0x405ed3) {
      _0x3e9a13.sendMessage(
        LanguageManager.get(_0x3e9a13, "menu.level.in_progress"),
      );
      return;
    }
    const _0x38fa2e = Array.from(levelData.keys());
    const _0x49aaad = _0x38fa2e[_0x44f8a9.selection];
    if (!_0x49aaad) return;
    const _0xaaed6a = world.getDynamicProperty("completedLevels") || "[]";
    const _0x18aede = JSON.parse(_0xaaed6a);
    const _0x197d58 = _0x38fa2e[_0x44f8a9.selection - 1];
    const _0x502ed0 =
      _0x44f8a9.selection === 0 || _0x18aede.includes(_0x197d58);
    if (_0x502ed0) {
      LevelManager.startLevel(_0x3e9a13, _0x49aaad);
    } else {
      _0x3e9a13.sendMessage(
        LanguageManager.get(_0x3e9a13, "menu.level.locked"),
      );
    }
  }
  static handleSettingsSelection(_0x257e97, _0x3fe388) {
    const _0x576cba = LanguageManager.get(_0x257e97, "menu.category.settings");
    switch (_0x3fe388.selection) {
      case 0:
        SettingsManager.togglePlantHealth();
        this.showMainMenu(_0x257e97, _0x576cba);
        break;
      case 1:
        SettingsManager.toggleZombieHealth();
        this.showMainMenu(_0x257e97, _0x576cba);
        break;
      case 2:
        SettingsManager.toggleShowDialogue();
        this.showMainMenu(_0x257e97, _0x576cba);
        break;
      case 3:
        SettingsManager.showLanguageSelection(_0x257e97);
        break;
      case 4:
        SettingsManager.showResetConfirmation(_0x257e97);
        break;
    }
  }
}
