import Link from "next/link";

export function PublicHeader() {
  return <header className="public-header"><Link className="wordmark" href="/">Op reis</Link><nav><a href="#verhalen">Verhalen</a><a href="#route">Route</a><a href="#over-ons">Over ons</a></nav><Link className="header-link" href="/app/today">Mijn reis</Link></header>;
}
