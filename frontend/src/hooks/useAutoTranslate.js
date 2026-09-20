import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { api } from "../lib/api";

// Module-level cache shared across all hook instances + persisted to
// localStorage, so re-visiting a page or switching languages back and forth
// doesn't re-request translations already fetched this session (the backend
// also caches by content hash, but this avoids the round-trip entirely).
const CACHE_KEY = "tazecode-translate-cache";
const memoryCache = new Map();
let persistedLoaded = false;

function loadPersisted() {
  if (persistedLoaded) return;
  persistedLoaded = true;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      Object.entries(obj).forEach(([k, v]) => memoryCache.set(k, v));
    }
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    const entries = [...memoryCache.entries()].slice(-400);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* ignore, e.g. storage full or unavailable */
  }
}

function collectStrings(value, out) {
  if (typeof value === "string") {
    if (value.trim()) out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectStrings(v, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectStrings(v, out));
  }
}

function mapStrings(value, dict) {
  if (typeof value === "string") {
    return value.trim() ? (dict.get(value) ?? value) : value;
  }
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, dict));
  if (value && typeof value === "object") {
    const out = {};
    for (const k in value) out[k] = mapStrings(value[k], dict);
    return out;
  }
  return value;
}

// Auto-translates every string found in `data` (any JSON-like shape — a
// single object, an array of objects, nested arrays of strings, etc.) to
// English whenever the active language is "en". Content authored in the
// dashboard is stored in Indonesian only; this fills the gap so nothing
// stays untranslated when a visitor switches languages.
export function useAutoTranslate(data) {
  const { lang } = useLanguage();
  const [translated, setTranslated] = useState(data);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    loadPersisted();
  }, []);

  const key = JSON.stringify(data);

  useEffect(() => {
    if (lang !== "en" || data == null) {
      setTranslated(data);
      return undefined;
    }

    const strings = [];
    collectStrings(data, strings);
    const unique = [...new Set(strings)];

    if (unique.length === 0) {
      setTranslated(data);
      return undefined;
    }

    const missing = unique.filter((s) => !memoryCache.has(s));

    if (missing.length === 0) {
      const dict = new Map(unique.map((s) => [s, memoryCache.get(s)]));
      setTranslated(mapStrings(data, dict));
      return undefined;
    }

    let cancelled = false;
    api
      .translateBatch(missing)
      .then((results) => {
        if (cancelled) return;
        missing.forEach((s, i) => memoryCache.set(s, results[i] ?? s));
        persist();
        const dict = new Map(unique.map((s) => [s, memoryCache.get(s) ?? s]));
        setTranslated(mapStrings(dataRef.current, dict));
      })
      .catch(() => {
        if (!cancelled) setTranslated(data);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, key]);

  return lang === "en" ? translated : data;
}

// Like useAutoTranslate, but only translates a whitelist of fields on each
// item (e.g. "description" but not "slug", "tech", or "live" URL) — use this
// for API records that mix free-text content with URLs/slugs/proper nouns
// that should never be run through the translator. Accepts a single object
// or an array of objects; returns the same shape back.
export function useAutoTranslateFields(data, fields) {
  const isArray = Array.isArray(data);
  const items = isArray ? data : (data ? [data] : []);
  const subset = items.map((item) => {
    const picked = {};
    fields.forEach((f) => {
      picked[f] = item?.[f];
    });
    return picked;
  });
  const translatedSubset = useAutoTranslate(subset);

  if (!data) return data;
  const merged = items.map((item, i) => ({ ...item, ...translatedSubset[i] }));
  return isArray ? merged : merged[0];
}
