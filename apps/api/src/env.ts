/**
 * The environment this process needs, validated once at boot.
 *
 * Validating here rather than at first use is the whole point: a missing
 * variable should be a startup failure naming the variable, not a 500 three
 * screens into a flow with a stack trace that names neither.
 *
 * A base repo boots with NOTHING set — every variable below has a default that
 * works on a laptop. Adopting a subsystem is what adds required ones, and each
 * of those belongs next to its own mount, not here.
 */

export interface Env {
  /** Port the API listens on. */
  port: number;
  /** Origin the SPA is served from, for CORS. */
  spaOrigin: string;
  /** `development` | `production` | `test`. */
  nodeEnv: string;
}

class EnvError extends Error {}

function readPort(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 3000;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new EnvError(`PORT must be an integer between 1 and 65535, got ${raw}`);
  }
  return port;
}

/**
 * Read and validate the environment.
 *
 * Throws {@link EnvError} with a message naming the offending variable, which
 * the bootstrap prints before exiting non-zero.
 */
export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return {
    port: readPort(source.PORT),
    spaOrigin: source.SPA_ORIGIN ?? "http://localhost:4001",
    nodeEnv: source.NODE_ENV ?? "development",
  };
}

export { EnvError };
