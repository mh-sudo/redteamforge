import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { IS_STATIC } from "@/lib/env";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "redteamforge-byok-notice-dismissed";

function isDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage unavailable — show nothing rather than nag on every load.
    return true;
  }
}

/**
 * Slim privacy banner shown only in the static (GitHub Pages) build,
 * where AI calls leave the browser directly for the user's provider.
 * Dismissal persists locally.
 */
export function ByokNotice() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(isDismissed());
  }, []);

  if (!IS_STATIC || hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* non-persistent dismissal is fine */
    }
  }

  return (
    <div
      role="note"
      aria-label="Privacy notice"
      className="border-b border-border border-l-2 border-l-accent bg-surface"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pr-2 pl-4 md:pr-3 md:pl-8">
        <p className="py-2 font-mono text-xs leading-relaxed text-muted">
          <span className="font-medium tracking-[0.14em] text-fg uppercase">
            Local-first&nbsp;·&nbsp;
          </span>
          This hosted copy runs entirely in your browser. API keys stay in local
          storage and are sent only to the provider you connect.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss privacy notice"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center text-subtle",
            "transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg",
          )}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
