/**
 * Build-target flags.
 *
 * VITE_RTF_STATIC=1 produces the browser-only build for static hosting
 * (GitHub Pages): AI calls go straight from the browser to the chosen
 * provider with the user's own key, and the optional password gate is
 * compiled out (there is no server left to protect). The default build
 * keeps the full-stack TanStack Start behavior unchanged.
 */
export const IS_STATIC = import.meta.env.VITE_RTF_STATIC === "1";

/** Deployment base path ("/" locally, "/RedTeamForge/" on project Pages). */
export const BASE_PATH = import.meta.env.BASE_URL;
