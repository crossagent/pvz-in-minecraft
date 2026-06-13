import { world, system } from "@minecraft/server";
import { SettingsManager } from "./SettingsManager.js";
import { LanguageManager } from "./LanguageManager.js";
const DISPLAY_RANGE = 10;
const MIN_DIALOGUE_INTERVAL = 100;
const MAX_DIALOGUE_INTERVAL = 200;
const NAME_DISPLAY_INTERVAL = 200;
export class DialogueManager {
  static updateDialogue() {
    const _0x59bfa4 = world.getDynamicProperty("gameActive");
    const _0x406f79 = world.getDynamicProperty("tutorialActive");
    const _0x13e006 = SettingsManager.getShowDialogue();
    for (const _0x2144aa of world
      .getDimension("overworld")
      ["getEntities"]({ type: "bn:crazy_steve" })) {
      if (_0x59bfa4 || _0x406f79) {
        _0x2144aa.nameTag = "";
        continue;
      }
      const _0x1fa57d = _0x2144aa.dimension.getPlayers({
        location: _0x2144aa.location,
        maxDistance: DISPLAY_RANGE,
      });
      let _0x25236a = null;
      let _0x4a3f3b = Infinity;
      for (const _0x502755 of _0x1fa57d) {
        const _0x37115c = _0x502755.location.x - _0x2144aa.location.x;
        const _0x2b02b8 = _0x502755.location.y - _0x2144aa.location.y;
        const _0x39c866 = _0x502755.location.z - _0x2144aa.location.z;
        const _0x49ec2a =
          _0x37115c * _0x37115c + _0x2b02b8 * _0x2b02b8 + _0x39c866 * _0x39c866;
        if (_0x49ec2a < _0x4a3f3b) {
          _0x4a3f3b = _0x49ec2a;
          _0x25236a = _0x502755;
        }
      }
      if (!_0x25236a) {
        _0x2144aa.nameTag = "Crazy Dave";
        continue;
      }
      if (!_0x13e006) {
        const _0x2b989b = LanguageManager.get(
          _0x25236a,
          "entity.crazy_steve.name",
        );
        if (_0x2144aa.nameTag !== _0x2b989b) {
          _0x2144aa.nameTag = _0x2b989b;
        }
        continue;
      }
      const _0x4e567f = _0x2144aa.id;
      const _0x584c15 = system.currentTick;
      const _0x393dd7 = _0x2144aa.getDynamicProperty("lastDialogueChange") || 0;
      let _0x2e6763 = _0x2144aa.getDynamicProperty("dialogueInterval");
      let _0x45a6de = _0x2144aa.getDynamicProperty("isShowingDialogue");
      if (_0x2e6763 === undefined) {
        _0x2e6763 = NAME_DISPLAY_INTERVAL;
        _0x2144aa.setDynamicProperty("dialogueInterval", _0x2e6763);
        _0x45a6de = ![];
        _0x2144aa.setDynamicProperty("isShowingDialogue", _0x45a6de);
      }
      if (_0x584c15 - _0x393dd7 >= _0x2e6763) {
        const _0x11d530 = LanguageManager.getLanguage(_0x25236a);
        const _0x5e1ddc = LanguageManager.getKeysWithPrefix(
          "dialogue.crazy_steve.",
          _0x11d530,
        );
        if (_0x45a6de) {
          _0x2144aa.nameTag = LanguageManager.get(
            _0x25236a,
            "entity.crazy_steve.name",
          );
          _0x2144aa.setDynamicProperty("isShowingDialogue", ![]);
          _0x2144aa.setDynamicProperty(
            "dialogueInterval",
            NAME_DISPLAY_INTERVAL,
          );
        } else {
          const _0x3968eb =
            _0x5e1ddc[Math.floor(Math.random() * _0x5e1ddc.length)];
          _0x2144aa.nameTag = LanguageManager.get(_0x25236a, _0x3968eb);
          _0x2144aa.setDynamicProperty("isShowingDialogue", !![]);
          const _0x254da1 =
            Math.floor(
              Math.random() *
                (MAX_DIALOGUE_INTERVAL - MIN_DIALOGUE_INTERVAL + 1),
            ) + MIN_DIALOGUE_INTERVAL;
          _0x2144aa.setDynamicProperty("dialogueInterval", _0x254da1);
        }
        _0x2144aa.setDynamicProperty("lastDialogueChange", _0x584c15);
      }
    }
  }
}
