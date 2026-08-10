"use client";

import type { JSX } from "react";
import { Box } from "@12-apps/ui/mui/Box";
import { Stack } from "@12-apps/ui/mui/Stack";
import { Heading } from "@12-apps/ui/typography/Heading";
import { Text } from "@12-apps/ui/typography/Text";

/**
 * Smoke page: renders primitives and components sourced entirely from the
 * published `@12-apps/ui` package. If this builds and renders, a standalone
 * consumer can install and use the shared library.
 *
 * The `"use client"` is load-bearing, and it is a workaround. 47 of the 51
 * `@12-apps/ui` components that call MUI's `styled` carry no `"use client"`
 * directive of their own — `Heading` and `Text` among them. MUI marks
 * `@mui/material/styles/styled.js` as client-only, so a SERVER component that
 * imports one of them evaluates a client export in the server layer and the
 * build dies with "Attempted to call the default export of …/styled.js from the
 * server". That is what broke this repo's build on `main`.
 *
 * Marking the page a client component puts the whole tree on the right side of
 * the boundary. The real fix is in the package — every component that touches
 * `styled` needs the directive (12-28) — and once it lands this line can go.
 */
export default function Home(): JSX.Element {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 640, textAlign: "center" }}>
        <Heading level="h1">base-app</Heading>
        <Text>
          A scaffold consumer of the shared <code>@12-apps</code> packages. This
          heading, text, and layout all come from <code>@12-apps/ui</code>.
        </Text>
      </Stack>
    </Box>
  );
}
