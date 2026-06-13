import { EasingType, system } from "@minecraft/server";

export class CutsceneManager {
  static _calculateRotation(fromLocation, toLocation) {
    const dx = toLocation.x - fromLocation.x;
    const dy = toLocation.y - fromLocation.y;
    const dz = toLocation.z - fromLocation.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
    const pitch = -Math.atan2(dy, horizontalDistance) * (180 / Math.PI);
    let yaw = Math.atan2(dz, dx) * (180 / Math.PI) - 90;

    if (yaw < -180) {
      yaw += 360;
    }
    return { x: pitch, y: yaw };
  }

  static playStartCutscene(player, points) {
    return new Promise((resolve) => {
      player.runCommandAsync("inputpermission set @s camera disabled");
      player.runCommandAsync("inputpermission set @s movement disabled");
      player.camera.setCamera("minecraft:free", {
        location: player.getHeadLocation(),
        rotation: player.getRotation(),
      });

      const playPoint = (index) => {
        if (index >= points.length) {
          player.camera.clear();
          player.runCommandAsync("inputpermission set @s camera enabled");
          player.runCommandAsync("inputpermission set @s movement enabled");
          resolve();
          return;
        }

        const currentPoint = points[index];
        const rotation = this._calculateRotation(
          currentPoint.location,
          currentPoint.lookAtPoint,
        );

        player.camera.setCamera("minecraft:free", {
          location: currentPoint.location,
          rotation: rotation,
          easeOptions: {
            easeTime: currentPoint.easeTime || 1.5,
            easeType: EasingType.InOutSine,
          },
        });

        const totalTicks =
          ((currentPoint.easeTime || 1.5) + (currentPoint.holdTime || 4)) * 20;
        system.runTimeout(() => {
          playPoint(index + 1);
        }, totalTicks);
      };

      system.runTimeout(() => {
        playPoint(0);
      }, 1);
    });
  }
}
