import {
  world,
  system,
  HudElement,
  HudVisibility,
  ItemStack,
  EquipmentSlot,
} from "@minecraft/server";
import { PlayerManager } from "./player/PlayerManager.js";
import { PlantManager } from "./game/PlantManager.js";
import { ScoreboardManager } from "./game/ScoreboardManager.js";
import { GameManager } from "./game/GameManager.js";
import { MenuManager } from "./game/MenuManager.js";
import { SettingsManager } from "./game/SettingsManager.js";
import { HealthDisplayManager } from "./game/HealthDisplayManager.js";
import { LanguageManager } from "./game/LanguageManager.js";
import { DialogueManager } from "./game/DialogueManager.js";
import { TutorialManager } from "./game/TutorialManager.js";
import { LevelManager } from "./game/LevelManager.js";
system.run(() => {
  ScoreboardManager.initializeScoreboards();
  SettingsManager.initializeSettings();
  GameManager.initialize();
  PlantManager.initialize();
  world.afterEvents.worldInitialize.subscribe(() => {
    GameManager.resumeGameOnLoad();
  });
  world.afterEvents.playerSpawn.subscribe((_0x24c534) => {
    const { player: _0x52d021, initialSpawn: _0x24a701 } = _0x24c534;
    SettingsManager.initializePlayerSettings(_0x52d021);
    if (_0x24a701) {
      system.run(() => {
        try {
          _0x52d021.onScreenDisplay.setHudVisibility(HudVisibility.Hide, [
            HudElement.Health,
            HudElement.Hunger,
            HudElement.Armor,
            HudElement.StatusEffects,
            HudElement.ProgressBar,
          ]);
        } catch (_0x23dd44) {
          console.warn(
            "Could not hide HUD elements for " +
              _0x52d021.name +
              ": " +
              _0x23dd44,
          );
        }
      });
    }
  });
  world.beforeEvents.itemUse.subscribe((_0x4c93e7) => {
    const { source: _0x56a4b8, itemStack: _0x2f9b79 } = _0x4c93e7;
    if (world.getDynamicProperty("tutorialActive") && !_0x2f9b79) {
      return;
    }
    system.run(() => {
      switch (_0x2f9b79?.["typeId"]) {
        case "minecraft:compass":
          _0x4c93e7.cancel = !![];
          MenuManager.showMainMenu(
            _0x56a4b8,
            LanguageManager.get(_0x56a4b8, "menu.category.settings"),
          );
          break;
        default:
          if (_0x2f9b79 && PlantManager.handleItemUse(_0x56a4b8, _0x2f9b79)) {
            _0x4c93e7.cancel = !![];
          }
          break;
      }
    });
  });
  world.afterEvents.entityHitEntity.subscribe((_0x29c179) => {
    const { damagingEntity: _0x39f303, hitEntity: _0xba3c0b } = _0x29c179;
    if (_0x39f303.typeId === "minecraft:player") {
      const _0xf29f5f = Array.from(world.getPlayers())["find"](
        (_0x2938f5) => _0x2938f5.id === _0x39f303.id,
      );
      if (!_0xf29f5f) return;
      if (_0xba3c0b.typeId === "bn:crazy_steve") {
        system.run(() => {
          _0xf29f5f.setDynamicProperty("hasInteractedWithSteve", !![]);
          _0xf29f5f.runCommandAsync("playsound cd.talk");
          MenuManager.showMainMenu(
            _0xf29f5f,
            LanguageManager.get(_0xf29f5f, "menu.category.levels"),
          );
        });
      }
      if (_0xba3c0b.typeId === "bn:pollen") {
        system.run(() => PlantManager.collectPollen(_0xf29f5f));
      }
      GameManager.handleUnlockedPlantCollection(_0xba3c0b);
    }
  });
  world.beforeEvents.playerInteractWithEntity.subscribe((_0x2b5410) => {
    const { player: _0x12652d, target: _0x3a1db3 } = _0x2b5410;
    const _0x53a4fe = world.getDynamicProperty("awaitingPlantCollection");
    if (_0x53a4fe) {
      GameManager.handleUnlockedPlantCollection(_0x3a1db3);
      return;
    }
    if (_0x3a1db3.typeId === "bn:crazy_steve") {
      system.run(() => {
        _0x12652d.setDynamicProperty("hasInteractedWithSteve", !![]);
        _0x12652d.runCommandAsync("playsound cd.talk");
        MenuManager.showMainMenu(
          _0x12652d,
          LanguageManager.get(_0x12652d, "menu.category.levels"),
        );
      });
    }
  });
});
system.runInterval(() => {
  const _0x1138cb = world.getDynamicProperty("gameActive");
  const _0x3ad5d4 = world.getDynamicProperty("tutorialActive");
  const _0x103994 = world.getDynamicProperty("awaitingPlantCollection");
  if (_0x1138cb) {
    GameManager.onTick();
    LevelManager.onTick();
  }
  if (_0x3ad5d4) {
    TutorialManager.onTick();
  }
  if (!_0x1138cb && !_0x3ad5d4 && !_0x103994) {
    for (const _0x1584e0 of world.getAllPlayers()) {
      const _0x161ea0 = _0x1584e0.getDynamicProperty("hasInteractedWithSteve");
      if (!_0x161ea0) {
        _0x1584e0.onScreenDisplay.setActionBar(
          LanguageManager.get(_0x1584e0, "misc.interact_prompt"),
        );
      } else {
        _0x1584e0.onScreenDisplay.setActionBar("");
      }
    }
    return;
  }
  if (_0x1138cb && !_0x3ad5d4) {
    PlantManager.updatePlants();
  }
  const _0x423381 = world.getAllPlayers();
  for (const _0x3869d7 of _0x423381) {
    if (_0x1138cb || _0x3ad5d4) {
      PlayerManager.handleLookingAt(_0x3869d7);
    }
    if (_0x3869d7.hasTag("collect")) {
      const _0xff72ee = PlantManager.collectPollen(_0x3869d7);
      if (!_0xff72ee) {
        const _0x3bc741 = world.getDynamicProperty("awaitingPlantCollection");
        if (_0x3bc741) {
          try {
            const _0x3732d9 = _0x3869d7.getBlockFromViewDirection({
              maxDistance: 0x96,
            });
            if (_0x3732d9) {
              const _0x3d69f7 = world.getDynamicProperty("unlockedPlantId");
              const _0x20ab1c = {
                location: _0x3732d9.block.location,
                maxDistance: 0x4,
                type: _0x3d69f7,
              };
              const _0x162353 = _0x3869d7.dimension.getEntities(_0x20ab1c);
              if (_0x162353.length > 0) {
                GameManager.handleUnlockedPlantCollection(_0x162353[0]);
              }
            }
          } catch (_0x3c267b) {}
        }
      }
      _0x3869d7.removeTag("collect");
    }
    if (_0x1138cb && !_0x3ad5d4) {
      try {
        const _0x290c1c = LanguageManager.get(_0x3869d7, "game.title");
        const _0x2a6473 = world.scoreboard.getObjective("pollen");
        const _0x192ce0 =
          _0x2a6473?.["getScore"](_0x3869d7.scoreboardIdentity) ?? 0;
        let _0x304869 =
          _0x290c1c +
          "\x0a" +
          LanguageManager.get(_0x3869d7, "game.sun_counter", _0x192ce0);
        for (const [, _0x109e3d] of PlantManager.plantData) {
          const _0x391033 = _0x3869d7.getItemCooldown(
            _0x109e3d.cooldownCategory,
          );
          if (_0x391033 > 0) {
            const _0x2e9f9d = (_0x391033 / 20)["toFixed"](1);
            const _0x17b4a1 = LanguageManager.get(_0x3869d7, _0x109e3d.nameKey);
            _0x304869 +=
              "\x0a" +
              LanguageManager.get(
                _0x3869d7,
                "game.plant_cooldown",
                _0x17b4a1,
                _0x2e9f9d,
              );
          }
        }
        _0x3869d7.onScreenDisplay.setActionBar(_0x304869);
      } catch (_0x5d94e3) {
        console.warn("[PvZ] Action bar update failed: " + _0x5d94e3);
      }
    }
  }
});
system.runInterval(() => {
  const _0xc7655b = world.getDynamicProperty("gameActive");
  const _0x163701 = world.getDynamicProperty("tutorialActive");
  if (_0xc7655b || _0x163701) {
    HealthDisplayManager.updateHealthDisplays();
  } else {
    HealthDisplayManager.clearAllHealthDisplays();
  }
}, 10);
system.runInterval(() => {
  DialogueManager.updateDialogue();
}, 20);
const BOOKS = {
  book1: [
    "pvz_bn:bk_pg1",
    "pvz_bn:bk_pg2",
    "pvz_bn:bk_pg3",
    "pvz_bn:bk_pg4",
    "pvz_bn:bk_pg5",
    "pvz_bn:bk_pg6",
  ],
};
world.beforeEvents.itemUse.subscribe((_0x3af29a) => {
  const _0xbb369b = _0x3af29a.itemStack;
  const _0x50a2f4 = _0x3af29a.source;
  const _0x7fb432 = _0x50a2f4.getComponent("minecraft:equippable");
  const _0x3d6531 = _0x50a2f4.isSneaking;
  system.run(() => {
    let _0x12fcb6 = null;
    let _0x1cd151 = -1;
    for (const [_0x4995ff, _0x283ad7] of Object.entries(BOOKS)) {
      const _0x74c978 = _0x283ad7.indexOf(_0xbb369b.typeId);
      if (_0x74c978 !== -1) {
        _0x12fcb6 = _0x283ad7;
        _0x1cd151 = _0x74c978;
        break;
      }
    }
    if (_0x12fcb6 && _0x1cd151 !== -1) {
      let _0x1c2b6b;
      if (_0x3d6531) {
        _0x1c2b6b = (_0x1cd151 - 1 + _0x12fcb6.length) % _0x12fcb6.length;
      } else {
        _0x1c2b6b = (_0x1cd151 + 1) % _0x12fcb6.length;
      }
      const _0x5c3426 = new ItemStack(_0x12fcb6[_0x1c2b6b]);
      _0x7fb432.setEquipment(EquipmentSlot.Mainhand, _0x5c3426);
      _0x50a2f4.playSound("item.book.page_turn");
    }
  });
});
const TAG_TO_CHECK = "pvz_bn_1_0";
const ITEM_ID_1 = "pvz_bn:bk_pg1";
world.afterEvents.playerSpawn.subscribe((_0x442ed9) => {
  const { player: _0x48cc02, initialSpawn: _0x1e6753 } = _0x442ed9;
  system.run(() => {
    try {
      const _0x1fdb94 = _0x48cc02.hasTag(TAG_TO_CHECK);
      if (!_0x1fdb94) {
        const _0x1a7dc0 = new ItemStack(ITEM_ID_1, 1);
        const _0x1cfbfc = _0x48cc02.getComponent("inventory");
        if (_0x1cfbfc) {
          _0x1cfbfc.container.addItem(_0x1a7dc0);
        } else {
          console.error(
            "Could not get inventory for player " +
              _0x48cc02.name +
              ". Trying command fallback.",
          );
          _0x48cc02.runCommandAsync("give @s " + ITEM_ID_1 + " 1");
        }
        _0x48cc02.addTag(TAG_TO_CHECK);
      } else {
      }
    } catch (_0x2f3716) {
      console.error(
        "Error processing player spawn for " +
          _0x48cc02.name +
          ": " +
          _0x2f3716,
      );
      if (_0x2f3716.stack) {
        console.error(_0x2f3716.stack);
      }
    }
  });
});
