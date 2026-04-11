def test_execution() -> None:
    from echocode.generated.req_abc123_wi_5d87c2e6 import execute

    result = execute()

    assert result is not None
    assert isinstance(result, str)
