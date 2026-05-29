import assert from "node:assert/strict";
import test from "node:test";

import { createEchoCodexEvent } from "../../src/integrations/events/EchoCodexEvent.js";
import { NoopSignalForgeAdapter } from "../../src/integrations/signalforge/SignalForgeAdapter.js";

test("creates deterministic EchoCodex events", () => {
  const event = createEchoCodexEvent({
    eventType: "IssueSelected",
    repo: "ShannonBrayNC/echocode-platform",
    runId: "run-1",
    timestamp: "2026-05-29T06:00:00Z",
    provenance: {
      sourceSystem: "christina",
      sourceActor: "runner",
      createdAt: "2026-05-29T06:00:00Z"
    },
    payload: {
      issueNumber: 45
    }
  });

  assert.equal(event.eventId, "20260529060000-shannonbraync-echocode-platform-issueselected");
  assert.equal(event.eventType, "IssueSelected");
  assert.equal(event.payload.issueNumber, 45);
});

test("routes through no-op SignalForge adapter without external calls", async () => {
  const adapter = new NoopSignalForgeAdapter();
  const event = createEchoCodexEvent({
    eventType: "RunCompleted",
    repo: "ShannonBrayNC/echocode-platform",
    timestamp: "2026-05-29T06:00:00Z",
    provenance: {
      sourceSystem: "echocodex",
      sourceActor: "cli",
      createdAt: "2026-05-29T06:00:00Z"
    },
    payload: {
      nextAction: "human-review"
    }
  });

  const result = await adapter.route(event);

  assert.equal(result.routed, false);
  assert.equal(result.adapter, "noop-signalforge");
  assert.equal(result.eventId, event.eventId);
  assert.match(result.reason ?? "", /No external SignalForge service/);
});
