import type { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box } from "@12-apps/ui/mui/Box";
import { Stack } from "@12-apps/ui/mui/Stack";
import { Heading } from "@12-apps/ui/typography/Heading";
import { Text } from "@12-apps/ui/typography/Text";
import { healthQuery, type Health } from "@base/spa-shell/api";

/**
 * The storefront's smoke page: components from `@12-apps/ui`, reading `/health`
 * through the same `/api`-relative path the browser uses in production.
 *
 * It shows the API's enabled subsystems rather than this bundle's own flags on
 * purpose — the server's answer is the authoritative one, and a page that
 * displayed the build-time flags would agree with itself while disagreeing with
 * the box it is talking to.
 */
export default function Home(): JSX.Element {
  const { data, isPending, isError } = useQuery<Health>(healthQuery);

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
          The customer-facing app. This heading, text and layout come from{" "}
          <code>@12-apps/ui</code>.
        </Text>
        <Text>
          {isPending
            ? "Asking the API how it is…"
            : isError
              ? "The API is not answering — is `pnpm dev` running?"
              : data.features.length > 0
                ? `API ${data.status} (${data.env}) — enabled: ${data.features.join(", ")}`
                : `API ${data.status} (${data.env}) — no subsystems enabled`}
        </Text>
      </Stack>
    </Box>
  );
}
