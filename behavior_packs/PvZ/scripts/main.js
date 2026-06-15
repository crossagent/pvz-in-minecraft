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

  world.afterEvents.worldLoad.subscribe(() => {
    GameManager.resumeGameOnLoad();
  });

  world.afterEvents.playerSpawn.subscribe((eventData) => {
    const { player, initialSpawn } = eventData;
    SettingsManager.initializePlayerSettings(player);
    system.run(() => {
      restoreVisibleHud(player);
      ensureLobbyReady(player);
    });
    if (initialSpawn) {
      system.run(() => {
        restoreVisibleHud(player);
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
          player.runCommand("playsound cd.talk");
          MenuManager.showMainMenu(
            player,
            LanguageManager.get(player, "menu.category.levels"),
          );
        });
      }
      if (hitEntity.typeId === "bn:pollen") {
        system.run(() => PlantManager.collectPollenEntity(player, hitEntity));
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
        player.runCommand("playsound cd.talk");
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

  if (isLobbyState()) {
    if (gameActive || tutorialActive || awaitingPlantCollection) {
      resetRuntimeState();
    }
    for (const player of world.getAllPlayers()) {
      ensureLobbyReady(player);
    }
    return;
  }

  if (gameActive && !tutorialActive) {
    PlantManager.updatePlants();
  }

  const allPlayers = world.getAllPlayers();
  for (const player of allPlayers) {
    if (gameActive || tutorialActive) {
      restoreVisibleHud(player);
      PlayerManager.handleLookingAt(player);
      PlantManager.collectNearbyPollen(player);
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

const MENU_ITEM_ID = "bn:shop";
const GAME_STATE_KEYS = [
  "gameActive",
  "tutorialActive",
  "awaitingPlantCollection",
  "unlockedPlantId",
  "currentLevelId",
  "currentWave",
  "zombiesKilledThisWave",
  "zombiesSpawnedThisWave",
  "nextPollenSpawnTick",
  "nextZombieSpawnTick",
  "nextWaveStartTick",
  "waveSpawnDeck",
  "waveLocationDeck",
];

function hasItem(player, typeId) {
  const inventory = player.getComponent("inventory");
  const container = inventory?.container;
  if (!container) return false;

  for (let i = 0; i < container.size; i++) {
    if (container.getItem(i)?.typeId === typeId) {
      return true;
    }
  }
  return false;
}

function isLobbyState() {
  const gameActive = world.getDynamicProperty("gameActive");
  const tutorialActive = world.getDynamicProperty("tutorialActive");
  const awaitingPlantCollection = world.getDynamicProperty(
    "awaitingPlantCollection",
  );
  const currentLevelId = world.getDynamicProperty("currentLevelId");
  const unlockedPlantId = world.getDynamicProperty("unlockedPlantId");

  if (gameActive || tutorialActive) {
    return !currentLevelId;
  }
  if (awaitingPlantCollection) {
    return !unlockedPlantId;
  }
  return true;
}

function ensureMenuItem(player) {
  if (hasItem(player, MENU_ITEM_ID)) {
    return;
  }

  const inventory = player.getComponent("inventory");
  const container = inventory?.container;
  if (container) {
    const menuItem = new ItemStack(MENU_ITEM_ID, 1);
    if (!container.getItem(8)) {
      container.setItem(8, menuItem);
    } else {
      container.addItem(menuItem);
    }
  }
}

function recoverLobbyControls(player) {
  try {
    player.camera.clear();
  } catch (err) {}
  try {
    player.runCommand("inputpermission set @s camera enabled");
    player.runCommand("inputpermission set @s movement enabled");
  } catch (err) {}
  restoreVisibleHud(player);
}

function restoreVisibleHud(player) {
  try {
    player.onScreenDisplay.setHudVisibility(HudVisibility.Reset, [
      HudElement.Health,
      HudElement.Hunger,
      HudElement.Armor,
      HudElement.StatusEffects,
      HudElement.ProgressBar,
    ]);
  } catch (err) {}
}

function ensureLobbyReady(player) {
  if (!isLobbyState()) {
    return;
  }
  recoverLobbyControls(player);
  ensureMenuItem(player);
  player.onScreenDisplay.setActionBar(
    LanguageManager.get(player, "misc.interact_prompt"),
  );
}

function resetRuntimeState() {
  LevelManager.resetActiveRun();
}

function getStateSummary() {
  return GAME_STATE_KEYS.map((key) => {
    const value = world.getDynamicProperty(key);
    return `${key}=${value === undefined ? "undefined" : value}`;
  }).join(", ");
}

function openMainMenu(player) {
  recoverLobbyControls(player);
  ensureMenuItem(player);
  system.runTimeout(() => {
    MenuManager.showMainMenu(
      player,
      LanguageManager.get(player, "menu.category.levels"),
    );
  }, 10);
}

const scriptEventReceive =
  system.afterEvents?.scriptEventReceive ??
  world.afterEvents?.scriptEventReceive;

if (scriptEventReceive) {
  scriptEventReceive.subscribe((event) => {
    if (
      event.id !== "pvz:debug" &&
      event.id !== "pvz:reset_lobby" &&
      event.id !== "pvz:menu"
    ) {
      return;
    }

    const players = world.getAllPlayers();
    if (event.id === "pvz:reset_lobby") {
      resetRuntimeState();
    }

    for (const player of players) {
      recoverLobbyControls(player);
      ensureMenuItem(player);
      player.sendMessage(`[PvZ] ${getStateSummary()}`);
      if (event.id === "pvz:reset_lobby") {
        player.sendMessage("[PvZ] Lobby state reset. Opening the menu.");
        openMainMenu(player);
      }
      if (event.id === "pvz:menu") {
        player.sendMessage("[PvZ] Opening the menu.");
        openMainMenu(player);
      }
    }
  });
}

world.beforeEvents.itemUse.subscribe((eventData) => {
  const itemStack = eventData.itemStack;
  const player = eventData.source;
  if (
    itemStack?.typeId === MENU_ITEM_ID ||
    itemStack?.typeId === "minecraft:compass"
  ) {
    eventData.cancel = true;
    system.run(() => {
      openMainMenu(player);
    });
    return;
  }

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
          player.runCommand(`give @s ${ITEM_ID_1} 1`);
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
