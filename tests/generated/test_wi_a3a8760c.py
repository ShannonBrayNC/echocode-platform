def test_execution() -> None:
    from echocode.generated.req_abc123_wi_a3a8760c import execute

    result = execute()

    assert result is not None
    assert isinstance(result, str)
