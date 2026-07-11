"use client";
import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_ID = "cf-turnstile-script";

/** Cloudflare Turnstile widget. Calls onVerify with the token (or "" on error).
 *  When no site key is configured it renders nothing and passes "skip". */
export default function Turnstile({ onVerify }: { onVerify: (token: string) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const cb = useRef(onVerify);
  cb.current = onVerify;

  useEffect(() => {
    if (!SITE_KEY) {
      cb.current("skip");
      return;
    }
    let cancelled = false;

    const render = () => {
      if (cancelled || !boxRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => cb.current(token),
        "error-callback": () => cb.current(""),
        "expired-callback": () => cb.current(""),
      });
    };

    if (window.turnstile) {
      render();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const poll = setInterval(() => {
        if (window.turnstile) {
          clearInterval(poll);
          render();
        }
      }, 200);
      return () => clearInterval(poll);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
        widgetId.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={boxRef} style={{ marginTop: 10 }} />;
}
