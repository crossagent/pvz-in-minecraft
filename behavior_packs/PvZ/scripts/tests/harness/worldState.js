import { world } from "@minecraft/server";

const RUNTIME_ENTITY_PREFIXES = [
  "bn:plant_",
  "bn:pollen",
  "bn:lawnmower",
  "bn:zombie",
  "bn:projectile_",
  "bn:cherry_tnt",
  "bn:wallnut",
  "bn:potato_mine",
  "bn:snow_pea",
  "bn:sunflower",
  "bn:peashooter",
  "bn:dummy",
];

const RUNTIME_STATE_DEFAULTS = {
  gameActive: false,
  tutorialActive: false,
  awaitingPlantCollection: false,
  unlockedPlantId: "",
  currentLevelId: "",
  currentWave: 0,
  zombiesKilledThisWave: 0,
  zombiesSpawnedThisWave: 0,
  nextPollenSpawnTick: 0,
  nextZombieSpawnTick: 0,
  nextWaveStartTick: 0,
  waveSpawnDeck: "[]",
  waveLocationDeck: "[]",
};

export function clearRuntimeEntities() {
  const overworld = world.getDimension("overworld");
  for (const entity of overworld.getEntities()) {
    if (
      RUNTIME_ENTITY_PREFIXES.some(
        (prefix) =>
          entity.typeId === prefix || entity.typeId.startsWith(prefix),
      )
    ) {
      try {
        entity.remove();
      } catch (err) {}
    }
  }
}

export function resetRuntimeState() {
  for (const [key, value] of Object.entries(RUNTIME_STATE_DEFAULTS)) {
    world.setDynamicProperty(key, value);
  }
  world.setDynamicProperty("completedLevels", "[]");
  clearRuntimeEntities();
}

export function ensureObjective(objectiveId, displayName = objectiveId) {
  return (
    world.scoreboard.getObjective(objectiveId) ??
    world.scoreboard.addObjective(objectiveId, displayName)
  );
}

export function setScore(objectiveId, target, value) {
  const objective = ensureObjective(objectiveId);
  objective.setScore(target, value);
}

export function addScore(objectiveId, target, value) {
  const objective = ensureObjective(objectiveId);
  objective.addScore(target, value);
}

export function getScore(objectiveId, target) {
  return world.scoreboard.getObjective(objectiveId)?.getScore(target) ?? 0;
}

export function deleteTestLevel(levelData, levelId) {
  if (levelData.has(levelId)) {
    levelData.delete(levelId);
  }
}
