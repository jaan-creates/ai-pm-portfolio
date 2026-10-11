"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, LogOut, Search, Settings2, Sparkles, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type AiMetadata = {
  preview_image_url?: string;
  preview_description?: string;
  suggested_tags?: string[];
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
  status: string;
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
  if (typeof candidate === "string" && /^https?:\/\//i.test(candidate)) return candidate;
  const source = item.original_url ?? item.canonical_url;
  if (!source) return null;
  try {
    const url = new URL(source);
    const isYouTube = url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com") || url.hostname === "youtu.be";
    const videoId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") ?? url.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1];
    return isYouTube && videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

export function PersonalLibrary() {
  const supabase = createSupabaseBrowserClient();
  const [items, setItems] = useState<Item[]>([]);
  const [profileEmail, setProfileEmail] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<"all" | "active" | "completed" | "reference">("all");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const loadItems = useCallback(async () => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const [{ data, error: loadError }, { data: userData }] = await Promise.all([
      supabase.from("items").select("id,title,user_note,original_url,canonical_url,source_domain,content_type,intent,capture_quality,processing_status,status,saved_at,topics,ai_metadata").is("deleted_at", null).order("saved_at", { ascending: false }),
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
    return items.filter((item) => {
      const matchesStatus = viewFilter === "all" || (viewFilter === "active" ? item.status === "pending" : item.status === viewFilter);
      const matchesQuery = !value || [
        item.title,
        item.user_note,
        item.source_domain,
        item.original_url,
        item.content_type,
        item.intent,
        ...(item.topics ?? []),
      ].some((field) => field?.toLowerCase().includes(value));
      return matchesStatus && matchesQuery;
    });
  }, [items, query, viewFilter]);

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
  }

  async function updateItemStatus(itemId: string, status: "pending" | "completed" | "reference") {
    if (!supabase) return;
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setError("Your session expired. Please sign in again.");
      return;
    }
    const response = await fetch(`/v1/items/${itemId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) setError("That lifecycle update could not be saved.");
    else await loadItems();
  }

  async function deleteItem(itemId: string) {
    if (!window.confirm("Remove this save from your library?")) return;
    await updateItemStatus(itemId, "deleted" as never);
  }


  return (
    <main className="personal-library">
      <header className="personal-header">
        <div>
          <div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={17} /></span><span>Save Here</span></div>
          <p className="library-count">{items.length} saved {items.length === 1 ? "item" : "items"}</p>
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
            <div className="profile-identity"><span className="profile-avatar profile-avatar-large">{initials(profileEmail)}</span><div><strong>{profileEmail || "Account"}</strong></div></div>
            <div className="profile-row"><Settings2 size={16} /><span>Settings</span><em>Coming soon</em></div>
            <div className="profile-row"><Download size={16} /><span>Export library</span><em>Coming soon</em></div>
            <button className="profile-signout" onClick={signOut}><LogOut size={16} /> Sign out securely</button>
          </aside>
        </>
      )}

      <div className="personal-toolbar">
        <label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by what you remember…" aria-label="Search your saved items" /></label>
      </div>
      <div className="view-filters" aria-label="Library views">
        {(["all", "active", "completed", "reference"] as const).map((filter) => <button key={filter} className={viewFilter === filter ? "view-filter active" : "view-filter"} onClick={() => setViewFilter(filter)}>{filter === "all" ? "Everything" : displayLabel(filter)}</button>)}
      </div>

      {error && <p className="auth-message" role="alert">{error}</p>}
      {busy && <div className="library-loading">Loading your saves…</div>}
      {!busy && !error && filtered.length === 0 && <div className="library-empty"><Sparkles size={24} /><h2>{items.length ? "Nothing matches that memory yet." : "Your first save is waiting."}</h2><p>Use the iPhone Share Sheet Shortcut, then return here to find it.</p></div>}

      <div className="personal-grid">
        {filtered.map((item) => {
          const url = item.original_url ?? item.canonical_url;
          const previewUrl = previewFrom(item);
          const hasTitle = Boolean(item.title?.trim());
          const topics = [...(item.topics ?? []), ...(item.ai_metadata?.suggested_tags ?? [])].filter((topic, index, all) => topic && all.indexOf(topic) === index).slice(0, 5);
          const previewDescription = typeof item.ai_metadata?.preview_description === "string" ? item.ai_metadata.preview_description.trim() : "";
          return (
            <article className="media-card" key={item.id} role={url ? "link" : undefined} tabIndex={url ? 0 : undefined} onClick={(event) => { if ((event.target as HTMLElement).closest("button,a")) return; if (url) window.open(url, "_blank", "noopener,noreferrer"); }} onKeyDown={(event) => { if (event.key === "Enter" && url) window.open(url, "_blank", "noopener,noreferrer"); }}>
              <div className={previewUrl ? "media-card-visual has-preview" : "media-card-visual visual-fallback"} style={previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined}>
                {!previewUrl && <><Sparkles size={26} /><span>Preview unavailable</span><small>Original source preserved</small></>}
              </div>
              <div className="media-card-copy">
                {hasTitle && <h2 title={item.title ?? undefined}>{item.title}</h2>}
                {previewDescription && <p className="metadata-summary">{previewDescription}</p>}
                {item.user_note && <><span className="card-context-label">Your context</span><p className="personal-note">{item.user_note}</p></>}
                {topics.length > 0 && <div className="suggested-tags" aria-label="Suggested tags">{topics.map((topic) => <span className="suggested-tag" key={topic}>{topic}</span>)}</div>}
                <div className="lifecycle-actions" aria-label="Save actions"><button onClick={() => setSelectedItem(item)} aria-label="View save details">Details</button><button onClick={() => void updateItemStatus(item.id, "completed")} aria-label="Mark as done">Done</button><button onClick={() => void updateItemStatus(item.id, "reference")} aria-label="Keep as reference">Reference</button><button onClick={() => void deleteItem(item.id)} aria-label="Remove save">Remove</button></div>
              </div>
            </article>
          );
        })}
      </div>

      {selectedItem && (
        <div className="detail-backdrop" role="presentation" onClick={() => setSelectedItem(null)}>
          <section className="detail-panel" role="dialog" aria-modal="true" aria-label="Save details" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button detail-close" onClick={() => setSelectedItem(null)} aria-label="Close details"><X size={17} /></button>
            <p className="kicker">Saved detail</p>
            <h2>{selectedItem.title || "Untitled save"}</h2>
            <p className="detail-source">{selectedItem.source_domain || displayLabel(selectedItem.content_type)} · {displayLabel(selectedItem.status)}</p>
            {selectedItem.user_note && <div className="detail-section"><span className="card-context-label">Your context</span><p>{selectedItem.user_note}</p></div>}
            {typeof selectedItem.ai_metadata?.preview_description === "string" && <div className="detail-section"><span className="detail-label">Extracted description</span><p>{selectedItem.ai_metadata.preview_description}</p></div>}
            {selectedItem.intent !== "unknown" && <div className="detail-section detail-facts"><span>Intent: {displayLabel(selectedItem.intent)}</span></div>}
            {(() => { const detailUrl = selectedItem.original_url ?? selectedItem.canonical_url; return detailUrl ? <a className="detail-open" href={detailUrl} target="_blank" rel="noreferrer">Open original source <ExternalLink size={14} /></a> : null; })()}
          </section>
        </div>
      )}
    </main>
  );
}
