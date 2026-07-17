"use client";

import type { ReactNode, JSX } from "react";
import { ThemeProvider, createTheme } from "@12-apps/ui/mui/styles";
import { CssBaseline } from "@12-apps/ui/mui/CssBaseline";

// A downstream consumer owns its theme; the shared components render against it.
const theme = createTheme();

/**
 * Wraps the app in an MUI theme + baseline using the primitives re-exported by
 * `@12-apps/ui`, proving a standalone consumer can drive styling from the
 * published package.
 */
export function Providers({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
