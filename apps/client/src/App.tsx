import { Suspense, type JSX } from "react";
import { useRoutes } from "react-router-dom";
import { Providers } from "@base/spa-shell/providers";

import { routes } from "./routes";

function Routed(): JSX.Element | null {
  return useRoutes(routes);
}

export function App(): JSX.Element {
  return (
    <Providers appName="base-app">
      {/* Every route is lazy, so the boundary is required, not optional. */}
      <Suspense fallback={null}>
        <Routed />
      </Suspense>
    </Providers>
  );
}
