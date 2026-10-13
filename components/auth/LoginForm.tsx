"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"sign-in" | "reset">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(mode === "sign-in" ? "Inloggen…" : "Versturen…");
    const supabase = createClient();

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      setMessage(error ? error.message : "Controleer je e-mail om een nieuw wachtwoord te kiezen.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage("E-mailadres of wachtwoord klopt niet.");
      return;
    }
    window.location.assign(next);
  }

  return <form className="login-form" onSubmit={submit}>
    <label htmlFor="email">E-mailadres</label>
    <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="jij@voorbeeld.nl" />
    {mode === "sign-in" && <><label htmlFor="password">Wachtwoord</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></>}
    <button className="primary-button blue-button" type="submit">{mode === "sign-in" ? "Inloggen" : "Stuur resetlink"}</button>
    <button className="text-button" type="button" onClick={() => { setMode(mode === "sign-in" ? "reset" : "sign-in"); setMessage(""); }}>{mode === "sign-in" ? "Wachtwoord vergeten?" : "Terug naar inloggen"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
