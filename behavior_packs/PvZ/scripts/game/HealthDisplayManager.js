import { world, EntityHealthComponent } from "@minecraft/server";
import { SettingsManager } from "./SettingsManager.js";
import { PlantManager } from "./PlantManager.js";

export class HealthDisplayManager {
  static updateHealthDisplays() {
    const showPlantHealth = SettingsManager.getShowPlantHealth();
    const showZombieHealth = SettingsManager.getShowZombieHealth();
    const entities = world.getDimension("overworld").getEntities();

    for (const entity of entities) {
      const isPlant = PlantManager.allPlantEntityIds.has(entity.typeId);
      const isZombie = entity.typeId.startsWith("bn:zombie");
      if (!isPlant && !isZombie) continue;

      const shouldShowHealth =
        (isPlant && showPlantHealth) || (isZombie && showZombieHealth);
      if (shouldShowHealth) {
        const healthComponent = entity.getComponent(
          EntityHealthComponent.componentId,
        );
        if (healthComponent) {
          const currentHp = Math.round(healthComponent.currentValue);
          const maxHp = Math.round(healthComponent.defaultValue);
          const healthPercentage = Math.round((currentHp / maxHp) * 100);

          let colorCode;
          if (healthPercentage > 75) {
            colorCode = "§a";
          } else if (healthPercentage > 50) {
            colorCode = "§e";
          } else if (healthPercentage > 25) {
            colorCode = "§6";
          } else {
            colorCode = "§c";
          }

          entity.nameTag = `${colorCode}§l${currentHp} / ${maxHp}`;
        }
      } else {
        entity.nameTag = "";
      }
    }
  }

  static clearAllHealthDisplays() {
    const entities = world.getDimension("overworld").getEntities();
    for (const entity of entities) {
      const isPlant = PlantManager.allPlantEntityIds.has(entity.typeId);
      const isZombie = entity.typeId.startsWith("bn:zombie");
      if (isPlant || isZombie) {
        entity.nameTag = "";
      }
    }
  }
}
