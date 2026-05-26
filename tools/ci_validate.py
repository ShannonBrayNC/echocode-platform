from pathlib import Path


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    raise SystemExit(1)


def check_generated_files() -> None:
    gen_path = Path("src/echocode/generated")
    if not gen_path.exists():
        fail("Generated code folder missing")

    files = list(gen_path.glob("*.py"))
    if not files:
        fail("No generated Python files found")


def check_tests_exist() -> None:
    test_path = Path("tests/generated")
    if not test_path.exists():
        fail("Generated tests folder missing")

    tests = list(test_path.glob("test_*.py"))
    if not tests:
        fail("No generated tests found")


def check_evidence() -> None:
    evidence_path = Path("artifacts/evidence")
    if not evidence_path.exists():
        fail("Evidence folder missing")

    evidence_files = list(evidence_path.glob("*.json"))
    if not evidence_files:
        fail("No evidence files found")


def main() -> None:
    print("Running CI validation checks...")
    check_generated_files()
    check_tests_exist()
    check_evidence()
    print("All CI checks passed.")


if __name__ == "__main__":
    main()
