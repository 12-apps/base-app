import type { JSX } from "react";
import { Box } from "@12-apps/ui/mui/Box";
import { Stack } from "@12-apps/ui/mui/Stack";
import { Heading } from "@12-apps/ui/typography/Heading";
import { Text } from "@12-apps/ui/typography/Text";

/**
 * Smoke page: renders primitives and components sourced entirely from the
 * published `@12-apps/ui` package. If this builds and renders, a standalone
 * consumer can install and use the shared library.
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
