import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

/**
 * Every route is code-split behind a dynamic `import()`.
 *
 * That is the default rather than an optimization applied later: retrofitting
 * lazy routes means revisiting every screen, while starting lazy costs nothing.
 *
 * One consequence to know before the e2e suite exists — a lazy route's module
 * is transformed the first time a browser navigates to it, so under e2e that
 * compile lands inside whichever spec reaches the route first. The spec that
 * pays it differs per run, which reads as flakiness in a different file every
 * time. future-pay warms route modules at dev-server start for exactly this
 * reason; adopt that setting with the suite, not before.
 */
const Home = lazy(() => import("./pages/Home"));

export const routes: RouteObject[] = [{ path: "/", element: <Home /> }];
