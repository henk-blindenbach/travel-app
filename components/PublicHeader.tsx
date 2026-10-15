import Link from "next/link";

export function PublicHeader() {
  return <header className="public-header"><Link className="wordmark" href="/">Op reis</Link><nav><Link href="/reizen">Verhalen</Link><Link href="/reizen">Reizen</Link><Link href="/over-ons">Over ons</Link></nav><Link className="header-link" href="/app/today">Mijn reis</Link></header>;
}
