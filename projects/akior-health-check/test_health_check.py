"""Tests for AKIOR health check."""

import os
import json
import subprocess
from unittest.mock import patch, MagicMock
from health_check import (
    check_directory_structure,
    check_claude_md,
    check_ledger_files,
    check_ollama,
    check_docker,
    classify_with_ollama,
    run_all_checks,
    AKIOR_ROOT,
)


def test_directory_structure():
    """Directory structure should exist after bootstrap."""
    ok, missing = check_directory_structure()
    assert ok is True, f"Missing directories: {missing}"


def test_claude_md_exists():
    """CLAUDE.md should exist and contain AKIOR identifier."""
    ok, detail = check_claude_md()
    assert ok is True, f"CLAUDE.md check failed: {detail}"


def test_ledger_files_exist():
    """All 5 ledger files should exist."""
    ok, missing = check_ledger_files()
    assert ok is True, f"Missing ledgers: {missing}"


def test_classify_fallback():
    """classify_with_ollama should return fallback when ollama is unavailable."""
    with patch("health_check.subprocess.run", side_effect=FileNotFoundError):
        result, source = classify_with_ollama("test input")
        assert source == "fallback"
        assert "fallback" in result.lower()


def test_run_all_checks_returns_summary():
    """run_all_checks should return a dict with a summary key."""
    results = run_all_checks()
    assert "summary" in results
    assert "passed" in results["summary"]
    assert "total" in results["summary"]
    assert results["summary"]["total"] >= 5
