"use client";

import { useState } from "react";
import { Cloud, LogIn, LogOut, RefreshCw } from "lucide-react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export default function CloudRecords({ client, user, consent, onConsent, status, onSync, locked }: {
  client: SupabaseClient | null; user: User | null; consent: boolean; onConsent: (value: boolean) => void;
  status: string; onSync: () => void; locked: boolean;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function signIn(event: React.FormEvent) {
    event.preventDefault(); if (!client || sending) return;
    setSending(true); setMessage("");
    const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? "Sign-in email could not be sent. Check the address or try again later." : "Check your inbox for the sign-in link. Keep it private.");
    setSending(false);
  }
  return <section className="cloud-records"><div className="cloud-heading"><Cloud size={19}/><h2>Cloud records</h2><span>{client ? "Supabase" : "Not configured"}</span></div>
    {!client ? <p>Local records remain available for export.</p> : user ? <><div className="cloud-account"><span>Signed in</span><button className="text-button" disabled={locked} onClick={() => { onConsent(false); void client.auth.signOut(); }}><LogOut size={14}/>Sign out</button></div><label className="consent-label"><input type="checkbox" checked={consent} disabled={locked} onChange={e => onConsent(e.target.checked)}/><span>I agree to store this session's participant code, SQL attempts, assistance use, and timing in the project database for capstone evaluation. Do not enter private data.</span></label><div className="cloud-actions"><span role="status">{status || (consent ? "Cloud saving enabled" : "Local records only")}</span><button className="text-button" disabled={locked || !consent} onClick={onSync}><RefreshCw size={14}/>Sync this session</button></div></> : <form onSubmit={signIn}><label htmlFor="cloud-email">Email</label><div className="cloud-signin"><input id="cloud-email" type="email" value={email} autoComplete="email" required onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/><button className="secondary-button" type="submit" disabled={sending || locked}><LogIn size={14}/>{sending ? "Sending" : "Send sign-in link"}</button></div><p role="status">{message || "Sign-in emails are used for account access, not included in study exports."}</p></form>}
  </section>;
}
