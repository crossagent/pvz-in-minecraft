import { world } from "@minecraft/server";

function createInventoryContainer() {
  const slots = new Map();
  const addedItems = [];

  return {
    slots,
    addedItems,
    size: 36,
    clearAll() {
      slots.clear();
      addedItems.length = 0;
    },
    setItem(slot, itemStack) {
      slots.set(slot, itemStack);
    },
    addItem(itemStack) {
      addedItems.push(itemStack);
      for (let slot = 0; slot < this.size; slot++) {
        if (!slots.has(slot)) {
          slots.set(slot, itemStack);
          break;
        }
      }
      return itemStack;
    },
    getItem(slot) {
      return slots.get(slot);
    },
  };
}

export function createFakePlayer(options = {}) {
  const commands = [];
  const cameraCalls = [];
  const actionBars = [];
  const titles = [];
  const sounds = [];
  const messages = [];
  const hudCalls = [];
  const dynamicProperties = new Map();
  const cooldowns = new Map();
  const tags = new Set();
  const inventoryContainer = createInventoryContainer();

  let viewBlock = options.viewBlock ?? undefined;

  const fakePlayer = {
    id: options.id ?? "PvZGameTestFakePlayerId",
    name: options.name ?? "PvZGameTestFakePlayer",
    typeId: "minecraft:player",
    commands,
    cameraCalls,
    actionBars,
    titles,
    sounds,
    messages,
    hudCalls,
    dynamicProperties,
    cooldowns,
    inventoryContainer,
    location: options.location ?? { x: 0, y: 80, z: 0 },
    dimension: options.dimension ?? world.getDimension("overworld"),
    scoreboardIdentity:
      options.scoreboardIdentity ?? "PvZGameTestFakePlayer",
    teleportLocation: null,
    teleportOptions: null,
    isSneaking: false,
    getHeadLocation() {
      return {
        x: this.location.x,
        y: this.location.y + 1.6,
        z: this.location.z,
      };
    },
    getRotation() {
      return { x: 0, y: 0 };
    },
    runCommand(command) {
      commands.push(command);
      return { successCount: 1 };
    },
    teleport(location, teleportOptions = {}) {
      this.teleportLocation = location;
      this.teleportOptions = teleportOptions;
      this.location = location;
      if (teleportOptions.dimension) {
        this.dimension = teleportOptions.dimension;
      }
    },
    getComponent(componentId) {
      if (
        componentId === "inventory" ||
        componentId === "minecraft:inventory"
      ) {
        return {
          container: inventoryContainer,
        };
      }
      if (componentId === "minecraft:equippable") {
        return {
          setEquipment(slot, itemStack) {
            fakePlayer.equipment = { slot, itemStack };
          },
        };
      }
      return undefined;
    },
    sendMessage(message) {
      messages.push(message);
    },
    playSound(soundId, soundOptions = {}) {
      sounds.push({ soundId, soundOptions });
    },
    onScreenDisplay: {
      setActionBar(message) {
        actionBars.push(String(message));
      },
      setTitle(title, titleOptions = {}) {
        titles.push({ title, titleOptions });
      },
      setHudVisibility(visibility, elements) {
        hudCalls.push({ visibility, elements });
      },
    },
    getDynamicProperty(key) {
      return dynamicProperties.get(key);
    },
    setDynamicProperty(key, value) {
      if (value === undefined) {
        dynamicProperties.delete(key);
      } else {
        dynamicProperties.set(key, value);
      }
    },
    hasTag(tag) {
      return tags.has(tag);
    },
    addTag(tag) {
      tags.add(tag);
    },
    removeTag(tag) {
      tags.delete(tag);
    },
    getItemCooldown(category) {
      return cooldowns.get(category) ?? 0;
    },
    startItemCooldown(category, ticks) {
      cooldowns.set(category, ticks);
    },
    setViewBlock(block) {
      viewBlock = block;
    },
    getBlockFromViewDirection() {
      return viewBlock;
    },
    camera: {
      setCamera(cameraPreset, cameraOptions = {}) {
        cameraCalls.push({ cameraPreset, cameraOptions });
      },
      clear() {
        cameraCalls.push({ clear: true });
      },
    },
  };

  return fakePlayer;
}

export function createPlantingDimension(foundationTypeId = "minecraft:gold_block") {
  const overworld = world.getDimension("overworld");

  return {
    spawnEntity(typeId, location) {
      return overworld.spawnEntity(typeId, location);
    },
    getEntities(query) {
      return overworld.getEntities(query);
    },
    runCommand(command) {
      return overworld.runCommand(command);
    },
    getBlock(location) {
      return {
        typeId: foundationTypeId,
        location,
      };
    },
  };
}

export function createFoundationViewBlock(location, foundationTypeId = "minecraft:gold_block") {
  const belowBlock = {
    typeId: foundationTypeId,
    location,
  };

  return {
    typeId: "minecraft:air",
    location: {
      x: location.x,
      y: location.y + 1,
      z: location.z,
    },
    below() {
      return belowBlock;
    },
  };
}
