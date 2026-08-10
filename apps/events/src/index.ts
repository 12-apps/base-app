/**
 * The events process: a WebSocket server over the subscription registry.
 *
 * It is a separate app from `api`, and that survives the framework change that
 * originally forced it. Sockets are long-lived and connection-bound while API
 * requests are short and CPU-bound, so one process for both scales the wrong
 * axis; and a deploy of the API would otherwise drop every open subscription.
 *
 * Most of this belongs inside `@12-apps/realtime` as a runnable entry the host
 * configures (12-16). What is here is the minimum that lets the flag mean
 * something today — treat it as a placeholder for the package, not as the
 * design.
 */
import { WebSocketServer, type WebSocket } from "ws";

import { readConfig } from "./config";
import { Connections, type Sink } from "./connections";

interface ClientMessage {
  action: "subscribe" | "unsubscribe";
  topic: string;
}

function parse(raw: string): ClientMessage | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { action, topic } = value as Partial<ClientMessage>;
    if (action !== "subscribe" && action !== "unsubscribe") return null;
    if (typeof topic !== "string" || topic.length === 0) return null;
    return { action, topic };
  } catch {
    return null;
  }
}

function main(): void {
  const config = readConfig();
  const connections = new Connections();
  const server = new WebSocketServer({ port: config.port });

  // A peer that vanishes without closing leaves a socket that looks open
  // forever. Ping on a timer and drop anything that missed the last pong.
  const alive = new WeakSet<WebSocket>();
  const heartbeat = setInterval(() => {
    for (const socket of server.clients) {
      if (!alive.has(socket)) {
        socket.terminate();
        continue;
      }
      alive.delete(socket);
      socket.ping();
    }
  }, config.heartbeatMs);

  server.on("connection", (socket: WebSocket) => {
    alive.add(socket);
    socket.on("pong", () => alive.add(socket));

    const sink: Sink = { send: (payload) => socket.send(payload) };

    socket.on("message", (raw) => {
      const message = parse(raw.toString());
      if (!message) {
        socket.send(JSON.stringify({ error: "bad_message" }));
        return;
      }
      if (message.action === "subscribe") connections.subscribe(sink, message.topic);
      else connections.unsubscribe(sink, message.topic);
    });

    socket.on("close", () => connections.drop(sink));
  });

  process.stdout.write(`events listening on ws://localhost:${config.port}\n`);

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      clearInterval(heartbeat);
      server.close(() => process.exit(0));
    });
  }
}

main();
