"use client";

import { Lang } from "./dict";

const isLang = (v: any): v is Lang =>
  v === "en" || v === "pt" || v === "es" || v === "fr";

function getCookie(name: string) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
}

export function appendLangParam(href: string, lang: Lang) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

import { useEffect, useState } from "react";

export function useLang() {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let picked: Lang = "en";
    const url = new URL(window.location.href);
    const q = url.searchParams.get("lang") as Lang | null;
    const saved =
      (getCookie("zola_lang") as Lang | null) ||
      (localStorage.getItem("zola_lang") as Lang | null);
    if (isLang(q)) picked = q!;
    else if (isLang(saved)) picked = saved!;
    setCookie("zola_lang", picked);
    localStorage.setItem("zola_lang", picked);
    setLangState(picked);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    setCookie("zola_lang", l);
    localStorage.setItem("zola_lang", l);
  };

  const withLang = (href: string) => appendLangParam(href, lang);

  return { lang, setLang, withLang };
}

export function LangSync() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("lang") as Lang | null;
    const saved =
      (getCookie("zola_lang") as Lang | null) ||
      (localStorage.getItem("zola_lang") as Lang | null);
    const pick: Lang = isLang(q) ? q! : isLang(saved) ? saved! : "en";
    setCookie("zola_lang", pick);
    localStorage.setItem("zola_lang", pick);
  }, []);
  return null;
}
