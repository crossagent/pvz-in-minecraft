import { ActionFormData } from "@minecraft/server-ui";
class CustomForm {
  ["categories"] = new Map();
  ["titleText"] = "";
  ["bodytext"] = "";
  ["title"](_0x3a40be) {
    this.titleText = _0x3a40be;
    return this;
  }
  ["body"](_0x5170b1) {
    this.bodytext = _0x5170b1;
    return this;
  }
  ["button"](_0xea89ea, _0x19a2e7, _0x2294ec = "", _0x7b4606 = ![]) {
    if (this.categories.has(_0xea89ea)) {
      this.categories
        .get(_0xea89ea)
        ["push"]({ text: _0x19a2e7, texture: _0x2294ec, enchanted: _0x7b4606 });
    } else {
      this.categories.set(_0xea89ea, [
        { text: _0x19a2e7, texture: _0x2294ec, enchanted: _0x7b4606 },
      ]);
    }
    return this;
  }
  ["getKeyAtIndex"](_0x26da15) {
    const _0x348488 = Array.from(this.categories.keys());
    if (_0x26da15 >= 0 && _0x26da15 < _0x348488.length) {
      return _0x348488[_0x26da15];
    } else {
      console.error("Index out of bounds.");
      return null;
    }
  }
  ["show"](_0xafa190, _0x3443f2 = this.getKeyAtIndex(0)) {
    let _0x1cc51e = new ActionFormData();
    let _0x35e73d = "§c§u§s§t§o§m§r" + this.titleText;
    _0x1cc51e.title(_0x35e73d);
    let _0x427848 = this.categories.get(_0x3443f2);
    if (_0x427848) {
      for (const _0x5a4931 of _0x427848) {
        _0x1cc51e.button(_0x5a4931.text, _0x5a4931.texture);
      }
    }
    for (let _0x59f149 = 0; _0x59f149 < this.categories.size; _0x59f149++) {
      _0x1cc51e.button("§c§a§t§e§g§o§r§y§8 " + this.getKeyAtIndex(_0x59f149));
    }
    let _0x1bb56a = "";
    let _0xd9dc98 = JSON.stringify(this.categories.size)["length"];
    _0xd9dc98 = _0xd9dc98 % 2 == 0 ? _0xd9dc98 : _0xd9dc98 + 1;
    for (let _0x1142c5 = _0xd9dc98; _0x1142c5 <= 10; _0x1142c5++) {
      _0x1bb56a += "]";
    }
    let _0xc76efa =
      JSON.stringify(this.categories.size) + _0x1bb56a + this.bodytext;
    _0x1cc51e.body(_0xc76efa);
    return _0x1cc51e.show(_0xafa190)["then"]((_0x9ad2e4) => {
      if (!_0x9ad2e4) {
        return;
      }
      let _0x307a9e = _0x427848 ? _0x427848.length : 0;
      let _0x3916b3 = _0x307a9e + this.categories.size;
      if (_0x9ad2e4.selection >= _0x307a9e && _0x9ad2e4.selection < _0x3916b3) {
        return this.show(
          _0xafa190,
          this.getKeyAtIndex(_0x9ad2e4.selection - _0x307a9e),
        );
      }
      if (_0x427848 && _0x9ad2e4.selection < _0x427848.length) {
        _0x9ad2e4.text = _0x427848[_0x9ad2e4.selection]["text"];
      }
      _0x9ad2e4.category = _0x3443f2;
      return _0x9ad2e4;
    });
  }
}
export { CustomForm };
