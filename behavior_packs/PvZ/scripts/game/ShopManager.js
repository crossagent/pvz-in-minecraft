import { world, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { LanguageManager } from "./LanguageManager.js";

export class ShopManager {
  static shopItems = [
    { nameKey: "plant.peashooter.name", itemId: "bn:plant_2", cost: 100 },
    { nameKey: "plant.wallnut.name", itemId: "bn:plant_1", cost: 50 },
    { nameKey: "plant.cherry_bomb.name", itemId: "bn:plant_3", cost: 150 },
    { nameKey: "plant.big_walnut.name", itemId: "bn:plant_4", cost: 125 },
    { nameKey: "plant.potato_mine.name", itemId: "bn:plant_5", cost: 25 },
    { nameKey: "plant.snow_pea.name", itemId: "bn:plant_6", cost: 175 },
  ];

  static showShop(player) {
    const pollenObjective = world.scoreboard.getObjective("pollen");
    const currentPollen =
      pollenObjective?.getScore(player.scoreboardIdentity) ?? 0;

    const form = new ActionFormData()
      .title(LanguageManager.get(player, "shop.title"))
      .body(LanguageManager.get(player, "shop.body", currentPollen));

    for (const item of this.shopItems) {
      const itemName = LanguageManager.get(player, item.nameKey);
      form.button(
        LanguageManager.get(player, "shop.item_button", itemName, item.cost),
      );
    }

    form.show(player).then((response) => {
      if (response.canceled) return;
      const selectedItem = this.shopItems[response.selection];
      if (!selectedItem) return;

      if (currentPollen >= selectedItem.cost) {
        pollenObjective.addScore(player.scoreboardIdentity, -selectedItem.cost);
        const itemStack = new ItemStack(selectedItem.itemId, 1);
        player.getComponent("inventory").container.addItem(itemStack);

        const purchasedItemName = LanguageManager.get(
          player,
          selectedItem.nameKey,
        );
        player.sendMessage(
          LanguageManager.get(
            player,
            "shop.purchase_success",
            purchasedItemName,
          ),
        );
        player.playSound("random.levelup");
      } else {
        player.sendMessage(
          LanguageManager.get(player, "shop.not_enough_pollen"),
        );
        player.playSound("note.bass");
      }
    });
  }
}
