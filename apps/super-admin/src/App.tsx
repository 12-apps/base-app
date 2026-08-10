import { Suspense, type JSX } from "react";
import { useRoutes } from "react-router-dom";
import { Providers } from "@base/spa-shell/providers";

import { routes } from "./routes";

function Routed(): JSX.Element | null {
  return useRoutes(routes);
}

export function App(): JSX.Element {
  // Same as admin: nothing resolves the actor's permissions yet (12-13), so the
  // set is empty and every gate denies. On THIS surface that default matters
  // more — a platform console is the one that can reach every tenant.
  return (
    <Providers appName="base-app super admin">
      <Suspense fallback={null}>
        <Routed />
      </Suspense>
    </Providers>
  );
}
