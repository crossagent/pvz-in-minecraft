import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { LanguageManager } from "./LanguageManager.js";
export class ShopManager {
  static shopItems = [
    { nameKey: "plant.peashooter.name", itemId: "bn:plant_2", cost: 0x64 },
    { nameKey: "plant.wallnut.name", itemId: "bn:plant_1", cost: 0x32 },
    { nameKey: "plant.cherry_bomb.name", itemId: "bn:plant_3", cost: 0x96 },
    { nameKey: "plant.big_walnut.name", itemId: "bn:plant_4", cost: 0x7d },
    { nameKey: "plant.potato_mine.name", itemId: "bn:plant_5", cost: 0x19 },
    { nameKey: "plant.snow_pea.name", itemId: "bn:plant_6", cost: 0xaf },
  ];
  static showShop(_0x163177) {
    const _0x493871 = world.scoreboard.getObjective("pollen");
    const _0x15b107 =
      _0x493871?.["getScore"](_0x163177.scoreboardIdentity) ?? 0;
    const _0x14efd5 = new ActionFormData()
      ["title"](LanguageManager.get(_0x163177, "shop.title"))
      ["body"](LanguageManager.get(_0x163177, "shop.body", _0x15b107));
    for (const _0x1ff33f of this.shopItems) {
      const _0x71ec48 = LanguageManager.get(_0x163177, _0x1ff33f.nameKey);
      _0x14efd5.button(
        LanguageManager.get(
          _0x163177,
          "shop.item_button",
          _0x71ec48,
          _0x1ff33f.cost,
        ),
      );
    }
    _0x14efd5.show(_0x163177)["then"]((_0x57ef42) => {
      if (_0x57ef42.canceled) return;
      const _0x4c03db = this.shopItems[_0x57ef42.selection];
      if (!_0x4c03db) return;
      if (_0x15b107 >= _0x4c03db.cost) {
        _0x493871.addScore(_0x163177.scoreboardIdentity, -_0x4c03db.cost);
        const _0x4555c7 = new ItemStack(_0x4c03db.itemId, 1);
        _0x163177.getComponent("inventory")["container"]["addItem"](_0x4555c7);
        const _0x396701 = LanguageManager.get(_0x163177, _0x4c03db.nameKey);
        _0x163177.sendMessage(
          LanguageManager.get(_0x163177, "shop.purchase_success", _0x396701),
        );
        _0x163177.playSound("random.levelup");
      } else {
        _0x163177.sendMessage(
          LanguageManager.get(_0x163177, "shop.not_enough_pollen"),
        );
        _0x163177.playSound("note.bass");
      }
    });
  }
}
