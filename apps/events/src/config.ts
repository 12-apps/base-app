/**
 * What the gateway needs to run. Everything has a laptop default.
 */
export interface EventsConfig {
  /** Port the WebSocket server listens on. */
  port: number;
  /** How often to ping an idle client, in ms. A dead peer is otherwise invisible. */
  heartbeatMs: number;
  /**
   * Redis for cross-process delivery. Unset means inline: this process only
   * relays what it is told directly, which is enough for a single-box dev run
   * and is why a base app with no Redis still works.
   */
  redisUrl: string | undefined;
}

export function readConfig(source: NodeJS.ProcessEnv = process.env): EventsConfig {
  const raw = source.EVENTS_PORT;
  const port = raw === undefined || raw === "" ? 3010 : Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`EVENTS_PORT must be an integer between 1 and 65535, got ${raw}`);
  }
  return {
    port,
    heartbeatMs: 30_000,
    redisUrl: source.REDIS_URL || undefined,
  };
}
