summon bn:lawnmower -21 57 174
summon bn:lawnmower -22 57 174


tp @s -20.99 65.00 172.90 facing -21 58 179
inputpermission set @a movement disabled
##gives items##
replaceitem entity @a slot.hotbar 8 bn:shop 1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"},"minecraft:keep_on_death":{}}
replaceitem entity @a slot.hotbar 7 bn:pollen 1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"},"minecraft:keep_on_death":{}}
replaceitem entity @a slot.hotbar 6 bn:shovel 1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"},"minecraft:keep_on_death":{}}

##gives starting points##
scoreboard players set @e[type=bn:dummy,name="SB"] pollen 50
tag @a add start
tag @e[name="SB"] add start
structure load x2 -29 55 175
