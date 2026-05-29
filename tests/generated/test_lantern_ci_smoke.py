from echocode.generated import validate_lantern_ci_contract


def test_validate_lantern_ci_contract() -> None:
    result = validate_lantern_ci_contract()

    assert result["component"] == "echocodex"
    assert result["lantern_protocol_ready"] is True
    assert result["ci_contract"] == "generated-python-smoke"
