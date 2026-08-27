// Post-build step for the static (GitHub Pages) bundle.
//
// GitHub Pages serves plain files with two quirks we must paper over:
//   1. Unknown paths fall back to `404.html`, which is how SPA routing
//      survives a hard reload on /scan or /history.
//   2. Jekyll ignores files starting with `_` unless a `.nojekyll` marker
//      exists — Vite's assets live under `assets/…` but the SPA shell is
//      `_shell.html`, so the marker is mandatory.
import { copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".output", "public");
const shell = path.join(outDir, "_shell.html");

await copyFile(shell, path.join(outDir, "404.html"));
await writeFile(path.join(outDir, ".nojekyll"), "");
console.log(
  "[static-postbuild] wrote 404.html and .nojekyll to .output/public",
);
