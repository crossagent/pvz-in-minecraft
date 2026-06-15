import { world, system, ItemStack } from "@minecraft/server";
import { LevelManager } from "./LevelManager.js";
import { PlantManager } from "./PlantManager.js";
import { LanguageManager } from "./LanguageManager.js";

const TUTORIAL_STATE_KEY = "tutorialState";
const PEASHOOTER_COST = 100;
const POLLEN_RESPAWN_SECONDS = 30;

const TutorialState = {
  NONE: 0,
  COLLECT_FIRST_POLLEN: 1,
  COLLECT_MORE_POLLEN: 2,
  PLACE_FIRST_PEASHOOTER: 3,
  COLLECT_FOR_SECOND: 4,
  PLACE_SECOND_PEASHOOTER: 5,
  COMPLETED: 6,
};

export class TutorialManager {
  static firstPollenLocation = { x: -22.5, y: 60, z: 182.5 };
  static secondPollenLocations = [
    { x: -21.5, y: 60, z: 183.5 },
    { x: -23.5, y: 60, z: 181.5 },
    { x: -22.5, y: 60, z: 180.5 },
  ];
  static thirdPollenLocations = [
    { x: -20.5, y: 60, z: 182.5 },
    { x: -24.5, y: 60, z: 182.5 },
    { x: -21.5, y: 60, z: 179.5 },
    { x: -23.5, y: 60, z: 179.5 },
  ];

  static startTutorial(player, level) {
    world.setDynamicProperty("tutorialActive", true);
    this.setTutorialState(player, TutorialState.COLLECT_FIRST_POLLEN);
    player.setDynamicProperty("pollenTimer", 0);
    this.spawnPollen(player.dimension, this.firstPollenLocation);
    player.onScreenDisplay.setTitle(
      LanguageManager.get(player, "tutorial.welcome.title"),
      {
        subtitle: LanguageManager.get(player, "tutorial.welcome.subtitle"),
        fadeInDuration: 20,
        stayDuration: 80,
        fadeOutDuration: 20,
      },
    );
  }

  static onTick() {
    const player = world.getAllPlayers()[0];
    if (!player) return;
    this.updatePlayer(player);
  }

  static updatePlayer(player) {
    const state = this.getTutorialState(player);
    const pollenCount =
      world.scoreboard
        .getObjective("pollen")
        ?.getScore(player.scoreboardIdentity) ?? 0;
    const peashooterEntityId =
      PlantManager.plantData.get("bn:plant_2").entityId;
    const spawnedPeashooters = player.dimension.getEntities({
      type: peashooterEntityId,
      maxDistance: 50,
      location: player.location,
    });

    switch (state) {
      case TutorialState.COLLECT_FIRST_POLLEN:
        player.onScreenDisplay.setActionBar(
          LanguageManager.get(player, "tutorial.task.collect_first_pollen"),
        );
        let timer = player.getDynamicProperty("pollenTimer") ?? 0;
        timer++;
        player.setDynamicProperty("pollenTimer", timer);
        if (timer >= POLLEN_RESPAWN_SECONDS * 20) {
          this.spawnPollen(player.dimension, this.firstPollenLocation);
          player.setDynamicProperty("pollenTimer", 0);
        }
        if (pollenCount > 0) {
          this.setTutorialState(player, TutorialState.COLLECT_MORE_POLLEN);
          player.playSound("random.orb");
          player.onScreenDisplay.setTitle("§eSun collected!", {
            subtitle: `§7Sun: §e${pollenCount} / ${PEASHOOTER_COST}`,
            fadeInDuration: 5,
            stayDuration: 35,
            fadeOutDuration: 10,
          });
          for (const pos of this.secondPollenLocations) {
            this.spawnPollen(player.dimension, pos);
          }
          player.setDynamicProperty("pollenTimer", 0);
        }
        break;
      case TutorialState.COLLECT_MORE_POLLEN:
        player.onScreenDisplay.setActionBar(
          LanguageManager.get(
            player,
            "tutorial.task.collect_for_peashooter",
            pollenCount,
            PEASHOOTER_COST,
          ),
        );
        let timerMore = player.getDynamicProperty("pollenTimer") ?? 0;
        timerMore++;
        player.setDynamicProperty("pollenTimer", timerMore);
        if (timerMore >= POLLEN_RESPAWN_SECONDS * 20) {
          for (const pos of this.secondPollenLocations) {
            this.spawnPollen(player.dimension, pos);
          }
          player.setDynamicProperty("pollenTimer", 0);
        }
        if (pollenCount >= PEASHOOTER_COST) {
          this.setTutorialState(player, TutorialState.PLACE_FIRST_PEASHOOTER);
          player.playSound("random.orb");
          const peashooterItem = new ItemStack("bn:plant_2", 1);
          player.getComponent("inventory").container.addItem(peashooterItem);
          player.onScreenDisplay.setTitle("§aPeashooter ready!", {
            subtitle: "§7Use it on a valid tile.",
            fadeInDuration: 5,
            stayDuration: 60,
            fadeOutDuration: 10,
          });
        }
        break;
      case TutorialState.PLACE_FIRST_PEASHOOTER:
        player.onScreenDisplay.setActionBar(
          LanguageManager.get(player, "tutorial.task.place_first_peashooter"),
        );
        if (spawnedPeashooters.length >= 1) {
          this.setTutorialState(player, TutorialState.COLLECT_FOR_SECOND);
          player.playSound("random.orb");
          for (const pos of this.thirdPollenLocations) {
            this.spawnPollen(player.dimension, pos);
          }
          player.setDynamicProperty("pollenTimer", 0);
        }
        break;
      case TutorialState.COLLECT_FOR_SECOND:
        player.onScreenDisplay.setActionBar(
          LanguageManager.get(
            player,
            "tutorial.task.collect_for_second",
            pollenCount,
            PEASHOOTER_COST,
          ),
        );
        let timerSecond = player.getDynamicProperty("pollenTimer") ?? 0;
        timerSecond++;
        player.setDynamicProperty("pollenTimer", timerSecond);
        if (timerSecond >= POLLEN_RESPAWN_SECONDS * 20) {
          for (const pos of this.thirdPollenLocations) {
            this.spawnPollen(player.dimension, pos);
          }
          player.setDynamicProperty("pollenTimer", 0);
        }
        if (pollenCount >= PEASHOOTER_COST) {
          this.setTutorialState(player, TutorialState.PLACE_SECOND_PEASHOOTER);
          player.playSound("random.orb");
          player.onScreenDisplay.setTitle("§aSecond Peashooter ready!", {
            subtitle: "§7Plant it to begin the zombie waves.",
            fadeInDuration: 5,
            stayDuration: 60,
            fadeOutDuration: 10,
          });
        }
        break;
      case TutorialState.PLACE_SECOND_PEASHOOTER:
        player.onScreenDisplay.setActionBar(
          LanguageManager.get(player, "tutorial.task.place_second_peashooter"),
        );
        if (spawnedPeashooters.length >= 2) {
          this.setTutorialState(player, TutorialState.COMPLETED);
        }
        break;
      case TutorialState.COMPLETED:
        player.onScreenDisplay.setTitle(
          LanguageManager.get(player, "tutorial.complete.title"),
          {
            subtitle: LanguageManager.get(player, "tutorial.complete.subtitle"),
            fadeInDuration: 20,
            stayDuration: 60,
            fadeOutDuration: 20,
          },
        );
        player.onScreenDisplay.setActionBar("");
        world.setDynamicProperty("tutorialActive", false);
        LevelManager.startLevelGameplay(
          player,
          world.getDynamicProperty("currentLevelId"),
        );
        break;
    }
  }

  static spawnPollen(dimension, pos) {
    PlantManager.spawnPollen(dimension, pos);
  }

  static getTutorialState(player) {
    return player.getDynamicProperty(TUTORIAL_STATE_KEY) ?? TutorialState.NONE;
  }

  static setTutorialState(player, state) {
    player.setDynamicProperty(TUTORIAL_STATE_KEY, state);
  }
}
