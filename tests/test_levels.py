import os
import re
import json
import subprocess
import pytest

# Paths
TESTS_DIR = os.path.dirname(__file__)
WORKSPACE_ROOT = os.path.abspath(os.path.join(TESTS_DIR, ".."))
LEVELS_JS = os.path.join(WORKSPACE_ROOT, "behavior_packs", "PvZ", "scripts", "levels.js")
PLANT_MANAGER_JS = os.path.join(WORKSPACE_ROOT, "behavior_packs", "PvZ", "scripts", "game", "PlantManager.js")

@pytest.fixture(scope="module", autouse=True)
def export_js_data():
    """
    Setup fixture that pre-processes levels.js and PlantManager.js by stripping 
    proprietary Minecraft imports, runs them in Node, and exports data to levels.json.
    """
    # 1. Read levels.js and strip imports
    with open(LEVELS_JS, 'r', encoding='utf-8') as f:
        levels_content = f.read()
    # Strip any import statements
    levels_clean = re.sub(r'import\s+.*?\s+from\s+[\'"].*?[\'"];?', '', levels_content)
    
    # 2. Read PlantManager.js and strip imports and methods (keeping only static properties)
    with open(PLANT_MANAGER_JS, 'r', encoding='utf-8') as f:
        pm_content = f.read()
    pm_clean = re.sub(r'import\s+.*?\s+from\s+[\'"].*?[\'"];?', '', pm_content)
    # Strip LanguageManager reference since we only need plantData
    pm_clean = pm_clean.replace("import { LanguageManager } from \"./LanguageManager.js\";", "")
    
    # Write temp files with .mjs extension to force ES Module loading in Node
    temp_levels = os.path.join(TESTS_DIR, "temp_levels.mjs")
    temp_pm = os.path.join(TESTS_DIR, "temp_pm.mjs")
    
    with open(temp_levels, 'w', encoding='utf-8') as f:
        f.write(levels_clean)
    with open(temp_pm, 'w', encoding='utf-8') as f:
        f.write(pm_clean)
        
    # Write export script (uses same-folder relative imports)
    export_script_content = """
    import { levelData } from "./temp_levels.mjs";
    import { PlantManager } from "./temp_pm.mjs";
    import * as fs from "fs";
    import * as path from "path";
    
    const exportData = {
        levels: Object.fromEntries(levelData),
        plants: Object.fromEntries(PlantManager.plantData)
    };
    
    fs.writeFileSync(
        "./tests/levels.json",
        JSON.stringify(exportData, null, 2),
        "utf-8"
    );
    """
    
    export_js = os.path.join(TESTS_DIR, "export_temp.mjs")
    with open(export_js, 'w', encoding='utf-8') as f:
        f.write(export_script_content)
        
    # Run Node to export the data
    try:
        subprocess.run(
            ["node", "tests/export_temp.mjs"],
            cwd=WORKSPACE_ROOT,
            check=True,
            capture_output=True,
            text=True
        )
    except subprocess.CalledProcessError as e:
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        raise e
    finally:
        # Cleanup temp files
        for temp_file in (temp_levels, temp_pm, export_js):
            if os.path.exists(temp_file):
                os.remove(temp_file)
                
    yield
    
    # Cleanup exported json
    json_path = os.path.join(TESTS_DIR, "levels.json")
    if os.path.exists(json_path):
         os.remove(json_path)

def load_exported_data():
    json_path = os.path.join(TESTS_DIR, "levels.json")
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def test_levels_structure():
    data = load_exported_data()
    levels = data["levels"]
    
    # Ensure there are 8 levels configured
    assert len(levels) >= 8
    for i in range(1, 9):
        assert f"level{i}" in levels

def test_level_details():
    data = load_exported_data()
    levels = data["levels"]
    
    for level_id, level in levels.items():
        # Validate coordinates
        assert "playerStartLocation" in level
        coords = level["playerStartLocation"]
        assert isinstance(coords["x"], (int, float))
        assert isinstance(coords["y"], (int, float))
        assert isinstance(coords["z"], (int, float))
        
        # Validate lawnmowers
        assert "lawnmowers" in level
        assert isinstance(level["lawnmowers"], list)
        
        # Validate waves
        assert "zombieSpawning" in level
        zs = level["zombieSpawning"]
        assert "waves" in zs
        assert len(zs["waves"]) > 0
        for wave in zs["waves"]:
            assert "waveName" in wave
            assert "zombieCount" in wave
            assert wave["zombieCount"] > 0
            assert "mobs" in wave
            assert len(wave["mobs"]) > 0

def test_plant_definitions():
    data = load_exported_data()
    plants = data["plants"]
    
    # Ensure all 6 base plants are configured
    assert len(plants) >= 6
    for i in range(1, 7):
        plant_id = f"bn:plant_{i}"
        assert plant_id in plants
        plant = plants[plant_id]
        assert "nameKey" in plant
        assert "entityId" in plant
        assert "cost" in plant
        assert isinstance(plant["cost"], int)
        assert plant["cost"] > 0
