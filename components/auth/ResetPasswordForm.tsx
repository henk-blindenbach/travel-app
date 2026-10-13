"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createRecoveryClient } from "../../lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof createRecoveryClient> | null>(null);

  useEffect(() => {
    const client = createRecoveryClient();
    setSupabase(client);
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setHasRecoverySession(true);
    });
    client.auth.getSession().then(({ data, error }) => {
      setHasRecoverySession((current) => current || Boolean(data.session) && !error);
      setIsChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("De wachtwoorden zijn niet hetzelfde.");
      return;
    }
    setMessage("Opslaan…");
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.assign("/app/today");
  }

  if (isChecking) return <p className="setup-message">Herstel-link controleren…</p>;
  if (!hasRecoverySession) return <p className="setup-message">Deze herstel-link is verlopen of ongeldig. <Link href="/login">Vraag een nieuwe link aan.</Link></p>;

  return <form className="login-form" onSubmit={submit}>
    <label htmlFor="new-password">Nieuw wachtwoord</label>
    <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
    <label htmlFor="confirm-password">Herhaal wachtwoord</label>
    <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
    <button className="primary-button blue-button" type="submit">Wachtwoord opslaan</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
