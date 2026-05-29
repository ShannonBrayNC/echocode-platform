import type { EchoCodexEvent } from "../events/EchoCodexEvent.js";

export type SignalForgeRouteResult = {
  routed: boolean;
  adapter: string;
  eventId: string;
  eventType: string;
  reason?: string;
};

export interface SignalForgeAdapter {
  route(event: EchoCodexEvent): Promise<SignalForgeRouteResult>;
}

export class NoopSignalForgeAdapter implements SignalForgeAdapter {
  async route(event: EchoCodexEvent): Promise<SignalForgeRouteResult> {
    return {
      routed: false,
      adapter: "noop-signalforge",
      eventId: event.eventId,
      eventType: event.eventType,
      reason: "No external SignalForge service is called in this implementation."
    };
  }
}
