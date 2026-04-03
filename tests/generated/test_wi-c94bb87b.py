def test_execution() -> None:
    from echocode.generated.req_abc123_wi_c94bb87b import execute

    result = execute()

    assert result is not None
    assert isinstance(result, str)
