"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type Lang = "en" | "pt" | "es" | "fr";

/** The languages your app supports (value + localized label) */
export const LANG_OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];

/** LocalStorage key used across the app */
const LS_KEY = "zola_lang";

/** Read a safe initial language */
function readInitialLang(searchParams: URLSearchParams | null): Lang {
  const fromQuery = (searchParams?.get("lang") || "").toLowerCase();
  if (["en", "pt", "es", "fr"].includes(fromQuery)) return fromQuery as Lang;

  if (typeof window !== "undefined") {
    const fromLS = (localStorage.getItem(LS_KEY) || "").toLowerCase();
    if (["en", "pt", "es", "fr"].includes(fromLS)) return fromLS as Lang;
  }
  return "en";
}

/** Broadcast a language change so any page widget can react */
export function broadcastLang(lang: Lang) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<Lang>("zola:lang", { detail: lang }));
  }
}

type Props = {
  className?: string;
  /** Optional: show a small label to the left */
  withLabel?: boolean;
};

export default function GlobalLanguageSelect({ className, withLabel = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<Lang>(() => readInitialLang(searchParams));

  // Keep URL/search params object memoized so we can rebuild it on change
  const baseParams = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString());
    // normalize any junk
    if (sp.get("lang")) sp.set("lang", readInitialLang(sp).toString());
    return sp;
  }, [searchParams]);

  // Sync WHEN the query string changes elsewhere (e.g., navigation)
  useEffect(() => {
    const next = readInitialLang(searchParams);
    if (next !== lang) setLang(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Also respond to cross-tab/cross-component changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue) {
        const next = e.newValue as Lang;
        if (["en", "pt", "es", "fr"].includes(next) && next !== lang) {
          setLang(next);
          updateUrl(next, false);
        }
      }
    };
    const onBroadcast = (e: Event) => {
      const ce = e as CustomEvent<Lang>;
      if (ce.detail && ce.detail !== lang) {
        setLang(ce.detail);
        updateUrl(ce.detail, false);
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("zola:lang", onBroadcast);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("zola:lang", onBroadcast);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function updateUrl(next: Lang, pushHistory = false) {
    const sp = new URLSearchParams(baseParams.toString());
    sp.set("lang", next);
    const href = `${pathname}?${sp.toString()}`;
    // Avoid scroll jumps
    if (pushHistory) router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Lang;
    setLang(next);
    try {
      localStorage.setItem(LS_KEY, next);
    } catch (_) {}
    broadcastLang(next);
    updateUrl(next, false);
  }

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {withLabel && (
        <span className="text-sm text-gray-600">
          {lang === "en" && "Language"}
          {lang === "pt" && "Idioma"}
          {lang === "es" && "Idioma"}
          {lang === "fr" && "Langue"}
        </span>
      )}
      <select
        aria-label="Language"
        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        value={lang}
        onChange={handleChange}
      >
        {LANG_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
