"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("De wachtwoorden zijn niet hetzelfde.");
      return;
    }
    setMessage("Opslaan…");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.assign("/app/today");
  }

  return <form className="login-form" onSubmit={submit}>
    <label htmlFor="new-password">Nieuw wachtwoord</label>
    <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
    <label htmlFor="confirm-password">Herhaal wachtwoord</label>
    <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
    <button className="primary-button blue-button" type="submit">Wachtwoord opslaan</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
