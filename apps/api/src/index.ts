/**
 * The API process: read the environment, build the app, serve it, and stop
 * cleanly when the orchestrator says so.
 */
import { serve } from "@hono/node-server";

import { createApp, processFeatures } from "./app";
import { EnvError, readEnv, type Env } from "./env";
import { enabledFeatures } from "@base/features";

function main(): void {
  let env: Env;
  try {
    env = readEnv();
  } catch (error) {
    // A bad environment is a startup failure that names the variable, not a 500
    // three screens into a flow.
    const message = error instanceof EnvError ? error.message : String(error);
    process.stderr.write(`Invalid environment: ${message}\n`);
    process.exit(1);
    return;
  }

  const server = serve({ fetch: createApp(env).fetch, port: env.port }, (info) => {
    const on = enabledFeatures(processFeatures);
    process.stdout.write(
      `api listening on http://localhost:${info.port} ` +
        `(${on.length > 0 ? on.join(", ") : "no subsystems enabled"})\n`,
    );
  });

  // Without this the container is killed on the timeout instead of exiting,
  // which turns every rollout into a ~10s stall and drops in-flight requests.
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      server.close(() => process.exit(0));
    });
  }
}

main();
