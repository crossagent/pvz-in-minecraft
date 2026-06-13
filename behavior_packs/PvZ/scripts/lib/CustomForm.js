import { ActionFormData } from "@minecraft/server-ui";

class CustomForm {
  categories = new Map();
  titleText = "";
  bodytext = "";

  title(text) {
    this.titleText = text;
    return this;
  }

  body(text) {
    this.bodytext = text;
    return this;
  }

  button(category, label, texture = "", enchanted = false) {
    if (this.categories.has(category)) {
      this.categories
        .get(category)
        .push({ text: label, texture: texture, enchanted: enchanted });
    } else {
      this.categories.set(category, [
        { text: label, texture: texture, enchanted: enchanted },
      ]);
    }
    return this;
  }

  getKeyAtIndex(index) {
    const keys = Array.from(this.categories.keys());
    if (index >= 0 && index < keys.length) {
      return keys[index];
    } else {
      console.error("Index out of bounds.");
      return null;
    }
  }

  show(player, activeCategory = this.getKeyAtIndex(0)) {
    const form = new ActionFormData();
    const formattedTitle = "§c§u§s§t§o§m§r" + this.titleText;
    form.title(formattedTitle);

    const activeButtons = this.categories.get(activeCategory);
    if (activeButtons) {
      for (const btn of activeButtons) {
        form.button(btn.text, btn.texture);
      }
    }

    for (let i = 0; i < this.categories.size; i++) {
      form.button("§c§a§t§e§g§o§r§y§8 " + this.getKeyAtIndex(i));
    }

    let padding = "";
    let sizeStrLen = JSON.stringify(this.categories.size).length;
    sizeStrLen = sizeStrLen % 2 === 0 ? sizeStrLen : sizeStrLen + 1;
    for (let i = sizeStrLen; i <= 10; i++) {
      padding += "]";
    }

    const formattedBody =
      JSON.stringify(this.categories.size) + padding + this.bodytext;
    form.body(formattedBody);

    return form.show(player).then((response) => {
      if (!response) {
        return;
      }
      const activeButtonCount = activeButtons ? activeButtons.length : 0;
      const totalButtonCount = activeButtonCount + this.categories.size;

      if (
        response.selection >= activeButtonCount &&
        response.selection < totalButtonCount
      ) {
        const selectedCategoryIndex = response.selection - activeButtonCount;
        return this.show(player, this.getKeyAtIndex(selectedCategoryIndex));
      }

      if (activeButtons && response.selection < activeButtons.length) {
        response.text = activeButtons[response.selection].text;
      }
      response.category = activeCategory;
      return response;
    });
  }
}

export { CustomForm };
