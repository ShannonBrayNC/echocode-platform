from echocode.adapters.repo_controller import RepoController


def test_repo_controller_creates_branch_note() -> None:
    controller = RepoController()
    result = controller.simulate_commit("WI-TEST999", "Test commit")

    assert result["work_item_id"] == "WI-TEST999"
    assert "branch_note" in result