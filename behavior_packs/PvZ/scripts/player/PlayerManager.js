import { world } from "@minecraft/server";

export class PlayerManager {
  static handleLookingAt(player) {
    try {
      const raycastResult = player.getBlockFromViewDirection({
        maxDistance: 150,
      });
      if (!raycastResult) return;
      const targetBlock = raycastResult.block;
      const belowBlock = targetBlock.below();
      const validBlocks = ["minecraft:gold_block", "minecraft:iron_block"];
      if (!belowBlock || !validBlocks.includes(belowBlock.typeId)) {
        return;
      }
      const y = belowBlock.location.y;
      const blockTypeId = belowBlock.typeId;
      const x = belowBlock.location.x;
      const z = belowBlock.location.z;
      const offsets = [
        { x: 0, z: 0 },
        { x: -1, z: 0 },
        { x: -2, z: 0 },
        { x: 0, z: -1 },
        { x: -1, z: -1 },
        { x: -2, z: -1 },
      ];
      let gridValid = false;
      let gridX = 0,
        gridZ = 0;
      for (const offset of offsets) {
        const checkX = x + offset.x;
        const checkZ = z + offset.z;
        let cellValid = true;
        for (let dx = 0; dx < 3; dx++) {
          for (let dz = 0; dz < 2; dz++) {
            const block = player.dimension.getBlock({
              x: checkX + dx,
              y: y,
              z: checkZ + dz,
            });
            if (block?.typeId !== blockTypeId) {
              cellValid = false;
              break;
            }
          }
          if (!cellValid) break;
        }
        if (cellValid) {
          gridValid = true;
          gridX = checkX;
          gridZ = checkZ;
          break;
        }
      }
      if (gridValid) {
        const particleY = y + 1;
        const particleName = "bn_we:out_line";
        const particleOffsets = [
          { x: -0.1, y: -0.1, z: -0.1 },
          { x: 3.1, y: -0.1, z: -0.1 },
          { x: -0.1, y: -0.1, z: 2.1 },
          { x: 3.1, y: -0.1, z: 2.1 },
          { x: -0.1, y: 1.1, z: -0.1 },
          { x: 3.1, y: 1.1, z: -0.1 },
          { x: -0.1, y: 1.1, z: 2.1 },
          { x: 3.1, y: 1.1, z: 2.1 },
        ];
        for (const pOffset of particleOffsets) {
          const particlePos = {
            x: gridX + pOffset.x,
            y: particleY + pOffset.y,
            z: gridZ + pOffset.z,
          };
          player.dimension.spawnParticle(particleName, particlePos);
        }
      }
    } catch (e) {}
  }
}
