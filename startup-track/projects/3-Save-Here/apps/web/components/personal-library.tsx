"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, LogOut, RefreshCw, Search, Settings2, Sparkles, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type AiMetadata = {
  preview_image_url?: string;
  thumbnail_url?: string;
  image_url?: string;
  [key: string]: unknown;
};

type Item = {
  id: string;
  title: string | null;
  user_note: string | null;
  original_url: string | null;
  canonical_url: string | null;
  source_domain: string | null;
  content_type: string;
  intent: string;
  capture_quality: string;
  processing_status: string;
  saved_at: string;
  topics: string[] | null;
  ai_metadata: AiMetadata | null;
};

function displayLabel(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Saved link";
}

function initials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase() || "ME";
}

function previewFrom(item: Item) {
  const metadata = item.ai_metadata;
  const candidate = metadata?.preview_image_url ?? metadata?.thumbnail_url ?? metadata?.image_url;
  if (typeof candidate !== "string" || !/^https?:\/\//i.test(candidate)) return null;
  return candidate;
}

export function PersonalLibrary() {
  const supabase = createSupabaseBrowserClient();
  const [items, setItems] = useState<Item[]>([]);
  const [profileEmail, setProfileEmail] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const [{ data, error: loadError }, { data: userData }] = await Promise.all([
      supabase.from("items").select("id,title,user_note,original_url,canonical_url,source_domain,content_type,intent,capture_quality,processing_status,saved_at,topics,ai_metadata").is("deleted_at", null).order("saved_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setProfileEmail(userData.user?.email ?? "");
    if (loadError) setError("Your library could not be loaded yet.");
    else setItems((data ?? []) as Item[]);
    setBusy(false);
  }, [supabase]);

  // The initial fetch synchronizes this client with Supabase after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadItems(); }, [loadItems]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) => [
      item.title,
      item.user_note,
      item.source_domain,
      item.original_url,
      item.content_type,
      item.intent,
      ...(item.topics ?? []),
    ].some((field) => field?.toLowerCase().includes(value)));
  }, [items, query]);

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
  }

  return (
    <main className="personal-library">
      <header className="personal-header">
        <div>
          <div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={17} /></span><span>Save Here</span></div>
          <p className="kicker">Your private library</p>
          <h1>Everything worth remembering.</h1>
          <p className="library-subtitle">{items.length} saved {items.length === 1 ? "item" : "items"} · your context stays separate from extracted details</p>
        </div>
        <div className="personal-header-actions">
          <button className="profile-avatar" onClick={() => setProfileOpen((open) => !open)} aria-label="Open your profile" aria-expanded={profileOpen}>{initials(profileEmail)}</button>
          <button className="signout-button" onClick={signOut}><LogOut size={16} /> Sign out</button>
        </div>
      </header>

      {profileOpen && (
        <>
          <button className="profile-backdrop" aria-label="Close profile" onClick={() => setProfileOpen(false)} />
          <aside className="profile-panel" aria-label="Your profile">
            <div className="profile-panel-heading"><div><p className="kicker">Account</p><h2>Your profile</h2></div><button className="icon-button" onClick={() => setProfileOpen(false)} aria-label="Close profile"><X size={17} /></button></div>
            <div className="profile-identity"><span className="profile-avatar profile-avatar-large">{initials(profileEmail)}</span><div><strong>{profileEmail || "Private owner"}</strong><span>Private owner account</span></div></div>
            <div className="profile-row"><Settings2 size={16} /><span>Settings</span><em>Coming soon</em></div>
            <div className="profile-row"><Download size={16} /><span>Export library</span><em>Coming soon</em></div>
            <button className="profile-signout" onClick={signOut}><LogOut size={16} /> Sign out securely</button>
          </aside>
        </>
      )}

      <div className="personal-toolbar">
        <label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by what you remember…" aria-label="Search your saved items" /></label>
        <button className="refresh-button" onClick={() => void loadItems()} disabled={busy}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <p className="auth-message" role="alert">{error}</p>}
      {busy && <div className="library-loading">Loading your saves…</div>}
      {!busy && !error && filtered.length === 0 && <div className="library-empty"><Sparkles size={24} /><h2>{items.length ? "Nothing matches that memory yet." : "Your first save is waiting."}</h2><p>Use the iPhone Share Sheet Shortcut, then return here to find it.</p></div>}

      <div className="personal-grid">
        {filtered.map((item) => {
          const url = item.original_url ?? item.canonical_url;
          const previewUrl = previewFrom(item);
          const hasTitle = Boolean(item.title?.trim());
          const source = item.source_domain ?? displayLabel(item.content_type);
          const topics = (item.topics ?? []).filter(Boolean).slice(0, 4);
          return (
            <article className="media-card" key={item.id}>
              <div className={previewUrl ? "media-card-visual has-preview" : "media-card-visual visual-fallback"} style={previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined}>
                {!previewUrl && <><Sparkles size={26} /><span>Preview unavailable</span><small>Original source preserved</small></>}
                <span className="visual-source">{source}</span>
              </div>
              <div className="media-card-copy">
                <div className="personal-card-top"><span>{displayLabel(item.content_type)}</span><span className={"quality " + (item.capture_quality === "link_only" ? "partial" : "ready")}>{item.capture_quality === "link_only" ? "Link only" : displayLabel(item.processing_status)}</span></div>
                {hasTitle && <h2>{item.title}</h2>}
                {item.user_note && <><span className="card-context-label">Your context</span><p className="personal-note">{item.user_note}</p></>}
                {topics.length > 0 && <div className="suggested-tags" aria-label="Suggested tags">{topics.map((topic) => <span className="suggested-tag" key={topic}>{topic}</span>)}</div>}
                <div className="personal-card-foot"><span>{new Date(item.saved_at).toLocaleDateString()}</span>{url && <a href={url} target="_blank" rel="noreferrer">Open source <ExternalLink size={14} /></a>}</div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
