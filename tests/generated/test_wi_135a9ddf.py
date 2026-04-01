def test_execution() -> None:
    from echocode.generated.req_abc123_wi_135a9ddf import execute

    result = execute()

    assert result is not None
    assert isinstance(result, str)
