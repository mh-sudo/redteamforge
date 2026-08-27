import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

// Localhost by default; containers/hosts set HOST=0.0.0.0 deliberately.
const host = process.env.HOST || "localhost";
const port = Number(process.env.PORT || 8080);

// VITE_RTF_STATIC=1 produces the browser-only build for GitHub Pages:
// an SPA shell with no server functions, AI calls going straight from the
// visitor's browser to their chosen provider, and asset URLs under the
// project-page base path.
const staticPages = process.env.VITE_RTF_STATIC === "1";

export default defineConfig(({ command, isPreview }) => ({
  base: staticPages ? "/redteamforge/" : "/",
  server: {
    host,
    port,
    strictPort: true,
  },
  preview: {
    host,
    port,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(staticPages ? { spa: { enabled: true } } : undefined),
    // Nitro powers the server functions in built output and preview; dev
    // uses TanStack Start's dev server, so the plugin chains differ by
    // design between `vite dev` and `vite build`.
    ...(command === "build" || isPreview ? [nitro()] : []),
    viteReact(),
  ],
}));
