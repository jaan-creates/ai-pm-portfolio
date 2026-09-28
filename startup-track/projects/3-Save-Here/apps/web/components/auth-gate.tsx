"use client";

import { FormEvent, useEffect, useState } from "react";
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

  if (busy) return <main className="auth-screen"><p>Loading your private library…</p></main>;
  if (!session) return <main className="auth-screen"><section className="auth-card"><p className="kicker">Save Here · Private library</p><h1>Your saves belong to you.</h1><p>Sign in with a one-time email link to view your saved items.</p><form onSubmit={sendLink}><label htmlFor="owner-email">Email address</label><input id="owner-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><button className="capture-button" type="submit">Email me a sign-in link</button></form>{message && <p role="status">{message}</p>}</section></main>;
  return <LibraryShell />;
}
