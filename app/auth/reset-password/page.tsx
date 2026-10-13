import Link from "next/link";
import { ResetPasswordForm } from "../../../components/auth/ResetPasswordForm";

export default function ResetPassword() {
  return <main className="login-page"><Link className="wordmark dark" href="/">Op reis</Link><section><p className="eyebrow blue">Nieuw wachtwoord</p><h1>Kies een wachtwoord.</h1><p>Gebruik een wachtwoord dat je wachtwoordmanager kan onthouden.</p><ResetPasswordForm /></section></main>;
}
