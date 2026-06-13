import { world } from "@minecraft/server";
export class PlayerManager {
  static handleLookingAt(_0x8bc4a0) {
    try {
      const _0x5c5de8 = _0x8bc4a0.getBlockFromViewDirection({
        maxDistance: 0x96,
      });
      if (!_0x5c5de8) return;
      const _0x283be5 = _0x5c5de8.block;
      const _0x5995f7 = _0x283be5.below();
      const _0x5759f9 = ["minecraft:gold_block", "minecraft:iron_block"];
      if (!_0x5995f7 || !_0x5759f9.includes(_0x5995f7.typeId)) {
        return;
      }
      const _0x5da467 = _0x5995f7.location.y;
      const _0x3ca224 = _0x5995f7.typeId;
      const _0x2f91bd = _0x5995f7.location.x;
      const _0x300f11 = _0x5995f7.location.z;
      const _0x3415f2 = [
        { x: 0x0, z: 0x0 },
        { x: -1, z: 0x0 },
        { x: -2, z: 0x0 },
        { x: 0x0, z: -1 },
        { x: -1, z: -1 },
        { x: -2, z: -1 },
      ];
      let _0x2beccf = ![];
      let _0x499b71 = 0,
        _0x367539 = 0;
      for (const _0x247d33 of _0x3415f2) {
        const _0x318eac = _0x2f91bd + _0x247d33.x;
        const _0x30d459 = _0x300f11 + _0x247d33.z;
        let _0x306490 = !![];
        for (let _0x4b3f69 = 0; _0x4b3f69 < 3; _0x4b3f69++) {
          for (let _0x3055dc = 0; _0x3055dc < 2; _0x3055dc++) {
            const _0x2a731a = _0x8bc4a0.dimension.getBlock({
              x: _0x318eac + _0x4b3f69,
              y: _0x5da467,
              z: _0x30d459 + _0x3055dc,
            });
            if (_0x2a731a?.["typeId"] !== _0x3ca224) {
              _0x306490 = ![];
              break;
            }
          }
          if (!_0x306490) break;
        }
        if (_0x306490) {
          _0x2beccf = !![];
          _0x499b71 = _0x318eac;
          _0x367539 = _0x30d459;
          break;
        }
      }
      if (_0x2beccf) {
        const _0x41eeff = _0x5da467 + 1;
        const _0x442d60 = "bn_we:out_line";
        const _0x9bbc44 = [
          { x: -0.1, y: -0.1, z: -0.1 },
          { x: 3.1, y: -0.1, z: -0.1 },
          { x: -0.1, y: -0.1, z: 2.1 },
          { x: 3.1, y: -0.1, z: 2.1 },
          { x: -0.1, y: 1.1, z: -0.1 },
          { x: 3.1, y: 1.1, z: -0.1 },
          { x: -0.1, y: 1.1, z: 2.1 },
          { x: 3.1, y: 1.1, z: 2.1 },
        ];
        for (const _0x575df0 of _0x9bbc44) {
          const _0x31b789 = {
            x: _0x499b71 + _0x575df0.x,
            y: _0x41eeff + _0x575df0.y,
            z: _0x367539 + _0x575df0.z,
          };
          _0x8bc4a0.dimension.spawnParticle(_0x442d60, _0x31b789);
        }
      }
    } catch (_0x26e9a2) {}
  }
}
