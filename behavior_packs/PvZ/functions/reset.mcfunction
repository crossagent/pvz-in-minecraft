event entity @e[type=bn:lawnmower] bn:remove
event entity @e[family=plant] bn:remove
event entity @e[type=bn:zombie] bn:remove

inputpermission set @a movement enabled
tag @e remove start
clear @a
scoreboard players set @e[type=bn:dummy,name="SB"] pollen 0