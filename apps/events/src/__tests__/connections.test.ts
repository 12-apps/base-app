import { describe, expect, it, vi } from "vitest";

import { Connections, type Sink } from "../connections";

function sink(): Sink & { sent: string[] } {
  const sent: string[] = [];
  return { sent, send: (payload) => void sent.push(payload) };
}

describe("Connections", () => {
  it("delivers only to the sinks subscribed to that topic", () => {
    const connections = new Connections();
    const a = sink();
    const b = sink();
    connections.subscribe(a, "orders");
    connections.subscribe(b, "tables");

    const delivered = connections.publish({ topic: "orders", event: "paid", data: { id: 1 } });

    expect(delivered).toBe(1);
    expect(a.sent).toEqual([JSON.stringify({ topic: "orders", event: "paid", data: { id: 1 } })]);
    expect(b.sent).toEqual([]);
  });

  it("is idempotent, so a resubscribe does not double-deliver", () => {
    const connections = new Connections();
    const a = sink();
    connections.subscribe(a, "orders");
    connections.subscribe(a, "orders");

    expect(connections.publish({ topic: "orders", event: "x", data: null })).toBe(1);
  });

  it("frees the topic entry when its last sink goes, so the map cannot grow forever", () => {
    const connections = new Connections();
    const a = sink();
    connections.subscribe(a, "table:42");
    expect(connections.topicCount).toBe(1);

    connections.drop(a);

    expect(connections.topicCount).toBe(0);
    expect(connections.topicsFor(a)).toEqual([]);
  });

  it("keeps delivering to healthy sinks when one throws, and drops the broken one", () => {
    const connections = new Connections();
    const broken: Sink = { send: vi.fn(() => { throw new Error("socket closed"); }) };
    const healthy = sink();
    connections.subscribe(broken, "orders");
    connections.subscribe(healthy, "orders");

    const delivered = connections.publish({ topic: "orders", event: "paid", data: null });

    expect(delivered).toBe(1);
    expect(healthy.sent).toHaveLength(1);
    expect(connections.topicsFor(broken)).toEqual([]);
  });
});
