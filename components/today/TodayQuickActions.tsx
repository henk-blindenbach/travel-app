import Link from "next/link";

type Props = {
  documentsHref: string;
  journalHref: string;
  documentsLabel?: string;
  journalLabel?: string;
};

/** Primary Vandaag entry points: today’s documents + journal day editor. */
export function TodayQuickActions({
  documentsHref,
  journalHref,
  documentsLabel = "Documenten",
  journalLabel = "Dagverslag",
}: Props) {
  return (
    <nav className="today-quick-actions" aria-label="Vandaag snelkoppelingen">
      <Link className="primary-button blue-button today-quick-action" href={documentsHref}>
        {documentsLabel}
      </Link>
      <Link className="primary-button blue-button today-quick-action" href={journalHref}>
        {journalLabel}
      </Link>
    </nav>
  );
}
