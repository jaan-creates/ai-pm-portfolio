"use client";

import Image from "next/image";
import {
  Archive,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  Library,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type LibraryItem = {
  id: string;
  eyebrow: string;
  title: string;
  note?: string;
  image?: string;
  tone: "sage" | "gold" | "ink" | "berry";
  status: "ready" | "partial";
};

const items: LibraryItem[] = [
  {
    id: "desk",
    eyebrow: "Product · Buy",
    title: "The standing desk with the beautifully quiet motor",
    note: "For the home office refresh",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    tone: "sage",
    status: "ready",
  },
  {
    id: "pasta",
    eyebrow: "Recipe · Cook",
    title: "Weeknight tomato pasta that uses one pan",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80",
    tone: "gold",
    status: "ready",
  },
  {
    id: "reel",
    eyebrow: "Instagram Reel · Watch",
    title: "Shoulder mobility sequence for desk-heavy days",
    note: "Add a screenshot or recording to preserve more context",
    tone: "berry",
    status: "partial",
  },
  {
    id: "essay",
    eyebrow: "Article · Read",
    title: "How to keep a personal library useful instead of merely large",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
    tone: "ink",
    status: "ready",
  },
];

const nav = [
  { label: "Everything", icon: Library },
  { label: "Top of Mind", icon: Heart },
  { label: "Weekly Review", icon: Compass, badge: "4" },
  { label: "Completed", icon: Check },
  { label: "Archive", icon: Archive },
];

export function LibraryShell() {
  const [query, setQuery] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureValue, setCaptureValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      [item.title, item.eyebrow, item.note].some((field) => field?.toLowerCase().includes(value)),
    );
  }, [query]);

  async function submitCapture(event: FormEvent) {
    event.preventDefault();
    if (!captureValue.trim()) return;
    const isUrl = /^https?:\/\//i.test(captureValue.trim());

    try {
      const response = await fetch("/v1/captures", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer local-preview-token",
        },
        body: JSON.stringify({
          capture_id: crypto.randomUUID(),
          input_type: isUrl ? "url" : "text",
          shared_url: isUrl ? captureValue.trim() : null,
          shared_text: isUrl ? null : captureValue.trim(),
          user_note: null,
          device: { id: crypto.randomUUID(), shortcut_version: "web-preview" },
        }),
      });

      if (!response.ok) {
        setNotice("The interface is ready. Connect Supabase and a capture token to store real saves.");
        return;
      }
      setNotice("Saved safely. Understanding will continue in the background.");
      setCaptureValue("");
      setCaptureOpen(false);
    } catch {
      setNotice("Could not reach the capture service. Your input remains here so you can retry.");
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>Save & Recall</span>
          <button className="mobile-close icon-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <button className="capture-button" onClick={() => setCaptureOpen(true)}>
          <Plus size={18} /> Save something
        </button>

        <nav aria-label="Library">
          {nav.map(({ label, icon: Icon, badge }, index) => (
            <button className={`nav-item ${index === 0 ? "active" : ""}`} key={label}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="quiet-card">
            <Clock3 size={17} />
            <div>
              <strong>Review this week</strong>
              <span>4 saves worth another look</span>
            </div>
            <ChevronRight size={17} />
          </div>
          <p>Private library · Pilot</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-button icon-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
            <Menu size={21} />
          </button>
          <label className="search-box">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Describe what you remember…"
              aria-label="Search saved items"
            />
            <kbd>⌘ K</kbd>
          </label>
          <button className="avatar" aria-label="Account settings">SM</button>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <p className="kicker">Your private library</p>
              <h1>Everything worth remembering.</h1>
            </div>
            <div className="heading-actions">
              <button className="secondary-button"><Bookmark size={17} /> Newest</button>
              <button className="icon-button"><MoreHorizontal size={20} /></button>
            </div>
          </div>

          {notice && (
            <div className="notice" role="status">
              <Sparkles size={17} />
              <span>{notice}</span>
              <button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={16} /></button>
            </div>
          )}

          <div className="library-grid">
            {filtered.map((item) => (
              <article className={`memory-card tone-${item.tone}`} key={item.id}>
                {item.image && (
                  <div className="card-image">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 700px) 100vw, 33vw"
                      loading={item.id === "desk" ? "eager" : "lazy"}
                    />
                  </div>
                )}
                {!item.image && (
                  <div className="abstract-card" aria-hidden="true">
                    <span className="orbit orbit-one" />
                    <span className="orbit orbit-two" />
                    <Sparkles size={30} />
                  </div>
                )}
                <div className="card-copy">
                  <div className="card-meta">
                    <span>{item.eyebrow}</span>
                    <span className={`quality ${item.status}`}>{item.status === "ready" ? "Ready" : "Link only"}</span>
                  </div>
                  <h2>{item.title}</h2>
                  {item.note && <p>{item.note}</p>}
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={25} />
              <h2>No exact words needed.</h2>
              <p>Try the purpose, object, creator, source, or approximate time you remember.</p>
            </div>
          )}
        </section>
      </main>

      {captureOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCaptureOpen(false)}>
          <section className="capture-modal" role="dialog" aria-modal="true" aria-labelledby="capture-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close icon-button" onClick={() => setCaptureOpen(false)} aria-label="Close">
              <X size={19} />
            </button>
            <span className="modal-icon"><Plus size={22} /></span>
            <p className="kicker">Quick capture</p>
            <h2 id="capture-title">Save it now. Understand it later.</h2>
            <p>Paste a link or a short thought. Organizing is never required.</p>
            <form onSubmit={submitCapture}>
              <textarea
                autoFocus
                value={captureValue}
                onChange={(event) => setCaptureValue(event.target.value)}
                placeholder="https://… or anything worth remembering"
                rows={4}
              />
              <button className="capture-button modal-submit" type="submit" disabled={!captureValue.trim()}>
                <Sparkles size={18} /> Save safely
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
