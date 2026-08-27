import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { BASE_PATH } from "@/lib/env";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    // Project Pages hosts under /redteamforge/, so strip the trailing
    // slash Vite adds to BASE_URL ("/" stays "/" for self-hosted builds).
    basepath: BASE_PATH.replace(/\/+$/, "") || "/",
  });
}
