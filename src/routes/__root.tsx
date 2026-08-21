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
import { getGateStatus } from "@/lib/server/auth";
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
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
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
                background: "#171717",
                border: "1px solid rgb(234 234 234 / 14%)",
                borderRadius: 0,
                color: "#eaeaea",
                fontFamily: "IBM Plex Mono, ui-monospace, monospace",
              },
            }}
          />
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
