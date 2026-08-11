import { Suspense, type JSX } from "react";
import { useRoutes } from "react-router-dom";
import { Providers } from "@base/spa-shell/providers";

import { routes } from "./routes";

function Routed(): JSX.Element | null {
  return useRoutes(routes);
}

export function App(): JSX.Element {
  // `permissions` is deliberately not passed: nothing resolves the actor's set
  // yet (12-13), so it defaults to empty and every `<Can>` denies. A backoffice
  // that showed its screens before authorization was wired would teach the
  // wrong lesson to every app forked from this one.
  return (
    <Providers appName="base-app admin">
      <Suspense fallback={null}>
        <Routed />
      </Suspense>
    </Providers>
  );
}

// stack-test: marker for the stacked-PR selection test (layer 2).
// This layer touches ONLY apps/admin. Mid-stack, turbo diffs against layer 1
// and sees just this package; stack-aware diffs against main and sees both.
// stack-test: touch to fire a synchronize event after stacking.
// stack-test: retrigger after the path-filter fix (ci#54).
