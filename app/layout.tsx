import type { Metadata } from "next";
import type { ReactNode, JSX } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "base-app",
  description: "Scaffold consumer of the @12-apps shared packages",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
