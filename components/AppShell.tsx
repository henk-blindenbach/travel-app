import Link from "next/link";
import { Icon } from "./Icons";

const links = [
  ["today", "Vandaag", "✦"], ["trips", "Reis", "◫"], ["photos", "Foto's", "▧"], ["more", "Meer", "•••"]
] as const;

export function AppShell({ active, children }: { active: string; children: React.ReactNode }) {
  return <div className="app-frame"><aside className="desktop-sidebar"><Link href="/" className="wordmark dark">Op reis</Link><p className="sidebar-caption">Nepal · Tibet · Bhutan · India</p>{links.map(([href, label, icon]) => <Link key={href} className={active === href ? "side-link active" : "side-link"} href={`/app/${href}`}><span>{icon}</span>{label}</Link>)}<div className="sidebar-bottom"><span className="avatar">H</span><div><strong>Henk</strong><small>Eigenaar</small></div></div></aside><main className="app-content">{children}</main><nav className="mobile-nav">{links.map(([href, label, icon]) => <Link key={href} className={active === href ? "active" : ""} href={`/app/${href}`}><span>{icon}</span><small>{label}</small></Link>)}</nav></div>;
}
