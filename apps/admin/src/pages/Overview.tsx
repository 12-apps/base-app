import type { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { Can } from "@12-apps/rbac/react";
import { Box } from "@12-apps/ui/mui/Box";
import { Stack } from "@12-apps/ui/mui/Stack";
import { Heading } from "@12-apps/ui/typography/Heading";
import { Text } from "@12-apps/ui/typography/Text";
import { healthQuery, features, type Health } from "@base/spa-shell";

/**
 * The backoffice landing screen, and the repo's worked example of a gated one.
 *
 * Two things are on display, and the second is the point:
 *
 * 1. A permission-gated section (`<Can permission="tenant.settings.read">`).
 * 2. What it renders when nothing has resolved a permission set — the `fallback`
 *    branch. Today that is ALWAYS the branch you get, because the server half
 *    that computes an actor's permissions does not exist yet (12-13). Every
 *    admin screen added before then should look like this: gated, denying, and
 *    honest about why.
 *
 * When the flag is off there is no `RbacProvider` at all, and `<Can>` would
 * throw rather than deny — so the gate is only rendered when RBAC is on. That
 * asymmetry is a property of the package (its hook requires a provider), not a
 * style choice.
 */
export default function Overview(): JSX.Element {
  const { data } = useQuery<Health>(healthQuery);

  return (
    <Box component="main" sx={{ minHeight: "100vh", p: 4 }}>
      <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto" }}>
        <Heading level="h1">Admin</Heading>
        <Text>
          The tenant backoffice. Every screen here belongs behind a permission.
        </Text>

        {features.rbac ? (
          <Can
            permission="tenant.settings.read"
            fallback={
              <Text>
                This section is gated on <code>tenant.settings.read</code> and you
                hold no permissions — nothing resolves an actor&apos;s set yet
                (12-13), so the deny branch is the only one reachable.
              </Text>
            }
          >
            <Text>Tenant settings would render here.</Text>
          </Can>
        ) : (
          <Text>
            RBAC is off. Set <code>VITE_FEATURE_RBAC=1</code> to mount the
            permission context and see the gate deny.
          </Text>
        )}

        <Text>
          {data
            ? `API ${data.status} (${data.env}) — enabled: ${
                data.features.length > 0 ? data.features.join(", ") : "none"
              }`
            : "Asking the API how it is…"}
        </Text>
      </Stack>
    </Box>
  );
}
