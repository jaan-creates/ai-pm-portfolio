"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { LibraryShell } from "@/components/library-shell";
import type { Session } from "@supabase/supabase-js";

export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setBusy(false); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  async function sendLink(event: FormEvent) {
    event.preventDefault(); setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : "Check your email for the secure sign-in link.");
  }

  if (busy) return <main className="auth-screen"><section className="auth-card"><div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={18} /></span><span>Save Here</span></div><p className="auth-lede">Loading your private library…</p></section></main>;
  if (!session) return <main className="auth-screen"><section className="auth-card"><div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={18} /></span><span>Save Here</span></div><p className="kicker">Private library</p><h1>Your saves belong to you.</h1><p className="auth-lede">A calm, private home for the things you want to remember. Sign in securely to continue.</p><form onSubmit={sendLink}><label htmlFor="owner-email">Email address</label><input id="owner-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /><button className="capture-button" type="submit"><LockKeyhole size={17} /> Email me a sign-in link</button></form>{message && <p className="auth-message" role="status">{message}</p>}<p className="auth-footnote">The link works once and expires shortly. Your saved content stays in your private Supabase account.</p></section></main>;
  return <LibraryShell />;
}
