import { EasingType, system } from "@minecraft/server";
export class CutsceneManager {
  static _calculateRotation(_0x28ec2d, _0x262118) {
    const _0xfc621 = _0x262118.x - _0x28ec2d.x;
    const _0x721acf = _0x262118.y - _0x28ec2d.y;
    const _0x20f316 = _0x262118.z - _0x28ec2d.z;
    const _0x15c55a = Math.sqrt(_0xfc621 * _0xfc621 + _0x20f316 * _0x20f316);
    const _0x19213c = -Math.atan2(_0x721acf, _0x15c55a) * (180 / Math.PI);
    let _0xad871e = Math.atan2(_0x20f316, _0xfc621) * (180 / Math.PI) - 90;
    if (_0xad871e < -180) _0xad871e += 360;
    return { x: _0x19213c, y: _0xad871e };
  }
  static playStartCutscene(_0x3003bc, _0xe3ed38) {
    return new Promise((_0x209da0) => {
      _0x3003bc.runCommandAsync("inputpermission set @s camera disabled");
      _0x3003bc.runCommandAsync("inputpermission set @s movement disabled");
      _0x3003bc.camera.setCamera("minecraft:free", {
        location: _0x3003bc.getHeadLocation(),
        rotation: _0x3003bc.getRotation(),
      });
      const _0x231078 = (_0x131a63) => {
        if (_0x131a63 >= _0xe3ed38.length) {
          _0x3003bc.camera.clear();
          _0x3003bc.runCommandAsync("inputpermission set @s camera enabled");
          _0x3003bc.runCommandAsync("inputpermission set @s movement enabled");
          _0x209da0();
          return;
        }
        const _0x3f80f6 = _0xe3ed38[_0x131a63];
        const _0xfab2fc = this._calculateRotation(
          _0x3f80f6.location,
          _0x3f80f6.lookAtPoint,
        );
        _0x3003bc.camera.setCamera("minecraft:free", {
          location: _0x3f80f6.location,
          rotation: _0xfab2fc,
          easeOptions: {
            easeTime: _0x3f80f6.easeTime || 1.5,
            easeType: EasingType.InOutSine,
          },
        });
        const _0x51b4ee =
          ((_0x3f80f6.easeTime || 1.5) + (_0x3f80f6.holdTime || 4)) * 20;
        system.runTimeout(() => {
          _0x231078(_0x131a63 + 1);
        }, _0x51b4ee);
      };
      system.runTimeout(() => {
        _0x231078(0);
      }, 1);
    });
  }
}
