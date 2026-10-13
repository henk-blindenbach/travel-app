import Link from "next/link";
import { AppShell } from "../../../../components/AppShell";
import { Icon } from "../../../../components/Icons";

export default function Interview() {
  return <AppShell active="today"><div className="interview-page"><Link className="back-link" href="/app/today">← Terug naar vandaag</Link><p className="eyebrow blue">Reisdag 5 · Annapurna trekking</p><h1>Vertel wat jullie vandaag hebben meegemaakt.</h1><p className="interview-intro">Ik ken jullie planning en gebruik die alleen als context. Begin gewoon waar je wilt — ik vraag door als iets nog onduidelijk is.</p><div className="chat"><div className="chat-bubble assistant"><Icon name="spark" size={16}/><p>Hoe was het moment waarop jullie bij Poon Hill aankwamen?</p></div><div className="chat-bubble user"><p>De zon kwam net boven de bergen uit. Het was koud, maar de stilte en het uitzicht maakten alles goed.</p></div></div><div className="chat-input"><span>Vertel verder…</span><button aria-label="Verstuur bericht"><Icon name="arrow" size={19}/></button></div><button className="finish-button">Dit was het voor vandaag</button></div></AppShell>;
}
