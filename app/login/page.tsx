import Link from "next/link";
import { LoginForm } from "../../components/auth/LoginForm";
import { hasSupabaseEnv } from "../../lib/supabase/server";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const destination = next?.startsWith("/app") ? next : "/app/today";
  return <main className="login-page"><Link className="wordmark dark" href="/">Op reis</Link><section><p className="eyebrow blue">Privé reisomgeving</p><h1>Welkom terug.</h1><p>Log in met je e-mailadres. We sturen een veilige link — geen wachtwoord nodig.</p>{error === "not-authorized" && <p className="setup-message">Dit account heeft nog geen toegang tot een reis.</p>}{hasSupabaseEnv() ? <LoginForm next={destination}/> : <p className="setup-message">Supabase is nog niet aan deze deployment gekoppeld.</p>}</section></main>;
}
