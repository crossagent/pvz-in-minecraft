import json
from pathlib import Path


WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = WORKSPACE_ROOT / "behavior_packs" / "PvZ" / "scripts"


def iter_script_files():
    return sorted(SCRIPTS_ROOT.rglob("*.js"))


def test_current_script_api_only():
    forbidden_tokens = {
        "runCommandAsync": "Use the current Bedrock Script API runCommand method.",
    }
    failures = []

    for script_path in iter_script_files():
        content = script_path.read_text(encoding="utf-8")
        for token, reason in forbidden_tokens.items():
            if token in content:
                rel_path = script_path.relative_to(WORKSPACE_ROOT)
                failures.append(f"{rel_path}: found {token}. {reason}")

    assert not failures, "\n".join(failures)


def test_current_gametest_command_syntax():
    runner = SCRIPTS_ROOT / "tests" / "GameTestRunner.js"
    content = runner.read_text(encoding="utf-8")

    assert "gametest runall" not in content
    assert "`gametest run ${TEST_NAME}`" in content


def test_gametest_cases_are_suite_managed():
    test_root = SCRIPTS_ROOT / "tests"
    runner = test_root / "GameTestRunner.js"
    suite_index = test_root / "suites" / "index.js"

    assert suite_index.exists()

    runner_content = runner.read_text(encoding="utf-8")
    assert "from \"./suites/index.js\"" in runner_content
    assert "rg.register(" in runner_content

    misplaced_registrations = []
    for script_path in test_root.rglob("*.js"):
        if script_path == runner:
            continue
        content = script_path.read_text(encoding="utf-8")
        if "rg.register(" in content:
            misplaced_registrations.append(
                str(script_path.relative_to(WORKSPACE_ROOT))
            )

    assert not misplaced_registrations, "\n".join(misplaced_registrations)


def test_gametest_suite_categories_are_registered():
    suite_index = SCRIPTS_ROOT / "tests" / "suites" / "index.js"
    content = suite_index.read_text(encoding="utf-8")

    expected_categories = [
        "environmentCases",
        "levelFrameworkCases",
        "coreMechanicsCases",
        "unitInteractionCases",
    ]
    for category in expected_categories:
        assert category in content


def test_legacy_function_tick_is_disabled():
    tick_json = WORKSPACE_ROOT / "behavior_packs" / "PvZ" / "functions" / "tick.json"
    content = json.loads(tick_json.read_text(encoding="utf-8"))

    assert content["values"] == []
