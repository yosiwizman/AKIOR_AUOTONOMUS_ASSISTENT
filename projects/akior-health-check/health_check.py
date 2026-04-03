#!/usr/bin/env python3
"""AKIOR Health Check CLI — validates core infrastructure."""

import os
import subprocess
import sys
import json

AKIOR_ROOT = os.path.expanduser("~/akior")


def check_directory_structure():
    """Verify the AKIOR directory tree exists with required subdirectories."""
    required = [
        "domains", "memory", "ledgers", "evidence/screenshots",
        "evidence/terminal", "forge", "checkpoints", "config/hooks",
        "config/canary", "projects", ".claude"
    ]
    missing = [d for d in required if not os.path.isdir(os.path.join(AKIOR_ROOT, d))]
    return len(missing) == 0, missing


def check_claude_md():
    """Verify CLAUDE.md exists and contains constitution marker."""
    path = os.path.join(AKIOR_ROOT, "CLAUDE.md")
    if not os.path.isfile(path):
        return False, "CLAUDE.md not found"
    with open(path) as f:
        content = f.read()
    if "AKIOR" not in content:
        return False, "CLAUDE.md missing AKIOR identifier"
    return True, "OK"


def check_ledger_files():
    """Verify all 5 ledger files exist."""
    ledgers = ["action.md", "tool.md", "financial.md", "deployment.md", "decision.md"]
    ledger_dir = os.path.join(AKIOR_ROOT, "ledgers")
    missing = [l for l in ledgers if not os.path.isfile(os.path.join(ledger_dir, l))]
    return len(missing) == 0, missing


def check_ollama():
    """Verify Ollama responds to a simple query."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True, text=True, timeout=10
        )
        return result.returncode == 0, result.stdout.strip()[:100]
    except FileNotFoundError:
        return False, "ollama not found"
    except subprocess.TimeoutExpired:
        return False, "ollama timed out"


def check_docker():
    """Verify Docker daemon is running."""
    try:
        result = subprocess.run(
            ["docker", "ps"],
            capture_output=True, text=True, timeout=10
        )
        return result.returncode == 0, "Docker running"
    except FileNotFoundError:
        return False, "docker not found"
    except subprocess.TimeoutExpired:
        return False, "docker timed out"


def classify_with_ollama(text, model="qwen2.5-coder:7b"):
    """Classify text using local Ollama model. Falls back if unavailable."""
    prompt = f"Classify as URGENT or ROUTINE (reply with one word only): {text}"
    try:
        result = subprocess.run(
            ["ollama", "run", model],
            input=prompt, capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            return result.stdout.strip(), "ollama"
        return "ROUTINE (fallback)", "fallback"
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return "ROUTINE (fallback)", "fallback"


def run_all_checks():
    """Run all health checks and return structured results."""
    results = {}

    ok, detail = check_directory_structure()
    results["directory_structure"] = {"pass": ok, "detail": str(detail)}

    ok, detail = check_claude_md()
    results["claude_md"] = {"pass": ok, "detail": detail}

    ok, detail = check_ledger_files()
    results["ledger_files"] = {"pass": ok, "detail": str(detail)}

    ok, detail = check_ollama()
    results["ollama"] = {"pass": ok, "detail": detail}

    ok, detail = check_docker()
    results["docker"] = {"pass": ok, "detail": detail}

    classification, source = classify_with_ollama("server is down, customers affected")
    results["ollama_classify"] = {"pass": source == "ollama", "detail": f"{classification} (via {source})"}

    passed = sum(1 for r in results.values() if r["pass"])
    total = len(results)
    results["summary"] = {"passed": passed, "total": total, "status": "HEALTHY" if passed == total else "DEGRADED"}

    return results


def main():
    results = run_all_checks()
    print(json.dumps(results, indent=2))
    sys.exit(0 if results["summary"]["status"] == "HEALTHY" else 1)


if __name__ == "__main__":
    main()
