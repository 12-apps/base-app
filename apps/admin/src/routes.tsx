import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

/**
 * Admin routes, code-split from the start.
 *
 * A real backoffice grows a sidebar and a nav manifest; where a new page goes
 * and which gates it passes (permission, plan feature, role) is the kind of
 * decision that needs writing down before the second page exists — future-pay's
 * `docs/ADMIN-NAV.md` is the version of that to port (12-39).
 */
const Overview = lazy(() => import("./pages/Overview"));

export const routes: RouteObject[] = [{ path: "/", element: <Overview /> }];
