import { world } from "@minecraft/server";
export class AudioManager {
  static levelMusicList = ["grass.walk"];
  static playRandomLevelMusic(_0x574cb1) {
    const _0x30b6ae = Math.floor(Math.random() * this.levelMusicList.length);
    const _0x3a4232 = this.levelMusicList[_0x30b6ae];
    const { x: _0x30c571, y: _0x30bcd3, z: _0x476fcc } = _0x574cb1.location;
    _0x574cb1.runCommandAsync(
      "playsound " +
        _0x3a4232 +
        " @s " +
        _0x30c571 +
        " " +
        _0x30bcd3 +
        " " +
        _0x476fcc,
    );
  }
  static playSound(_0x52737b, _0x52e0d0) {
    const { x: _0x3a3ce6, y: _0x50c6db, z: _0x3cb983 } = _0x52e0d0.location;
    _0x52e0d0.runCommandAsync(
      "playsound " +
        _0x52737b +
        " @s " +
        _0x3a3ce6 +
        " " +
        _0x50c6db +
        " " +
        _0x3cb983,
    );
  }
  static playSoundAtLocation(_0x2b9888, _0x2d815d) {
    const { x: _0x34ff1e, y: _0x3621e0, z: _0x2dfd71 } = _0x2d815d;
    world
      .getDimension("overworld")
      [
        "runCommandAsync"
      ]("playsound " + _0x2b9888 + " @a " + _0x34ff1e + " " + _0x3621e0 + " " + _0x2dfd71);
  }
  static stopMusic() {
    world.getDimension("overworld")["runCommandAsync"]("stopsound @a");
  }
}
