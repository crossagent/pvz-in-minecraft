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
