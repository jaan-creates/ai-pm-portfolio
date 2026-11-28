"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, Sparkles } from "lucide-react";
import { configureSupabaseBrowserClient, createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PersonalLibrary } from "@/components/personal-library";
import type { Session } from "@supabase/supabase-js";

function GoogleMark() {\n  return <svg className="google-button-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.7-.06-1.38-.18-2.03H12v3.84h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.88-1.73 2.99-4.28 2.99-7.34Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.22-2.51c-.9.6-2.04.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.06v2.59A9.98 9.98 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.89A6 6 0 0 1 6.07 12c0-.66.11-1.3.32-1.89V7.52H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.48l3.33-2.59Z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 2.91 14.7 2 12 2a9.98 9.98 0 0 0-8.94 5.52l3.33 2.59C7.18 7.74 9.39 5.98 12 5.98Z"/></svg>;\n}\n\nexport function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [supabase, setSupabase] = useState(() => createSupabaseBrowserClient());

  useEffect(() => {
    if (supabase) return;
    let active = true;
    void fetch("/api/auth/config", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("config unavailable")))
      .then((config: { url: string; anonKey: string }) => {
        if (!active) return;
        const client = configureSupabaseBrowserClient(config.url, config.anonKey);
        if (client) setSupabase(client);
        else setConfigError(true);
      })
      .catch(() => { if (active) setConfigError(true); });
    return () => { active = false; };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setBusy(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signInWithGoogle() {
    setMessage(null);
    if (!supabase) {
      setMessage("Google sign-in is temporarily unavailable. Use email sign-in instead.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin, queryParams: { prompt: "select_account" } },
    });
    if (error) {\n      const providerDisabled = error.code === "validation_failed" || error.message.toLowerCase().includes("provider is not enabled");\n      setMessage(providerDisabled ? "Google sign-in is not enabled yet. Use email sign-in, or enable Google in Supabase Auth → Providers." : "Google sign-in could not start. Use email sign-in instead.");\n    }
  }

  async function sendLink(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!supabase) {
      setMessage("Email sign-in is temporarily unavailable. Please try again shortly.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setMessage(error ? error.message : "Check your email for the secure sign-in link.");
  }

  if (configError && !supabase) {
    return <main className="auth-screen"><section className="auth-card"><p className="auth-message" role="alert">Sign-in configuration is unavailable.</p></section></main>;
  }
  if (busy || !supabase) {
    return <main className="auth-screen"><section className="auth-card"><div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={18} /></span><span>Save Here</span></div><p className="auth-lede">Preparing your private sign-in…</p></section></main>;
  }
  if (!session) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={18} /></span><span>Save Here</span></div>
          <p className="kicker">Private library</p>
          <h1>Your saves belong to you.</h1>
          <p className="auth-lede">Sign in with Google for a faster return, or use a one-time email link.</p>
          <button className="google-button" type="button" onClick={signInWithGoogle}><GoogleMark /> <span>Continue with Google</span></button>
          <div className="auth-divider" aria-hidden="true"><span>or use email</span></div>
          <form onSubmit={sendLink}>
            <label htmlFor="owner-email">Email address</label>
            <input id="owner-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
            <button className="capture-button" type="submit"><LockKeyhole size={17} /> Email me a sign-in link</button>
          </form>
          {message && <p className="auth-message" role="status">{message}</p>}
        </section>
      </main>
    );
  }
  return <PersonalLibrary />;
}
