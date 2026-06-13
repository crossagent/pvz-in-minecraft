import { world, EntityHealthComponent } from "@minecraft/server";
import { SettingsManager } from "./SettingsManager.js";
import { PlantManager } from "./PlantManager.js";
export class HealthDisplayManager {
  static updateHealthDisplays() {
    const _0x3e2742 = SettingsManager.getShowPlantHealth();
    const _0x197871 = SettingsManager.getShowZombieHealth();
    const _0x464f2f = world.getDimension("overworld")["getEntities"]();
    for (const _0x404c58 of _0x464f2f) {
      const _0x4ee59c = PlantManager.allPlantEntityIds.has(_0x404c58.typeId);
      const _0x3ec3de = _0x404c58.typeId.startsWith("bn:zombie");
      if (!_0x4ee59c && !_0x3ec3de) continue;
      const _0x15e526 = (_0x4ee59c && _0x3e2742) || (_0x3ec3de && _0x197871);
      if (_0x15e526) {
        const _0x23801a = _0x404c58.getComponent(
          EntityHealthComponent.componentId,
        );
        if (_0x23801a) {
          const _0x5803ed = Math.round(_0x23801a.currentValue);
          const _0x1cefd8 = Math.round(_0x23801a.defaultValue);
          const _0x249560 = Math.round((_0x5803ed / _0x1cefd8) * 100);
          let _0x18ed10;
          if (_0x249560 > 75) _0x18ed10 = "§a";
          else if (_0x249560 > 50) _0x18ed10 = "§e";
          else if (_0x249560 > 25) _0x18ed10 = "§6";
          else _0x18ed10 = "§c";
          _0x404c58.nameTag = _0x18ed10 + "§l" + _0x5803ed + " / " + _0x1cefd8;
        }
      } else {
        _0x404c58.nameTag = "";
      }
    }
  }
  static clearAllHealthDisplays() {
    const _0x295a85 = world.getDimension("overworld")["getEntities"]();
    for (const _0x35bc26 of _0x295a85) {
      const _0x45a625 = PlantManager.allPlantEntityIds.has(_0x35bc26.typeId);
      const _0x40b61d = _0x35bc26.typeId.startsWith("bn:zombie");
      if (_0x45a625 || _0x40b61d) {
        _0x35bc26.nameTag = "";
      }
    }
  }
}
