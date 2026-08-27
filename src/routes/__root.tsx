import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { BASE_PATH } from "@/lib/env";
import { getGateStatus } from "@/lib/gate";
import appCss from "../styles.css?url";

const APP_NAME = "RedTeamForge";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const gate = await getGateStatus();
    if (gate.enabled && !gate.unlocked && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }
    if (gate.enabled && gate.unlocked && location.pathname === "/login") {
      throw redirect({ to: "/" });
    }
    return { gate };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Open-source AI red-teaming lab for prompt injection, jailbreaks, and OWASP LLM Top 10.",
      },
      { name: "theme-color", content: "#0a0a0a" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: `${BASE_PATH}favicon.svg` },
      { rel: "stylesheet", href: appCss },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: `${BASE_PATH}fonts/ibm-plex-mono-400-latin.woff2`,
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: `${BASE_PATH}fonts/archivo-black-400-latin.woff2`,
        crossOrigin: "anonymous",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const { gate } = Route.useRouteContext();
  return (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <TooltipProvider delayDuration={250}>
          <AppShell gated={gate.enabled}>
            <Outlet />
          </AppShell>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 0,
                color: "var(--color-fg)",
                fontFamily:
                  "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
              },
            }}
          />
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
