"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, LogOut, RefreshCw, Search, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Item = { id: string; title: string | null; user_note: string | null; original_url: string | null; canonical_url: string | null; source_domain: string | null; content_type: string; intent: string; capture_quality: string; processing_status: string; saved_at: string };

export function PersonalLibrary() {
  const supabase = createSupabaseBrowserClient();
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadItems = useCallback(async () => { if (!supabase) return; setBusy(true); setError(null); const { data, error: loadError } = await supabase.from("items").select("id,title,user_note,original_url,canonical_url,source_domain,content_type,intent,capture_quality,processing_status,saved_at").is("deleted_at", null).order("saved_at", { ascending: false }); if (loadError) setError("Your library could not be loaded yet."); else setItems((data ?? []) as Item[]); setBusy(false); }
  }, [supabase]);
  // The initial fetch synchronizes this client with Supabase after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadItems(); }, [loadItems]);
  const filtered = useMemo(() => { const value = query.trim().toLowerCase(); if (!value) return items; return items.filter((item) => [item.title, item.user_note, item.source_domain, item.original_url, item.content_type, item.intent].some((field) => field?.toLowerCase().includes(value))); }, [items, query]);
  async function signOut() { if (supabase) await supabase.auth.signOut(); }
  return <main className="personal-library"><header className="personal-header"><div><div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={17} /></span><span>Save Here</span></div><p className="kicker">Your private library</p><h1>Everything worth remembering.</h1><p className="library-subtitle">{items.length} saved {items.length === 1 ? "item" : "items"} · notes and source context stay searchable</p></div><button className="signout-button" onClick={signOut}><LogOut size={16} /> Sign out</button></header><div className="personal-toolbar"><label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by what you remember…" aria-label="Search your saved items" /></label><button className="refresh-button" onClick={() => void loadItems()} disabled={busy}><RefreshCw size={16} /> Refresh</button></div>{error && <p className="auth-message" role="alert">{error}</p>}{busy && <div className="library-loading">Loading your saves…</div>}{!busy && !error && filtered.length === 0 && <div className="library-empty"><Sparkles size={24} /><h2>{items.length ? "Nothing matches that memory yet." : "Your first save is waiting."}</h2><p>Use the iPhone Share Sheet Shortcut, then return here to find it.</p></div>}<div className="personal-grid">{filtered.map((item) => { const url = item.original_url ?? item.canonical_url; return <article className="personal-card" key={item.id}><div className="personal-card-top"><span>{item.source_domain ?? item.content_type.replaceAll("_", " ")}</span><span className={"quality " + (item.capture_quality === "link_only" ? "partial" : "ready")}>{item.capture_quality === "link_only" ? "Link only" : item.processing_status}</span></div><h2>{item.title ?? item.user_note ?? "Saved item"}</h2>{item.user_note && item.title && <p className="personal-note">{item.user_note}</p>}<div className="personal-card-foot"><span>{new Date(item.saved_at).toLocaleDateString()}</span>{url && <a href={url} target="_blank" rel="noreferrer">Open source <ExternalLink size={14} /></a>}</div></article>; })}</div></main>;
}
