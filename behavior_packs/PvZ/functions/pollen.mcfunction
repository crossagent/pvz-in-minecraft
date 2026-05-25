execute as @e[type=bn:pollen] at @s if entity @p[r=1] run scoreboard players add @p[c=1] pollen 25
execute as @e[type=bn:pollen] at @s if entity @p[r=1] run playsound sun.pickup @p
execute as @e[type=bn:pollen] at @s if entity @p[r=1] run event entity @s bn:remove

effect @a speed infinite 2 true
effect @a jump_boost infinite 1 true
effect @a saturation infinite 255 true

effect @e[type=bn:pollen] slow_falling infinite 20 true

execute as @e[type=bn:trampoline] at @s if entity @p[r=1.5] run playsound bounce @a
execute as @e[type=bn:trampoline] at @s if entity @p[r=1.5] run tp @p[c=1] -21.06 65.00 172.79 facing -22 56 181
