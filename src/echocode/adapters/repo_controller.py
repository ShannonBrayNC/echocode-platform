from pathlib import Path


class RepoController:
    def create_branch_structure(self, work_item_id: str) -> Path:
        path = Path("artifacts/branches") / work_item_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def simulate_commit(self, message: str) -> None:
        print(f"[RepoController] Commit: {message}")