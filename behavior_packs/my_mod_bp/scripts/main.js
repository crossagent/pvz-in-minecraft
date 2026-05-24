import { world } from "@minecraft/server";

// 游戏初始化事件
world.afterEvents.worldInitialize.subscribe(() => {
    console.warn("[MyMod] Mod script loaded and initialized successfully!");
});

// 玩家出生/重生事件
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (event.initialSpawn) {
        player.sendMessage("§a[MyMod] 欢迎来到服务器！自定义 Mod 脚本已激活。");
    }
});
