import type { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { Can } from "@12-apps/rbac/react";
import { Box } from "@12-apps/ui/mui/Box";
import { Stack } from "@12-apps/ui/mui/Stack";
import { Heading } from "@12-apps/ui/typography/Heading";
import { Text } from "@12-apps/ui/typography/Text";
import { healthQuery, features, type Health } from "@base/spa-shell";

/**
 * The platform console: the surface that can reach across tenants.
 *
 * It gates on a PLATFORM permission (`platform.tenants.read`) rather than a
 * tenant one, which is the whole distinction between this app and `admin`.
 * `@12-apps/rbac` already models the difference — its decisions carry a scope,
 * tenant id or `GLOBAL` — but nothing resolves an actor into either yet
 * (12-13), so this denies exactly like admin does.
 *
 * Two things that belong here and do not exist:
 *
 * - **Impersonation** (12-24) — "act as" a tenant user. The banner and the exit
 *   control are this app's; the write guard and the audit pair (the real human
 *   AND the rendered subject, recorded separately) live on the API side. Getting
 *   it wrong is a security incident rather than a bug, which is the argument for
 *   one audited implementation instead of one per app.
 * - **Tenant administration** — list, suspend, plan changes. Those arrive with
 *   entitlements (12-19).
 */
export default function Platform(): JSX.Element {
  const { data } = useQuery<Health>(healthQuery);

  return (
    <Box component="main" sx={{ minHeight: "100vh", p: 4 }}>
      <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto" }}>
        <Heading level="h1">Super admin</Heading>
        <Text>
          The platform console. Gates here are scoped to the platform, not to a
          tenant.
        </Text>

        {features.rbac ? (
          <Can
            permission="platform.tenants.read"
            fallback={
              <Text>
                Gated on <code>platform.tenants.read</code>. You hold no
                permissions — nothing resolves an actor&apos;s set yet (12-13).
              </Text>
            }
          >
            <Text>The tenant list would render here.</Text>
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
