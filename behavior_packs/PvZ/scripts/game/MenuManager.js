import { world } from "@minecraft/server";
import { CustomForm } from "../lib/CustomForm.js";
import { levelData } from "../levels.js";
import { LevelManager } from "./LevelManager.js";
import { SettingsManager } from "./SettingsManager.js";
import { LanguageManager } from "./LanguageManager.js";

export class MenuManager {
  static showMainMenu(player, activeTab = "Levels") {
    const form = new CustomForm();
    form
      .title(LanguageManager.get(player, "menu.title"))
      .body(LanguageManager.get(player, "menu.body"));

    const completedLevelsProp =
      world.getDynamicProperty("completedLevels") || "[]";
    const completedLevels = JSON.parse(completedLevelsProp);
    const levelKeys = Array.from(levelData.keys());
    const levelsCategoryName = LanguageManager.get(
      player,
      "menu.category.levels",
    );

    levelKeys.forEach((levelId, index) => {
      const isUnlocked =
        index === 0 || completedLevels.includes(levelKeys[index - 1]);
      const iconPath = isUnlocked
        ? "textures/ui/icon_unlocked"
        : "textures/ui/lock_color";
      form.button(
        levelsCategoryName,
        LanguageManager.get(player, "menu.level", index + 1),
        iconPath,
      );
    });

    const shopCategoryName = LanguageManager.get(player, "menu.category.shop");
    form.button(
      shopCategoryName,
      LanguageManager.get(player, "menu.shop.button"),
      "textures/ui/sidebar_icons/marketplace",
    );

    const settingsCategoryName = LanguageManager.get(
      player,
      "menu.category.settings",
    );
    const showPlantHealth = SettingsManager.getShowPlantHealth();
    const showZombieHealth = SettingsManager.getShowZombieHealth();
    const showDialogue = SettingsManager.getShowDialogue();
    const langName = LanguageManager.get(player, "language.name");
    const onText = LanguageManager.get(player, "misc.on");
    const offText = LanguageManager.get(player, "misc.off");

    form.button(
      settingsCategoryName,
      LanguageManager.get(
        player,
        "menu.settings.plant_health",
        showPlantHealth ? onText : offText,
      ),
      "textures/ui/heart_new",
    );
    form.button(
      settingsCategoryName,
      LanguageManager.get(
        player,
        "menu.settings.zombie_health",
        showZombieHealth ? onText : offText,
      ),
      "textures/ui/poison_heart",
    );
    form.button(
      settingsCategoryName,
      LanguageManager.get(
        player,
        "menu.settings.dialogue",
        showDialogue ? onText : offText,
      ),
      "textures/ui/speech_bubble_glyph_color",
    );
    form.button(
      settingsCategoryName,
      LanguageManager.get(player, "menu.settings.language", langName),
      "textures/ui/language_glyph_color",
    );
    form.button(
      settingsCategoryName,
      LanguageManager.get(player, "menu.settings.reset_progress"),
      "textures/ui/gear",
    );

    form.show(player, activeTab).then((response) => {
      if (!response || response.canceled) return;
      const levelsCategory = LanguageManager.get(
        player,
        "menu.category.levels",
      );
      const shopCategory = LanguageManager.get(player, "menu.category.shop");
      const settingsCategory = LanguageManager.get(
        player,
        "menu.category.settings",
      );

      switch (response.category) {
        case levelsCategory:
          this.handleLevelSelection(player, response);
          break;
        case shopCategory:
          player.sendMessage(
            LanguageManager.get(player, "menu.shop.not_implemented"),
          );
          break;
        case settingsCategory:
          this.handleSettingsSelection(player, response);
          break;
      }
    });
  }

  static handleLevelSelection(player, response) {
    const gameActive = world.getDynamicProperty("gameActive");
    if (gameActive) {
      player.sendMessage(LanguageManager.get(player, "menu.level.in_progress"));
      player.sendMessage(
        "[PvZ] Use /scriptevent pvz:reset_lobby to reset the current run.",
      );
      return;
    }

    const levelKeys = Array.from(levelData.keys());
    const selectedLevel = levelKeys[response.selection];
    if (!selectedLevel) {
      player.sendMessage(`[PvZ] Invalid level selection: ${response.selection}`);
      console.warn(`[PvZ] Invalid level selection: ${response.selection}`);
      return;
    }

    const completedLevelsProp =
      world.getDynamicProperty("completedLevels") || "[]";
    const completedLevels = JSON.parse(completedLevelsProp);
    const prevLevelId = levelKeys[response.selection - 1];
    const isUnlocked =
      response.selection === 0 || completedLevels.includes(prevLevelId);

    if (isUnlocked) {
      LevelManager.startLevel(player, selectedLevel).catch((err) => {
        console.error(`[PvZ] Failed to start ${selectedLevel}: ${err}`);
        player.sendMessage(`[PvZ] Failed to start ${selectedLevel}: ${err}`);
      });
    } else {
      player.sendMessage(LanguageManager.get(player, "menu.level.locked"));
    }
  }

  static handleSettingsSelection(player, response) {
    const settingsCategoryName = LanguageManager.get(
      player,
      "menu.category.settings",
    );
    switch (response.selection) {
      case 0:
        SettingsManager.togglePlantHealth();
        this.showMainMenu(player, settingsCategoryName);
        break;
      case 1:
        SettingsManager.toggleZombieHealth();
        this.showMainMenu(player, settingsCategoryName);
        break;
      case 2:
        SettingsManager.toggleShowDialogue();
        this.showMainMenu(player, settingsCategoryName);
        break;
      case 3:
        SettingsManager.showLanguageSelection(player);
        break;
      case 4:
        SettingsManager.showResetConfirmation(player);
        break;
    }
  }
}
