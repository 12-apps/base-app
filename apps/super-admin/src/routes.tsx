import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Platform = lazy(() => import("./pages/Platform"));

export const routes: RouteObject[] = [{ path: "/", element: <Platform /> }];
