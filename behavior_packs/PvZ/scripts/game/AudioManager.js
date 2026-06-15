import { world } from "@minecraft/server";

export class AudioManager {
  static levelMusicList = ["grass.walk"];

  static playRandomLevelMusic(player) {
    const randomIndex = Math.floor(Math.random() * this.levelMusicList.length);
    const musicTrack = this.levelMusicList[randomIndex];
    const { x, y, z } = player.location;
    player.runCommand(`playsound ${musicTrack} @s ${x} ${y} ${z}`);
  }

  static playSound(soundId, player) {
    const { x, y, z } = player.location;
    player.runCommand(`playsound ${soundId} @s ${x} ${y} ${z}`);
  }

  static playSoundAtLocation(soundId, location) {
    const { x, y, z } = location;
    world
      .getDimension("overworld")
      .runCommand(`playsound ${soundId} @a ${x} ${y} ${z}`);
  }

  static stopMusic() {
    world.getDimension("overworld").runCommand("stopsound @a");
  }
}
