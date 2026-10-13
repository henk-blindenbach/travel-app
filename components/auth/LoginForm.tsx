"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Versturen…");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    setMessage(error ? error.message : "Controleer je e-mail voor de inloglink.");
  }
  return <form className="login-form" onSubmit={submit}><label htmlFor="email">E-mailadres</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="jij@voorbeeld.nl"/><button className="primary-button blue-button" type="submit">Stuur inloglink</button>{message && <p role="status">{message}</p>}</form>;
}
