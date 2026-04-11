from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from openai import OpenAI

from echocode.agents.base import BaseAgent
from echocode.utils.files import write_text_file


class LLMCodingAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(name="llm_coding_agent")
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        work_item = payload["work_item"]
        allowed_files = work_item.get("allowed_files", [])
        failure_context = payload.get("failure_context", "")

        if not allowed_files:
            return {
                "agent": self.name,
                "status": "error",
                "message": "No allowed_files specified.",
            }

        target_file = Path(allowed_files[0])

        prompt = f"""
You are a senior software engineer.

Write Python code for this work item.

Title: {work_item["title"]}
Expected outcomes: {work_item["expected_outcomes"]}

Rules:
- Must define a function named execute()
- execute() must return a string
- No external dependencies beyond Python standard library
- Keep the code small, clean, and production-quality
- Output code only, no markdown fences

Failure context from the last test run:
{failure_context}
"""

        response = self.client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You write concise, correct Python code."},
                {"role": "user", "content": prompt},
            ],
        )

        code = response.choices[0].message.content or ""

        write_text_file(target_file, code)

        return {
            "agent": self.name,
            "status": "ok",
            "file_written": str(target_file),
        }