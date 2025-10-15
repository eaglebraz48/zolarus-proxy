"use client";

import { useMemo, useState } from "react";

type Item = {
  asin?: string;
  title: string;
  price?: number;
  image?: string;
  url?: string;
};

const DEFAULT_ENDPOINT =
  process.env.NEXT_PUBLIC_SEARCH_ENDPOINT ||
  "https://arison8-ai.netlify.app/.netlify/functions/amazon-search";

export default function TestPage() {
  const [q, setQ] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => DEFAULT_ENDPOINT, []);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setItems([]);

    try {
      const params = new URLSearchParams({
        q: q.trim(),
        ...(min && { min }),
        ...(max && { max }),
      });

      const res = await fetch(`${endpoint}?${params.toString()}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const list: Item[] = Array.isArray(data) ? data : data.items ?? [];
      setItems(list);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Zolarus</h1>
        <p className="text-sm text-gray-500">
          AI-powered Amazon discovery assistant
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[360px,1fr]">
        {/* Search card */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Try a search</h2>
          <form onSubmit={onSearch} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Keywords
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g., headphones, smart watch, camera"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Min Price (optional)
                </label>
                <input
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                  type="number"
                  min={0}
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="Any"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Max Price (optional)
                </label>
                <input
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                  type="number"
                  min={0}
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  placeholder="Any"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-full bg-violet-600 px-5 py-2 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {loading ? "Searching…" : "Search"}
            </button>

            <p className="text-xs text-gray-500">
              Backend endpoint: <code className="font-mono">{endpoint}</code>
            </p>
          </form>
        </section>

        {/* Results */}
        <section>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Results</h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading && (
              <p className="text-gray-500 italic">Searching...</p>
            )}

            {!loading && !error && items.length === 0 && (
              <p className="text-sm text-gray-500">No results yet.</p>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it, idx) => (
                  <a
                    key={it.asin ?? idx}
                    href={it.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-xl border p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-gray-50">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt={it.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-gray-300">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                        {it.title}
                      </h3>
                      {typeof it.price !== "undefined" && (
                        <p className="text-sm text-violet-700 font-semibold">
                          ${it.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-10 border-t pt-6 text-xs text-gray-500">
        © {new Date().getFullYear()} Arison8 • Powered by AI Agents
      </footer>
    </div>
  );
}
