scoreboard players operation "Pollen" pvzd = @e[type=bn:dummy,name=SB] pollen
##execute as @a[hasitem={item=bn:pollen}] at @s run scoreboard players add @e[type=bn:dummy,name="SB"] pollen 1
##execute as @a[hasitem={item=bn:pollen}] at @s run clear @s bn:pollen 0 1