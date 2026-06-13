import { world, system, ItemStack } from "@minecraft/server";
import { LevelManager } from "./LevelManager.js";
import { PlantManager } from "./PlantManager.js";
import { LanguageManager } from "./LanguageManager.js";
const TUTORIAL_STATE_KEY = "tutorialState";
const PEASHOOTER_COST = 100;
const POLLEN_RESPAWN_SECONDS = 30;
const TutorialState = {
  NONE: 0x0,
  COLLECT_FIRST_POLLEN: 0x1,
  COLLECT_MORE_POLLEN: 0x2,
  PLACE_FIRST_PEASHOOTER: 0x3,
  COLLECT_FOR_SECOND: 0x4,
  PLACE_SECOND_PEASHOOTER: 0x5,
  COMPLETED: 0x6,
};
export class TutorialManager {
  static firstPollenLocation = { x: -22.5, y: 0x3c, z: 182.5 };
  static secondPollenLocations = [
    { x: -21.5, y: 0x3c, z: 183.5 },
    { x: -23.5, y: 0x3c, z: 181.5 },
    { x: -22.5, y: 0x3c, z: 180.5 },
  ];
  static thirdPollenLocations = [
    { x: -20.5, y: 0x3c, z: 182.5 },
    { x: -24.5, y: 0x3c, z: 182.5 },
    { x: -21.5, y: 0x3c, z: 179.5 },
    { x: -23.5, y: 0x3c, z: 179.5 },
  ];
  static startTutorial(_0x5f4e6c, _0x15faa5) {
    world.setDynamicProperty("tutorialActive", !![]);
    this.setTutorialState(_0x5f4e6c, TutorialState.COLLECT_FIRST_POLLEN);
    _0x5f4e6c.setDynamicProperty("pollenTimer", 0);
    this.spawnPollen(_0x5f4e6c.dimension, this.firstPollenLocation);
    _0x5f4e6c.onScreenDisplay.setTitle(
      LanguageManager.get(_0x5f4e6c, "tutorial.welcome.title"),
      {
        subtitle: LanguageManager.get(_0x5f4e6c, "tutorial.welcome.subtitle"),
        fadeInDuration: 0x14,
        stayDuration: 0x50,
        fadeOutDuration: 0x14,
      },
    );
  }
  static onTick() {
    const _0x5de94e = world.getAllPlayers()[0];
    if (!_0x5de94e) return;
    const _0x1edc05 = this.getTutorialState(_0x5de94e);
    const _0x4c9779 =
      world.scoreboard
        .getObjective("pollen")
        ?.["getScore"](_0x5de94e.scoreboardIdentity) ?? 0;
    const _0x130a27 = _0x5de94e.dimension.getEntities({
      type: PlantManager.plantData.get("bn:plant_2")["entityId"],
      maxDistance: 0x32,
      location: _0x5de94e.location,
    });
    switch (_0x1edc05) {
      case TutorialState.COLLECT_FIRST_POLLEN:
        _0x5de94e.onScreenDisplay.setActionBar(
          LanguageManager.get(_0x5de94e, "tutorial.task.collect_first_pollen"),
        );
        let _0x10edc8 = _0x5de94e.getDynamicProperty("pollenTimer") ?? 0;
        _0x10edc8++;
        _0x5de94e.setDynamicProperty("pollenTimer", _0x10edc8);
        if (_0x10edc8 >= POLLEN_RESPAWN_SECONDS * 20) {
          this.spawnPollen(_0x5de94e.dimension, this.firstPollenLocation);
          _0x5de94e.setDynamicProperty("pollenTimer", 0);
        }
        if (_0x4c9779 > 0) {
          this.setTutorialState(_0x5de94e, TutorialState.COLLECT_MORE_POLLEN);
          _0x5de94e.playSound("random.orb");
          for (const _0x5bfc23 of this.secondPollenLocations) {
            this.spawnPollen(_0x5de94e.dimension, _0x5bfc23);
          }
          _0x5de94e.setDynamicProperty("pollenTimer", 0);
        }
        break;
      case TutorialState.COLLECT_MORE_POLLEN:
        _0x5de94e.onScreenDisplay.setActionBar(
          LanguageManager.get(
            _0x5de94e,
            "tutorial.task.collect_for_peashooter",
            _0x4c9779,
            PEASHOOTER_COST,
          ),
        );
        let _0x472754 = _0x5de94e.getDynamicProperty("pollenTimer") ?? 0;
        _0x472754++;
        _0x5de94e.setDynamicProperty("pollenTimer", _0x472754);
        if (_0x472754 >= POLLEN_RESPAWN_SECONDS * 20) {
          for (const _0x2888bf of this.secondPollenLocations) {
            this.spawnPollen(_0x5de94e.dimension, _0x2888bf);
          }
          _0x5de94e.setDynamicProperty("pollenTimer", 0);
        }
        if (_0x4c9779 >= PEASHOOTER_COST) {
          this.setTutorialState(
            _0x5de94e,
            TutorialState.PLACE_FIRST_PEASHOOTER,
          );
          _0x5de94e.playSound("random.orb");
          const _0x240cd4 = new ItemStack("bn:plant_2", 1);
          _0x5de94e
            .getComponent("inventory")
            ["container"]["addItem"](_0x240cd4);
        }
        break;
      case TutorialState.PLACE_FIRST_PEASHOOTER:
        _0x5de94e.onScreenDisplay.setActionBar(
          LanguageManager.get(
            _0x5de94e,
            "tutorial.task.place_first_peashooter",
          ),
        );
        if (_0x130a27.length >= 1) {
          this.setTutorialState(_0x5de94e, TutorialState.COLLECT_FOR_SECOND);
          _0x5de94e.playSound("random.orb");
          for (const _0x5848c2 of this.thirdPollenLocations) {
            this.spawnPollen(_0x5de94e.dimension, _0x5848c2);
          }
          _0x5de94e.setDynamicProperty("pollenTimer", 0);
        }
        break;
      case TutorialState.COLLECT_FOR_SECOND:
        _0x5de94e.onScreenDisplay.setActionBar(
          LanguageManager.get(
            _0x5de94e,
            "tutorial.task.collect_for_second",
            _0x4c9779,
            PEASHOOTER_COST,
          ),
        );
        let _0xc97e0 = _0x5de94e.getDynamicProperty("pollenTimer") ?? 0;
        _0xc97e0++;
        _0x5de94e.setDynamicProperty("pollenTimer", _0xc97e0);
        if (_0xc97e0 >= POLLEN_RESPAWN_SECONDS * 20) {
          for (const _0x5e8a06 of this.thirdPollenLocations) {
            this.spawnPollen(_0x5de94e.dimension, _0x5e8a06);
          }
          _0x5de94e.setDynamicProperty("pollenTimer", 0);
        }
        if (_0x4c9779 >= PEASHOOTER_COST) {
          this.setTutorialState(
            _0x5de94e,
            TutorialState.PLACE_SECOND_PEASHOOTER,
          );
          _0x5de94e.playSound("random.orb");
        }
        break;
      case TutorialState.PLACE_SECOND_PEASHOOTER:
        _0x5de94e.onScreenDisplay.setActionBar(
          LanguageManager.get(
            _0x5de94e,
            "tutorial.task.place_second_peashooter",
          ),
        );
        if (_0x130a27.length >= 2) {
          this.setTutorialState(_0x5de94e, TutorialState.COMPLETED);
        }
        break;
      case TutorialState.COMPLETED:
        _0x5de94e.onScreenDisplay.setTitle(
          LanguageManager.get(_0x5de94e, "tutorial.complete.title"),
          {
            subtitle: LanguageManager.get(
              _0x5de94e,
              "tutorial.complete.subtitle",
            ),
            fadeInDuration: 0x14,
            stayDuration: 0x3c,
            fadeOutDuration: 0x14,
          },
        );
        _0x5de94e.onScreenDisplay.setActionBar("");
        world.setDynamicProperty("tutorialActive", ![]);
        LevelManager.startLevelGameplay(
          _0x5de94e,
          world.getDynamicProperty("currentLevelId"),
        );
        break;
    }
  }
  static spawnPollen(_0x53200b, _0x2f329d) {
    _0x53200b.spawnEntity("bn:pollen", _0x2f329d);
  }
  static getTutorialState(_0x1a5ecb) {
    return (
      _0x1a5ecb.getDynamicProperty(TUTORIAL_STATE_KEY) ?? TutorialState.NONE
    );
  }
  static setTutorialState(_0x539f1a, _0x36fe2d) {
    _0x539f1a.setDynamicProperty(TUTORIAL_STATE_KEY, _0x36fe2d);
  }
}
