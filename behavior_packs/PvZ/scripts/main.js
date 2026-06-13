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

  world.afterEvents.playerSpawn.subscribe((eventData) => {
    const { player, initialSpawn } = eventData;
    SettingsManager.initializePlayerSettings(player);
    if (initialSpawn) {
      system.run(() => {
        try {
          player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, [
            HudElement.Health,
            HudElement.Hunger,
            HudElement.Armor,
            HudElement.StatusEffects,
            HudElement.ProgressBar,
          ]);
        } catch (err) {
          console.warn(
            `Could not hide HUD elements for ${player.name}: ${err}`,
          );
        }
      });
    }
  });

  world.beforeEvents.itemUse.subscribe((eventData) => {
    const { source: player, itemStack } = eventData;
    if (world.getDynamicProperty("tutorialActive") && !itemStack) {
      return;
    }
    system.run(() => {
      switch (itemStack?.typeId) {
        case "minecraft:compass":
          eventData.cancel = true;
          MenuManager.showMainMenu(
            player,
            LanguageManager.get(player, "menu.category.settings"),
          );
          break;
        default:
          if (itemStack && PlantManager.handleItemUse(player, itemStack)) {
            eventData.cancel = true;
          }
          break;
      }
    });
  });

  world.afterEvents.entityHitEntity.subscribe((eventData) => {
    const { damagingEntity, hitEntity } = eventData;
    if (damagingEntity.typeId === "minecraft:player") {
      const player = Array.from(world.getPlayers()).find(
        (p) => p.id === damagingEntity.id,
      );
      if (!player) return;
      if (hitEntity.typeId === "bn:crazy_steve") {
        system.run(() => {
          player.setDynamicProperty("hasInteractedWithSteve", true);
          player.runCommandAsync("playsound cd.talk");
          MenuManager.showMainMenu(
            player,
            LanguageManager.get(player, "menu.category.levels"),
          );
        });
      }
      if (hitEntity.typeId === "bn:pollen") {
        system.run(() => PlantManager.collectPollen(player));
      }
      GameManager.handleUnlockedPlantCollection(hitEntity);
    }
  });

  world.beforeEvents.playerInteractWithEntity.subscribe((eventData) => {
    const { player, target } = eventData;
    const awaitingPlantCollection = world.getDynamicProperty(
      "awaitingPlantCollection",
    );
    if (awaitingPlantCollection) {
      GameManager.handleUnlockedPlantCollection(target);
      return;
    }
    if (target.typeId === "bn:crazy_steve") {
      system.run(() => {
        player.setDynamicProperty("hasInteractedWithSteve", true);
        player.runCommandAsync("playsound cd.talk");
        MenuManager.showMainMenu(
          player,
          LanguageManager.get(player, "menu.category.levels"),
        );
      });
    }
  });
});

system.runInterval(() => {
  const gameActive = world.getDynamicProperty("gameActive");
  const tutorialActive = world.getDynamicProperty("tutorialActive");
  const awaitingPlantCollection = world.getDynamicProperty(
    "awaitingPlantCollection",
  );

  if (gameActive) {
    GameManager.onTick();
    LevelManager.onTick();
  }
  if (tutorialActive) {
    TutorialManager.onTick();
  }

  if (!gameActive && !tutorialActive && !awaitingPlantCollection) {
    for (const player of world.getAllPlayers()) {
      const hasInteracted = player.getDynamicProperty("hasInteractedWithSteve");
      if (!hasInteracted) {
        player.onScreenDisplay.setActionBar(
          LanguageManager.get(player, "misc.interact_prompt"),
        );
      } else {
        player.onScreenDisplay.setActionBar("");
      }
    }
    return;
  }

  if (gameActive && !tutorialActive) {
    PlantManager.updatePlants();
  }

  const allPlayers = world.getAllPlayers();
  for (const player of allPlayers) {
    if (gameActive || tutorialActive) {
      PlayerManager.handleLookingAt(player);
    }
    if (player.hasTag("collect")) {
      const collected = PlantManager.collectPollen(player);
      if (!collected) {
        const awaitingPlantCollection = world.getDynamicProperty(
          "awaitingPlantCollection",
        );
        if (awaitingPlantCollection) {
          try {
            const raycastResult = player.getBlockFromViewDirection({
              maxDistance: 150,
            });
            if (raycastResult) {
              const unlockedPlantId =
                world.getDynamicProperty("unlockedPlantId");
              const filterOptions = {
                location: raycastResult.block.location,
                maxDistance: 4,
                type: unlockedPlantId,
              };
              const entities = player.dimension.getEntities(filterOptions);
              if (entities.length > 0) {
                GameManager.handleUnlockedPlantCollection(entities[0]);
              }
            }
          } catch (err) {}
        }
      }
      player.removeTag("collect");
    }

    if (gameActive && !tutorialActive) {
      try {
        const gameTitle = LanguageManager.get(player, "game.title");
        const pollenObjective = world.scoreboard.getObjective("pollen");
        const currentPollen =
          pollenObjective?.getScore(player.scoreboardIdentity) ?? 0;

        let actionBarText =
          gameTitle +
          "\n" +
          LanguageManager.get(player, "game.sun_counter", currentPollen);

        for (const [, plantDef] of PlantManager.plantData) {
          const cooldownTicks = player.getItemCooldown(
            plantDef.cooldownCategory,
          );
          if (cooldownTicks > 0) {
            const cooldownSeconds = (cooldownTicks / 20).toFixed(1);
            const plantName = LanguageManager.get(player, plantDef.nameKey);
            actionBarText +=
              "\n" +
              LanguageManager.get(
                player,
                "game.plant_cooldown",
                plantName,
                cooldownSeconds,
              );
          }
        }
        player.onScreenDisplay.setActionBar(actionBarText);
      } catch (err) {
        console.warn(`[PvZ] Action bar update failed: ${err}`);
      }
    }
  }
});

system.runInterval(() => {
  const gameActive = world.getDynamicProperty("gameActive");
  const tutorialActive = world.getDynamicProperty("tutorialActive");
  if (gameActive || tutorialActive) {
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

world.beforeEvents.itemUse.subscribe((eventData) => {
  const itemStack = eventData.itemStack;
  const player = eventData.source;
  const equippable = player.getComponent("minecraft:equippable");
  const isSneaking = player.isSneaking;

  system.run(() => {
    let bookList = null;
    let bookIndex = -1;
    for (const [bookKey, list] of Object.entries(BOOKS)) {
      const idx = list.indexOf(itemStack.typeId);
      if (idx !== -1) {
        bookList = list;
        bookIndex = idx;
        break;
      }
    }
    if (bookList && bookIndex !== -1) {
      let nextIndex;
      if (isSneaking) {
        nextIndex = (bookIndex - 1 + bookList.length) % bookList.length;
      } else {
        nextIndex = (bookIndex + 1) % bookList.length;
      }
      const nextBookStack = new ItemStack(bookList[nextIndex]);
      equippable.setEquipment(EquipmentSlot.Mainhand, nextBookStack);
      player.playSound("item.book.page_turn");
    }
  });
});

const TAG_TO_CHECK = "pvz_bn_1_0";
const ITEM_ID_1 = "pvz_bn:bk_pg1";

world.afterEvents.playerSpawn.subscribe((eventData) => {
  const { player, initialSpawn } = eventData;
  system.run(() => {
    try {
      const hasTag = player.hasTag(TAG_TO_CHECK);
      if (!hasTag) {
        const itemStack = new ItemStack(ITEM_ID_1, 1);
        const inventory = player.getComponent("inventory");
        if (inventory) {
          inventory.container.addItem(itemStack);
        } else {
          console.error(
            `Could not get inventory for player ${player.name}. Trying command fallback.`,
          );
          player.runCommandAsync(`give @s ${ITEM_ID_1} 1`);
        }
        player.addTag(TAG_TO_CHECK);
      }
    } catch (err) {
      console.error(`Error processing player spawn for ${player.name}: ${err}`);
      if (err.stack) {
        console.error(err.stack);
      }
    }
  });
});
