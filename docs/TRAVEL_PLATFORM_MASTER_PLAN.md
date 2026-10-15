# Travel Platform - Master Plan

## Afgerond — betrouwbare eerste reis aanmaken

- Het aanmaken van een eerste reis vraagt niet langer om een terugleesquery vóór het eigenaar-lidmaatschap bestaat; dit voorkomt een RLS-fout bij een lege database.
- De API maakt vooraf een reis-ID aan, creëert vervolgens reis, eigenaarlidmaatschap en reisdagen, en ruimt de reis op als een vervolgstap faalt.
- Foutmeldingen maken voortaan onderscheid tussen opslaan, koppelen aan het account en aanmaken van reisdagen.

## Afgerond — toegang zonder bestaande reis

- Een geldig ingelogd account kan altijd de privéomgeving openen, ook als er nog geen reizen of lidmaatschappen bestaan.
- De lege startpagina leidt rechtstreeks naar het aanmaken van de eerste reis; afzonderlijke reisdata blijft via het bestaande lidmaatschap beschermd.

## Afgerond — privé-notities per reisdag

- Iedere reisdag heeft nu een eigen veld voor privé-dagnotities, los van de notities op een vlucht, verblijf, vervoer of activiteit.
- Dagnotities verschijnen uitsluitend in de afgesloten planner en worden niet opgenomen in de publieke reisweergave.

## Afgerond — planningsonderdelen bewerken en documenteren

- Een gevuld planningstegeltje opent nu een bewerkpaneel met type, status, titel, plaats en een veld voor bijzonderheden/notities.
- Vanuit datzelfde paneel kan een document worden geüpload. Het documenttype wordt automatisch afgeleid van het onderdeel en het bestand wordt privé aan zowel de reisdag als het specifieke planningsonderdeel gekoppeld.

## Afgerond — detail bij de geselecteerde reisdag

- Het detailpaneel voor een reisdag klapt nu meteen onder de aangeklikte dagrij open, in plaats van pas onderaan het volledige planningsoverzicht.
- De daggegevens, gekoppelde documenten en bewerkingsmogelijkheden blijven ongewijzigd.

**Status:** Living document / master plan  
**Eerste concrete reis:** Nepal - Tibet - Bhutan - India, 2026  
**Gebruikers:** Henk & Michel  
**Doel:** Een herbruikbaar persoonlijk reisplatform voor plannen, beleven, publiceren en bewaren van reizen.

---

## 1. Visie

We bouwen geen losse reisblog voor één reis, maar één persoonlijk reisplatform dat Henk en Michel voor toekomstige reizen opnieuw kunnen gebruiken.

Het platform heeft twee kanten:

1. **Publieke reissite** - mooi, eenvoudig en bedoeld voor vrienden/familie/volgers.
2. **Afgesloten reisomgeving** - voor planning, boekingen, documenten, dagverslagen, foto's, AI-interviews en beheer.

De levenscyclus van een reis wordt één geheel:

**Idee -> planning -> boekingen -> reis -> dagelijks dagboek -> publieke reis -> social media -> fotoboek/archief**

Belangrijk ontwerpprincipe: gegevens worden waar mogelijk maar één keer ingevoerd en daarna opnieuw gebruikt. Een hotel uit de planning kan bijvoorbeeld tijdens de reis automatisch context leveren voor het dagverslag en later in het fotoboek terechtkomen.

---

## 2. Kernprincipes

- Mobile first; tijdens een reis moet alles prettig op een iPhone werken.
- Geen laptop nodig tijdens de reis.
- Henk en Michel blijven eigenaar van inhoud, foto's en publicatie.
- AI automatiseert schrijven en structureren, maar de gebruiker kiest zelf de foto's.
- Geen afhankelijkheid van Polarsteps, Instagram of Facebook voor de kernfunctionaliteit.
- De eigen website is de **single source of truth** voor de reis.
- Social media zijn distributiekanalen.
- Reizen en content zijn herbruikbaar: geen hardcoded Nepal-website.
- Alle relevante reisdata worden gestructureerd opgeslagen met het oog op later hergebruik, zoeken, statistieken en fotoboeken.
- Eerst een betrouwbare MVP; daarna pas slimme automatisering.

---

## 3. Hoofdonderdelen

### 3.1 Publieke website

Publieke omgeving met alle reizen die expliciet gepubliceerd zijn.

Voorbeeldstructuur:

- Home / overzicht reizen
- Reisdetail
  - titel, periode, landen, coverfoto
  - kaart / route
  - korte introductie
  - chronologische tijdlijn
- Dagpost
  - datum / reisdag
  - locatie
  - titel
  - hero-foto
  - uitgebreid verhaal
  - fotogalerij
  - kaart / locatie indien gewenst
  - vorige / volgende dag
- Eventueel highlights / favoriete foto's

Privacy per reis en eventueel per dag moet instelbaar zijn: `private`, `unlisted`, `public`.

### 3.2 Afgesloten reisomgeving

Alleen voor Henk en Michel.

Hoofdsecties:

- Dashboard
- Reizen
- Planning
- Boekingen & vervoer
- Accommodaties
- Activiteiten
- Taken
- Documenten
- Dagboek / posts
- Foto's
- Publicatie
- Fotoboek / export
- Instellingen

---

## 4. Reisplanning - vervanging van Excel

**Productdoel:** dit onderdeel wordt niet alleen een digitale vervanging van Excel, maar moet uitgroeien tot een uitzonderlijk gebruiksvriendelijke reisplanner die Henk en Michel liever gebruiken dan losse spreadsheets, notities, boekingsmails en kaarten. De planner is daarom een volwaardig ontwerptraject binnen het project en wordt nog apart verder uitgewerkt.

Ontwerpprincipes voor dit traject:

- zo weinig mogelijk dubbele invoer;
- informatie moet vanuit meerdere natuurlijke invalshoeken terug te vinden zijn: dag, plaats, boeking, kaart, taak en document;
- plannen moet snel en licht aanvoelen, ook als een reis complex wordt;
- de actuele dag moet tijdens de reis direct alle praktische informatie tonen;
- desktop mag rijk en ruim zijn voor voorbereiding, mobiel moet extreem snel en duidelijk zijn onderweg;
- wijzigingen in planning moeten automatisch doorwerken naar relevante dagcontext, zonder bestaande reisdagboeken te overschrijven;
- planning is nooit hetzelfde als werkelijkheid: gepland en daadwerkelijk uitgevoerd blijven afzonderlijk herkenbaar.


De bestaande spreadsheet `Plan to Nepal - Bhutan NOV 2026.xlsx` is de eerste concrete use-case en later mogelijke importbron.

De spreadsheet bevat nu onder andere:

- dag-tot-dag planning;
- vluchten;
- hotels en reserveringsgegevens;
- excursies en bezienswaardigheden;
- transfers;
- wandelingen / trekking;
- to-do's;
- prijsvergelijkingen voor reiscomponenten;
- boekingscodes en praktische notities.

Deze informatie moet in de app niet in één groot tekstveld verdwijnen, maar zoveel mogelijk als gestructureerde objecten worden opgeslagen.

### 4.1 Trip

Voorbeelden van velden:

- naam
- slug
- startdatum / einddatum
- reizigers
- landen
- omschrijving
- coverfoto
- status: idea / planning / booked / travelling / completed / archived
- visibility

### 4.2 Trip days

Iedere kalenderdag krijgt een eigen record:

- datum
- reisdagnummer
- land
- regio / plaats
- geplande activiteiten
- werkelijk bezochte plaatsen
- accommodatie
- vervoer
- notities
- dagstatus

Planning en dagboek gebruiken dezelfde dag als basis. Daardoor weet de AI tijdens het interview bijvoorbeeld al dat voor die dag Punakha Dzong en de suspension bridge gepland stonden.

### 4.3 Accommodaties

- naam
- plaats / land
- check-in / check-out
- adres
- website
- boekingsplatform
- reserveringsnummer
- kamerinformatie
- kosten / valuta
- betaald / openstaand
- notities
- documenten

### 4.4 Vervoer

Generiek transportmodel met type:

- flight
- train
- bus
- transfer
- rental_car
- ferry
- other

Voor vluchten o.a.:

- airline
- vluchtnummer
- vertrek- en aankomstluchthaven
- lokale vertrek-/aankomsttijd
- boekingscode / PNR
- ticketnummer
- stoel
- bagage
- status / notities

### 4.5 Activiteiten

- titel
- type
- plaats
- datum / tijd
- duur
- reservering nodig ja/nee
- aanbieder
- kosten
- status: idea / planned / booked / done / skipped
- URL
- notities

### 4.6 Taken

Per reis:

- taak
- eigenaar: Henk / Michel / beide
- deadline
- status
- categorie
- gekoppeld aan activiteit/accommodatie/vervoer indien relevant

### 4.7 Documenten

Bijvoorbeeld:

- tickets
- boekingsbevestigingen
- visa / permits
- verzekeringsdocumenten
- vouchers
- PDF's

Gevoelige documenten zijn altijd privé en worden nooit via de publieke site ontsloten.

---

## 5. Dagelijkse reisworkflow

Dit is de kern tijdens de reis.

### Stap 1 - Reminder

Dagelijks krijgt Henk een reminder om de reisdag af te ronden.

Geen automatische publicatie zonder menselijke start: de reminder opent de dag in de app.

### Stap 2 - Foto's selecteren

Henk kiest zelf de foto's uit Apple Photos die voor de dag gebruikt moeten worden.

Reden:

- betere persoonlijke selectie;
- geen kostbare of ingewikkelde AI-selectie over tientallen foto's;
- geen brede toegang tot de volledige fotobibliotheek nodig;
- foto-upload en publicatie worden één handeling.

Richtlijn: circa 5-10 foto's per dag, maar geen harde limiet in het datamodel.

**Beslissing foto-selectie:** foto's worden tijdens de dagelijkse workflow één keer geselecteerd. Diezelfde selectie vormt de basis voor de dagpost, social-media handoff en de eerste fotoboekselectie. Er zijn geen aparte dagelijkse selecties voor website, social en fotoboek.

Alleen bewust geselecteerde foto's worden naar de travel-app geüpload; de app wordt geen tweede volledige iCloud/Apple Photos-bibliotheek. Apple Photos/iCloud blijft het volledige persoonlijke fotoarchief. Tijdens de latere fotoboekfase moet het eenvoudig mogelijk zijn om alsnog extra foto's uit Apple Photos aan een reisdag of boekselectie toe te voegen.

### Stap 3 - Interview

De app begint met een open vraag, bijvoorbeeld:

> Vertel wat jullie vandaag hebben meegemaakt.

Invoer bij voorkeur via spraak of tekst.

AI krijgt als context:

- reis;
- datum / dagnummer;
- geplande route;
- accommodatie;
- activiteiten van die dag;
- relevante eerdere dagverhalen.

AI stelt alleen zinvolle vervolgvragen. Geen vaste vragenlijst als de informatie al uit het verhaal blijkt.

Voorbeelden:

- Wat was het hoogtepunt?
- Was iets anders dan verwacht?
- Wie hebben jullie ontmoet?
- Hoe voelde deze plek in vergelijking met gisteren?
- Is er iets grappigs of bijzonders dat je wilt onthouden?

Knop: **Dit was het voor vandaag**.

### Stap 4 - AI genereert content

AI maakt vanuit het interview en de bestaande reiscontext:

1. titel;
2. uitgebreid dagverhaal voor de website;
3. korte intro / excerpt;
4. Instagram-caption;
5. Facebook-caption;
6. Polarsteps-caption;
7. gestructureerde samenvatting / metadata van de dag.

De verschillende captions mogen inhoudelijk en qua lengte aangepast zijn aan het platform; ze hoeven niet identiek te zijn.

### Stap 5 - Preview

Voor publicatie ziet de gebruiker:

- titel;
- tekst;
- foto's en volgorde;
- locatie;
- eventuele kaart;
- social captions.

Acties:

- bewerken;
- AI opnieuw laten schrijven;
- aanvullende instructie geven;
- foto's herschikken;
- opslaan als draft;
- publiceren.

### Stap 6 - Publiceren

Na goedkeuring publiceert de app de dag op de publieke reissite.

### Stap 7 - Social handoff

Na publicatie verschijnt één duidelijk scherm:

**Dag gepubliceerd**

- Kopieer Instagram-caption
- Kopieer Facebook-caption
- Kopieer Polarsteps-caption
- Bekijk / download geselecteerde foto's
- Open Instagram
- Open Facebook
- Open Polarsteps

Doel: een social post moet na de AI-workflow met slechts enkele handelingen gepubliceerd kunnen worden.

---

## 6. Foto's

### 6.1 Origineel bewaren

De geselecteerde foto's worden in originele/hoge kwaliteit opgeslagen. Website-optimalisaties zijn afgeleide versies en vervangen nooit het bronbestand.

**Opslagarchitectuur (besloten):**

- originele geselecteerde foto's: **Scaleway Object Storage**, Standard Multi-AZ, regio Parijs;
- geoptimaliseerde webversies: **Supabase Storage** binnen het Free-project;
- fotometadata, volgorde, privacy/publicatie en fotoboekselecties: **Supabase Postgres**;
- Apple Photos/iCloud blijft het volledige persoonlijke fotoarchief;
- de publieke website serveert nooit de high-resolution originelen uit Scaleway;
- fotoboek/export gebruikt de hoogst beschikbare originelen uit Scaleway;
- de object-storagekoppeling wordt S3-compatible en provider-onafhankelijk ontworpen;
- originelen zijn privé en worden alleen via beveiligde server-side toegang of tijdelijke signed URLs ontsloten;
- uploads krijgen status/retry zodat slechte verbinding niet tot stil gegevensverlies leidt;
- verwijderen uit een dagpost/boekselectie en permanent verwijderen uit het reisarchief zijn verschillende acties.

Scaleway is gekozen boven een persoonlijke Cloud Drive omdat Object Storage bedoeld is als applicatiebackend en via de S3-standaard goed integreert met de travel-app.

Per foto bewaren we waar beschikbaar:

- originele bestandsnaam;
- opnamedatum/tijd;
- EXIF;
- GPS-locatie;
- breedte / hoogte;
- oriëntatie;
- trip;
- trip day;
- volgorde in dagpost;
- favoriet ja/nee;
- public ja/nee;
- fotoboek-selectie ja/nee;
- eventuele caption / omschrijving;
- fotograaf indien relevant.

### 6.2 Fotoboek-selectie tijdens de reis

Bij iedere foto kan direct of later worden aangegeven:

- `book_candidate`
- `book_favorite`
- `cover_candidate`

AI kan na de reis een eerste selectie voorstellen, maar de menselijke favorieten wegen zwaarder.

Dit voorkomt dat na een reis van vijf weken duizenden foto's opnieuw moeten worden doorgelopen.

---

## 7. Fotoboek als expliciet eindproduct

Het fotoboek is vanaf het begin onderdeel van het ontwerp en geen latere export-hack.

### Voor de bouw kiezen we een leverancier

**Gekozen leverancier voor v1: Prodigi.**

Prodigi wordt de eerste fotoboekprovider die we technisch integreren. Doorslaggevend zijn de beschikbare Print/Studio API, automatische/template-gebaseerde boekgeneratie, Europese productie-opties en de mogelijkheid om ook slechts één fysiek boek te bestellen.

Pixum blijft de kwaliteits-/gebruikservaringsreferentie vanuit eerdere fotoboeken van Henk. Peecho blijft een mogelijke fallback omdat het eveneens sterk gericht is op geautomatiseerde fotoboeken, maar we bouwen v1 niet parallel voor meerdere leveranciers.


Voor implementatie onderzoeken en kiezen we een fotoboekleverancier op basis van:

- beschikbare API of importformaat;
- ondersteuning voor automatische layouts;
- kwaliteit;
- levering in Portugal / Nederland;
- maximale pagina's;
- foto- en tekstmogelijkheden;
- prijs;
- mogelijkheid tot PDF-upload of professioneel print-ready formaat;
- kleurprofielen / bleed / resolutie-eisen.

**Leveranciersbeslissing voor v1 is genomen: Prodigi.** De interne boekdata en exportlaag blijven desondanks zo leverancier-onafhankelijk mogelijk, zodat later een andere printprovider kan worden toegevoegd zonder het fotoboekmodel opnieuw te ontwerpen.

Voor Prodigi onderzoeken/testen we specifiek de Studio API en Print API: boektemplates, foto's en teksten vullen, preview/print-ready output, ordercreatie, levering naar Portugal en orderstatus. De gebruiker moet vóór bestelling het gegenereerde boek kunnen controleren en waar nodig foto's, teksten en pagina-indeling aanpassen.

De eerste end-to-end test gebruikt bewust **één exemplaar**; bulkbestellingen of commercieel volume zijn geen vereiste voor dit persoonlijke platform.

### Data die we voor het boek bewaren

- trip metadata;
- dagtitels;
- dagverhalen;
- korte samenvattingen;
- locaties;
- route;
- geselecteerde foto's in hoge resolutie;
- foto-volgorde;
- favorieten;
- captions;
- highlights;
- eventueel quotes uit het dagelijkse interview die niet in de publieke tekst terechtkwamen.

### Na de reis

De app kan een eerste fotoboekconcept genereren:

- cover;
- intro;
- routekaart;
- hoofdstukken per land/regio;
- dagselecties;
- fotospreads;
- teksten;
- afsluitende reisstatistieken.

Gebruiker controleert en past aan voordat het naar de gekozen leverancier gaat.

---

## 8. Reisarchief en statistieken

Omdat gegevens gestructureerd worden opgeslagen, kan de site later tonen:

- aantal reizen;
- landen;
- plaatsen;
- reisdagen;
- kilometers indien beschikbaar;
- vluchten;
- wandelingen / trekkings;
- hoogste punt;
- aantal geselecteerde foto's;
- favoriete locaties;
- kaart met alle reizen.

Niet alles hoeft in MVP; het datamodel moet dit wel mogelijk maken.

---

## 9. Hergebruik voor toekomstige reizen

Niets wordt specifiek gebouwd voor Nepal/Tibet/Bhutan/India.

Een nieuwe reis moet ongeveer zo beginnen:

**Nieuwe reis** -> naam + periode + reizigers -> planning toevoegen/importeren -> boeken -> reizen -> dagboek -> publiceren -> archiveren/fotoboek.

Oude reizen blijven beschikbaar in het publieke en private archief volgens hun visibility-instellingen.

---

## 10. Rollen en toegang

Eerste versie:

- Henk - owner/editor
- Michel - owner/editor
- Public - alleen gepubliceerde publieke content

Later eventueel gasttoegang voor medereizigers.

Privédata en publieke content moeten technisch duidelijk gescheiden zijn via autorisatie/RLS, niet alleen via verborgen UI.

---

## 11. Voorgestelde technische architectuur

Aansluitend op bestaande ervaring:

- **Frontend:** Next.js
- **Hosting:** Vercel
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth
- **Webfoto/document storage:** Supabase Storage
- **Originele geselecteerde foto's:** Scaleway Object Storage, Standard Multi-AZ, regio Parijs (S3-compatible)
- **AI:** OpenAI API
- **PWA:** installable web app voor iPhone
- **Notifications:** nader kiezen; web push / e-mail / andere betrouwbare mobiele trigger

Geen n8n of Make in MVP tenzij later blijkt dat een externe workflow-engine daadwerkelijk voordeel biedt.

### Belangrijk

OpenAI API-verbruik staat los van een ChatGPT-abonnement. AI-aanroepen vanuit de app moeten daarom als apart, meetbaar verbruik worden behandeld.

---

## 12. Voorlopig datamodel

Minimaal verwachten we conceptueel:

- `users`
- `trips`
- `trip_members`
- `trip_days`
- `locations`
- `accommodations`
- `transport_segments`
- `activities`
- `trip_tasks`
- `trip_documents`
- `journal_entries`
- `journal_interview_messages`
- `photos`
- `journal_entry_photos`
- `social_captions`
- `book_projects`
- `book_selections`

Exact schema pas vastleggen nadat bestaande use-cases en de Excel-import zijn uitgewerkt.

---

## 13. Belangrijke UX-principes

### Tijdens planning

Desktop/tablet mag rijker zijn, omdat plannen vaak vooraf thuis gebeurt.

Gewenste views:

- kalender / timeline;
- lijst;
- dagdetail;
- vluchten/vervoer;
- accommodaties;
- kaart;
- taken;
- documenten.

Drag-and-drop mag waar nuttig, maar de data moet ook zonder drag-and-drop goed beheerbaar zijn.

### Tijdens de reis

Mobile first en zo weinig mogelijk stappen.

Ideale dagelijkse workflow:

1. reminder openen;
2. foto's selecteren;
3. vertellen;
4. eventuele AI-vervolgvraag beantwoorden;
5. preview;
6. publish;
7. social captions kopiëren en posten.

Doel: circa 5-10 minuten menselijke aandacht per dag.

---

## 14. Offline / slechte verbinding

Relevant voor trekking en afgelegen gebieden.

De app moet uiteindelijk rekening houden met:

- draft lokaal kunnen bewaren;
- upload hervatten;
- duidelijk tonen welke foto's nog niet geüpload zijn;
- interviewtekst niet verliezen bij netwerkproblemen;
- publicatie uitstellen totdat verbinding terug is.

Volledige offline-first architectuur is niet noodzakelijk voor MVP, maar gegevensverlies bij een slechte verbinding is onacceptabel.

---

## 15. AI-gedrag

AI is redacteur, geen bedenker van ervaringen.

Regels:

- Geen gebeurtenissen verzinnen.
- Planning is context, niet bewijs dat iets daadwerkelijk is gebeurd.
- Bij twijfel een vervolgvraag stellen.
- Persoonlijke details uit het interview behouden.
- Geen overdreven generieke reistaal.
- Schrijfstijl moet in de loop van de reis consistent blijven.
- Eerdere dagen mogen als context worden gebruikt voor continuïteit.
- Publieke tekst en privé-interviewdata zijn verschillende datasets.

We bewaren daarom bij voorkeur zowel:

- ruwe interviewinput;
- gestructureerde feiten;
- gegenereerde draft;
- definitief gepubliceerde versie.

---

## 16. Publicatie- en privacyworkflow

Status voor journal entries:

`empty -> interviewing -> draft -> ready -> published -> archived`

Publiceren is bewust een menselijke actie in MVP.

Later kan optioneel automatische publicatie worden toegevoegd.

Een wijziging na publicatie moet mogelijk zijn zonder dat de oorspronkelijke interviewdata verloren gaat.

---

## 17. MVP

### Fase 1 - Fundament

- auth Henk/Michel;
- trips aanmaken;
- trip days;
- eenvoudige planner;
- accommodaties;
- transport;
- activiteiten;
- taken;
- publieke reisoverzicht + dagpagina;
- responsive/PWA basis.

### Fase 2 - Daily Journal

- dagelijkse dagpagina in private omgeving;
- foto's uploaden;
- interview via tekst;
- AI-vervolgvragen;
- websiteverhaal genereren;
- social captions genereren;
- preview/edit/publish;
- social handoff.

### Fase 3 - Voice + reminders + resilience

- spraakinvoer;
- dagelijkse reminder;
- skip/snooze;
- gemiste dag alsnog invullen;
- betere afhandeling slechte verbinding/upload retries.

### Fase 4 - Fotoboek

- gekozen leverancier integreren/export ondersteunen;
- foto-favorieten;
- boekselecties;
- boekstructuur genereren;
- preview/export.

### Fase 5 - Slimmere planning

- Excel-import;
- documenten koppelen;
- kaartweergave;
- kosten/budget;
- boekingsstatus;
- planning vanuit bestaande reis kopiëren;
- eventueel e-mail/booking imports.

---

## 18. Eerste concrete migratie: Nepal - Tibet - Bhutan - India 2026

De huidige Excelplanning gebruiken we als testdataset.

Relevante elementen die al zichtbaar zijn:

- reisperiode eind oktober t/m begin december 2026;
- Nederland / India / Nepal / Tibet / Bhutan;
- Kathmandu, Lhasa, Pokhara, Annapurna Base Camp, Thimphu, Punakha, Paro, Haa Valley, Delhi/Agra;
- internationale en regionale vluchten;
- hotels en reserveringsgegevens;
- dagactiviteiten en hikes;
- trekkingdagen;
- prijsvergelijkingen voor Tibet/Bhutan;
- taken en research.

**Belangrijk:** de spreadsheet bevat ook boekingscodes/PINs. Die horen uitsluitend in de private omgeving en mogen nooit per ongeluk in publieke API-responses, pagina's, logs of metadata terechtkomen.

---

## 19. Open beslissingen / backlog voor productdesign

### Twee producttracks die nog expliciet uitgewerkt moeten worden

1. **Planning UX** - van de huidige Excel-aanpak naar een zeer gebruiksvriendelijke planner, inclusief dag-, kaart-, boekings-, taak- en documentweergaven, snelle invoer en mobiel gebruik onderweg.
2. **Fotoboek workflow** - keuze van leverancier, gewenste boekstructuur, selectie tijdens de reis, automatische conceptopmaak, handmatige correctie en betrouwbare export/bestelling. Pixum is hierbij de huidige referentie.


- Naam en domein van het platform.
- Eén gezamenlijke account of twee individuele accounts met trip membership? Voorkeur: individuele accounts.
- Prodigi is gekozen voor v1; definitieve productspecificatie (formaat, binding, papier en standaard aantal pagina's) nog bepalen.
- Exacte reminder-techniek op iPhone/PWA.
- Spraak direct opnemen in de app of OS-dictation als MVP?
- Kunnen geselecteerde social foto's via Web Share API direct naar apps worden gedeeld?
- Willen we kosten/budget volledig onderdeel maken van planning?
- Willen we reserveringsmails later automatisch kunnen importeren?
- Willen we GPX/Apple Health/wandeldata later koppelen voor route, afstand en hoogte?
- Meertalige publieke posts nodig of alleen één taal?
- Reacties/likes op de eigen reissite: waarschijnlijk niet nodig in MVP.

---

## 20. Ontwerpidee: één dag als centrale eenheid

Een belangrijk architectuurprincipe is dat `trip_day` de verbindende schakel wordt tussen planning en herinnering.

Voor vertrek bevat een dag:

**Plan** -> hotel + vervoer + activiteiten + notities.

Tijdens de reis:

**Experience** -> interview + werkelijk bezochte locaties + foto's.

Na verwerking:

**Story** -> websitepost + social captions + metadata.

Na de reis:

**Memory** -> fotoboekselectie + highlights + statistieken.

Daardoor bouwen we niet vier losse systemen, maar vier views op dezelfde reisdata.

---

## 21. Definition of success voor de eerste reis

Voor Nepal/Tibet/Bhutan/India is het project geslaagd als:

- Michel niet meer afhankelijk is van Excel om de actuele reisplanning te bekijken/beheren;
- Henk en Michel alle praktische informatie mobiel kunnen terugvinden;
- Henk dagelijks binnen circa 5-10 minuten een kwalitatief reisverslag kan maken;
- foto's maar één keer geselecteerd/geüpload hoeven te worden;
- de publieke website automatisch vanuit de goedgekeurde dagpost wordt bijgewerkt;
- captions voor Instagram, Facebook en Polarsteps direct klaarstaan;
- alle brondata en geselecteerde hoge-resolutiefoto's na de reis beschikbaar zijn;
- een fotoboek kan worden samengesteld zonder opnieuw vanaf nul door duizenden foto's en losse teksten te gaan;
- dezelfde applicatie daarna zonder codewijzigingen voor de volgende reis gebruikt kan worden.

---

## 22. Accounts en secrets

Accountnamen/login-identificaties van gebruikte diensten mogen in dit masterplan worden vastgelegd. Wachtwoorden, API keys, secret keys, access tokens en recovery codes worden **nooit** in GitHub of dit document opgeslagen.

- **Scaleway:** `henk@wyop.nl`
- **Supabase:** account/project aangemaakt; accountnaam/projectreferentie nog vast te leggen.
- Persoonlijke wachtwoorden worden beheerd in **Apple Wachtwoorden**.
- Applicatie-secrets worden via beveiligde environment variables / secret stores van de gebruikte hostingdiensten beheerd.

---

## 23. Werkafspraak voor dit document

Dit bestand is het **master plan**. Nieuwe productideeën, beslissingen en scopewijzigingen worden hier eerst verwerkt of vanuit hier naar concrete issues/specs verwezen. Vanaf dit punt geldt als werkafspraak dat elke inhoudelijke beslissing die Henk en ChatGPT samen nemen aan dit masterplan wordt toegevoegd, zodat het document de actuele productwaarheid blijft voor Henk, Michel, ChatGPT, Cursor en Codex.

Aanbevolen repositorystructuur:

```text
/docs/travel-platform/
  MASTER_PLAN.md
  DATA_MODEL.md
  MVP.md
  PHOTOBOOK.md
  AI_JOURNAL.md
```

`MASTER_PLAN.md` blijft het overzicht. Detaildocumenten ontstaan pas wanneer een onderdeel groot genoeg wordt.

## 24. Gebouwde basis — 13 oktober 2026

Dit overzicht beschrijft de werkelijk gebouwde basis. Alles buiten deze lijst blijft gepland of visueel gesimuleerd.

### Werkend

- Next.js-app op `opreis.blindenbach.nl`, gedeployed via Vercel vanuit `main`.
- Publieke, responsive home met reishero, verhaalkaarten en routevisualisatie.
- Private responsive app-shell: desktop-sidebar en mobiele navigatie voor Vandaag, Reis, Foto's en Meer.
- Vandaag-scherm met de eerste Nepal/Tibet/Bhutan/India-testreis en de eerste vijf geplande reisdagen uit Supabase.
- Visuele AI-interviewpagina als productprototype; nog zonder AI-koppeling.
- Supabase-fundament met `trips`, `trip_members` en `trip_days`, inclusief RLS. De testreis is publiek leesbaar; private app-toegang vereist een membership.
- Twee individuele gebruikersaccounts zijn gekoppeld aan de testreis. Nieuwe publieke signup staat uit.
- E-mail/wachtwoord-login met wachtwoordmanager-ondersteuning. De private `/app/*`-routes controleren zowel de sessie als membership.
- Wachtwoordherstelinterface en pagina om een nieuw wachtwoord te kiezen. Het huidige Free-project gebruikt hiervoor Supabase' standaard implicit recovery-link; de tijdelijke herstel-sessie wordt uitsluitend in de browser verwerkt. Een serververifieerbare `token_hash`-mailtemplate is voorbereid als latere optie met eigen SMTP.

### Bewust nog niet gebouwd

- Planner/Excel-import, boekingen, accommodaties, vervoer, taken en documenten.
- Echte AI-interviews, spraakinvoer, tekstgeneratie en social captions.
- Foto-upload, EXIF/GPS-verwerking, publicatieflow en publieke dagdetailpagina's uit echte content.
- Offline/PWA-resilience, reminders, Prodigi/fotoboek en automatische locatie-tracking.

### Omgevingsafspraak

- Er is één Supabase-project/database; geen aparte development- en productiondatabase.
- Productie heeft de benodigde Supabase-variabelen in Vercel. De lokale demo op `localhost` heeft die niet en kan daarom geen echte login afronden.
- Wachtwoorden, tokens, sleutels, boekingscodes en resetlinks staan nooit in Git of dit document.



## UX mockups — concept 13 oktober 2026

Er zijn twee visuele conceptboards gemaakt: (1) reisapp en fotoboek (mobiele journeys, reisoverzicht, dagoverzicht, route, foto's, fotoboekontwerp/preview/bestellen); (2) publieke desktopsite, mobiele flow 'nieuwe dag', admin mobile en admin desktop.

**Ontwerprichting:** warme, persoonlijke en fotografiegedreven reiservaring; geen generiek SaaS-dashboard. Publieke site: grote reishero, route en dagverhalen, foto's en kaarten. Beheer: duidelijke scheiding tussen reizen, dagen, foto's, routes, fotoboek en instellingen; mobiel voor snelle invoer, desktop voor volledig beheer.

**Nieuwe dag mobiel (conceptflow):** (1) datum/titel/land/locatie, (2) foto's één keer kiezen en uploaden, (3) route en hoogtepunten, (4) verhaal/AI-interview en tekstcontrole, (5) preview en expliciet publiceren of concept bewaren. Planning mag velden voorinvullen maar nooit als werkelijk meegemaakt presenteren. De schermen zijn visuele voorstellen, geen definitieve functionele goedkeuring.

**Status bestanden:** conceptafbeeldingen gegenereerd in ChatGPT. Binaire afbeeldingen konden in deze sessie nog niet naar GitHub worden geüpload via de beschikbare GitHub-koppeling; deze markdownbeschrijving is wel gecommit. Zodra bestand-upload mogelijk is, plaats de twee PNG's onder `docs/design/mockups/` en verwijs er vanuit dit document naar.


## Dag toevoegen: AI-first en locatiecontext (bespreekpunt, 13 oktober 2026)

De eerdere mockup met vijf handmatige invoerstappen is **niet** het gewenste primaire proces. Dagcreatie is AI-first: de gebruiker opent de dag, selecteert foto's, vertelt via een AI-interview wat er gebeurde, beantwoordt gerichte vervolgvragen, controleert het gegenereerde verhaal en publiceert expliciet. Datum, planning, verblijf, mogelijke route en locaties worden waar betrouwbaar mogelijk automatisch voorgevuld. Planning is nooit bewijs dat een activiteit werkelijk plaatsvond.

**Locatiebronnen voor MVP in volgorde:** (1) EXIF/GPS en opnametijd van geselecteerde foto's, (2) bestaande reisplanning en geboekte locaties als suggesties, (3) correcties/bevestigingen tijdens AI-interview. Automatische GPS-tracking is expliciet buiten de MVP geplaatst (nice-to-have). Bewaar herkomst en nauwkeurigheid per locatie; maak geen onbevestigde routefeiten. Publicatie van precieze locaties is afzonderlijk instelbaar.

**Scopebesluit 13 oktober 2026:** geen Capacitor/native iOS-wrapper en geen automatische achtergrondtracking in de eerste versie. We starten met Next.js/PWA en halen locaties primair uit de metadata van bewust geselecteerde foto's. Ontbrekende GPS-locaties kunnen via planning en AI-interview worden aangevuld of bevestigd. GPS uit foto's geeft bezochte fotolocaties, niet automatisch een volledige afgelegde route. Later eventueel GPX-import of native tracking als nice-to-have; nu niet bouwen.


## Domein en deployment — 13 oktober 2026

- Publieke domeinnaam voor de travel-app: `opreis.blindenbach.nl`.
- Het domein verwijst naar het nieuwe Vercel-project voor deze applicatie.
- De applicatie moet dezelfde codebase gebruiken voor publieke site en private beheeromgeving, met duidelijke route- en autorisatiescheiding.


## Appstructuur, navigatie en bouwfasering — 13 oktober 2026

### Publieke site

De publieke site op `opreis.blindenbach.nl` is fotografie- en verhaalgedreven, niet dashboard-achtig.

Hoofdnavigatie:
- **Home** — hero, actuele reis, recente dagverhalen, eerdere reizen;
- **Reizen** — overzicht van gepubliceerde reizen;
- **Reisdetail** — hero, intro, route/kaart en chronologische tijdlijn;
- **Dagverhaal** — datum, locatie, verhaal, foto's, kaart en vorige/volgende dag;
- **Kaart** — primair als view binnen een reis;
- **Over ons** — eenvoudige persoonlijke pagina.

Indicatieve routes: `/reizen/[trip-slug]` en `/reizen/[trip-slug]/dag/[day]`.

### Private mobiel

Mobiele hoofdnavigatie blijft klein: **Vandaag · Reis · Foto's · Meer**.

**Vandaag** is tijdens de reis het primaire scherm. Een geplande `trip_day` bestaat al vanuit de planning; de gebruiker hoeft normaal geen 'Nieuwe dag' aan te maken. Als een dag ontbreekt, kan deze bij het starten van het dagboek automatisch worden aangemaakt.

Het Vandaag-scherm combineert dagnummer/datum, huidige/planned context, gevonden fotolocaties, geselecteerde foto's, relevante planning en één prominente actie om het AI-interview te starten.

Het interview voelt als een gesprek, niet als een formulierwizard. Foto's kunnen vóór of tijdens/na het gesprek worden geselecteerd. Na **Dit was het voor vandaag** genereert AI het verhaal en de social content. Daarna volgt een preview die zoveel mogelijk overeenkomt met de publieke dagpagina, met acties voor bewerken, opnieuw schrijven, draft bewaren en expliciet publiceren.

### Private desktop

Desktop gebruikt een rustige sidebar:
- Vandaag
- Reizen
  - Overzicht
  - Planning
  - Dagboek
  - Foto's
  - Documenten
- Fotoboek
- Instellingen

Accommodaties, vluchten, transfers en activiteiten zijn onderdelen/views van de planner en worden niet ieder een los hoofdmenu-item.

### Bouwfasering

**Fase 0 — publieke placeholder / technische basis**
- Vercel-project en domein werkend;
- warme, persoonlijke tijdelijke landingspagina;
- basis Next.js-projectstructuur en metadata;
- geen onnodige database-, AI- of plannerlogica.

**Fase 1 — app shell en klikbare productbasis (eerste Codex-opdracht)**
- gedeelde visuele basis/design tokens;
- responsive publieke shell/header/footer;
- publieke Home;
- publiek Reisdetail;
- publiek Dagdetail;
- private/authenticated shell;
- mobiele navigatie Vandaag · Reis · Foto's · Meer;
- desktop sidebar volgens bovenstaande structuur;
- Vandaag-scherm met representatieve placeholder/testdata;
- lege/gesimuleerde AI-interviewweergave;
- previewweergave voor een dagpost;
- responsive gedrag op iPhone en desktop;
- nog **geen** echte OpenAI-integratie, uitgebreide planner, Prodigi-integratie of automatische GPS-tracking.

Doel van fase 1: zo snel mogelijk een echte klikbare applicatie op `opreis.blindenbach.nl` waarmee we informatiearchitectuur, navigatie en visuele richting kunnen beoordelen voordat complexe logica wordt toegevoegd.

**Fase 2 — Daily Journal end-to-end**
- Supabase Auth en relevante minimale tabellen/RLS;
- trip/trip_day data;
- geselecteerde foto's uploaden;
- EXIF/GPS/tijd uit geselecteerde foto's verwerken;
- AI-interview en vervolgvragen;
- verhaal + platform-specifieke captions genereren;
- draft/preview/edit/publish;
- publieke site uit gepubliceerde data voeden;
- social handoff.

**Parallel productdesign — Planner**
Tijdens fase 1 en 2 werken Henk en ChatGPT de planner apart uit op basis van de echte Nepal/Tibet/Bhutan/India-spreadsheet. De planner wordt niet voortijdig door Codex ingevuld als generiek CRUD-dashboard.

**Latere fasen**
- planner implementeren;
- reminders/voice/offline-resilience verdiepen;
- Prodigi-fotoboekworkflow;
- slimmere imports en automatisering;
- automatische achtergrondtracking alleen als nice-to-have.

### Mockups

De twee bestaande conceptboards zijn richtinggevend, niet pixel-perfect requirements. Met name de eerdere handmatige 'Nieuwe dag'-wizard is inhoudelijk vervangen door de AI-first interviewflow hierboven.

Beoogde repositorylocaties:
- `docs/design/mockups/travel-app-photobook-concept.png`
- `docs/design/mockups/public-admin-new-day-concept.png`

Codex mag de mockups gebruiken voor sfeer, hiërarchie, fotografiegebruik, kaarten en responsive richting, maar moet bij conflicten altijd dit masterplan volgen.

## Voortgang — dagelijks verslag en private foto's (13 oktober 2026)

### Installeerbare webapp (14 oktober 2026)

- De app heet op het beginscherm **Nós ✈️** en start na installatie rechtstreeks op **Vandaag**.
- Manifest, standalone-weergave, iPhone-touch-icon en openingskleur zijn toegevoegd. Offline gebruik en offline uploads zijn bewust nog niet gebouwd.
- Het persoonlijke reisicoon is bijgesneden zodat de witte buitenmarge niet meer op het beginscherm verschijnt.
- Het dagverslag en interview zijn mobiel hersteld: acties stapelen netjes op iPhone, het interview blijft bij de gekozen reisdag en spraakinvoer kan veilig stoppen of een begrijpelijke foutmelding tonen.
- Het interview toont de eerste en vervolgvragen zichtbaar, scrolt naar nieuwe antwoorden, heeft een veilige herstelactie bij een trage AI-reactie en kan op ieder moment via **Maak dagverslag** worden afgerond tot een bewerkbaar concept.
- De AI-aanroep is begrensd voor een snel mobiel gesprek en meldt sleutel-, limiet- en tijdelijke providerproblemen begrijpelijk, zonder gevoelige gegevens te tonen of te loggen.
- De verwerking accepteert zowel de samengevatte als de bericht-gebaseerde Responses-uitvoer van OpenAI en onderscheidt een leeg of onvolledig AI-antwoord veilig van overige storingen.
- Een afgerond interview maakt een bewerkbaar, publiceerbaar opgesteld dagverslag in de wij-vorm met kopjes en alinea's. Het eindscherm toont uitsluitend een duidelijke knop naar het concept; de content blijft privé tot een latere expliciete publicatie.
- Een extra interviewvraag kan het gesprek niet meer blokkeren. Na vijf antwoorden nodigt de interface uit om af te ronden, terwijl er ruimte blijft voor een aanvullende vraag.

### Bouwafspraak publicatieflow — vooraf vastgelegd, uitgevoerd op 14 oktober 2026

Deze bouwstap maakt de eerder gebouwde publicatiegegevens echt zichtbaar buiten de afgesloten omgeving. Vooraf vastgelegd:

- een gepubliceerde dag wordt altijd binnen de URL-reis gecontroleerd; een dagnummer van een andere reis kan dus nooit per ongeluk worden getoond. De reis zelf moet expliciet de bestaande zichtbaarheid `public` hebben voordat er een openbare daglink bestaat;
- alleen foto’s die Henk of Michel expliciet voor publicatie hebben aangevinkt, verschijnen op de publieke dagpagina;
- de private Supabase-fotobucket blijft privé. Een smalle, gecontroleerde route serveert uitsluitend de geselecteerde webversies van reeds gepubliceerde dagen;
- de publieke home toont uitsluitend werkelijk gepubliceerde dagen als er productiedata beschikbaar is; toekomstige planning en privé-inhoud blijven daar weg;
- na publicatie biedt de private editor een knop naar de publieke dag en duidelijke handoff-knoppen naar Instagram, Facebook en Polarsteps. Captions blijven kopieerbaar, want browsers kunnen die platforms niet betrouwbaar vooraf invullen.

Bewust buiten deze stap: direct posten via social-API’s, publieke reacties, een kaart/GPS op de dagpagina, offline sync en de planner.

### Afgerond

- Per reisdag is nu één bewerkbaar conceptverslag mogelijk: eigen titel, werkelijke locatie en vrije tekst.
- Het private scherm is bereikbaar vanuit **Vandaag** en werkt op mobiel en desktop.
- Foto-invoer accepteert HEIC/HEIF, JPEG, PNG en WebP tot 50 MB.
- Het HEIC-origineel gaat naar de private Scaleway-bucket `opreis-private-originals` in Parijs; het origineel wordt nooit via de app ontsloten.
- De server maakt voor ieder origineel een geroteerde, verkleinde WebP-versie (maximaal 2560 px) en bewaart die in de private Supabase-bucket `trip-web-images`.
- Een tijdelijke, ondertekende URL is de enige manier waarop de app een webversie kan tonen.
- De Supabase-tabellen `day_entries` en `media_assets`, inclusief RLS voor uitsluitend reisleden, staan in productie. De webafbeeldingsbucket is niet publiek.
- Scaleway-credentials bestaan alleen als Vercel Production Secrets; ze staan niet in Git.
- Bij het verwerken van een geselecteerde foto leest de server, waar aanwezig, de opnametijd en GPS-coördinaten uit EXIF. Die gegevens blijven privé bij het media-item; er is geen achtergrondtracking en er wordt niets gepubliceerd zonder latere expliciete publicatie.
- Bij elke geselecteerde foto kan een privé-bijschrift worden opgeslagen. Dit wordt later hergebruikt als context voor verhaal, publicatie en fotoboek, maar is nu nergens openbaar zichtbaar.
- De geselecteerde foto’s kunnen binnen één dag worden herschikt; die privé-volgorde wordt de basis voor de latere galerij en het fotoboek.
- Elk dagverslag heeft een expliciete publicatiestatus die standaard op `draft` staat.
- Het privé-daginterview werkt met korte AI-vervolgvragen en optionele browser-spraakinvoer. Planning, gesprek en bestaande fotobijschriften geven context; GPS-coördinaten blijven lokaal. Na afronden maakt AI uitsluitend een bewerkbaar privéconcept van titel, locatie en dagverhaal.

### Nog te verifiëren voordat echte foto-upload wordt vrijgegeven

- Geen openstaande technische verificaties voor de foto-upload. Op 14 oktober 2026 is een echte foto succesvol geüpload, server-side verwerkt en als private WebP-webversie beschikbaar gekomen.

### Bevestigde uploadbeveiliging

- De private Scaleway-bucket accepteert directe, kortlevende browser-uploads uitsluitend vanaf `https://opreis.blindenbach.nl`, met methode `PUT` en header `Content-Type`. De bucket en foto-originelen blijven niet-publiek.

### Bewust nog niet gebouwd

- Directe plaatsing via Instagram-, Facebook- of Polarsteps-API’s; de app bereidt captions en de geselecteerde foto’s voor, waarna Henk of Michel zelf in de betreffende app plaatst.
- Volledig publiek reisoverzicht, kaart/GPS op dagposts, eerdere/volgende-dagnavigatie, planner, offline gebruik en fotoboekworkflow.

### Bouwafspraak publiek reisscherm — vooraf vastgelegd (14 oktober 2026)

- De homepage krijgt een heldere actuele-reispositie: bezoekers zien dat zij Henk en Michel op de huidige reis kunnen volgen en gaan vanaf daar naar het openbare reisscherm.
- Eerdere openbare reizen blijven bereikbaar als compact overzicht; alleen bestaande publieke reisvelden en gepubliceerde dagen worden gelezen.
- De nieuwe route `/reizen/[slug]` wordt de chronologische ingang voor één reis. Een dagpost krijgt links naar de vorige en volgende gepubliceerde dag van diezelfde reis.
- De actuele reis volgt de bestaande status en datums. Als geen reis actief is, blijft de eerstvolgende niet-afgesloten openbare reis zichtbaar zonder een onjuiste claim dat Henk en Michel onderweg zijn.

Bewust buiten deze stap: extra reisdata of schemawijzigingen, kaart/GPS, openbare reacties, social-API’s en het wijzigen van een reisstatus.

### Bouwafspraak privé planner en documentkluis — vooraf vastgelegd (14 oktober 2026)

- De bestaande Excel-planning is uitsluitend als ontwerpbron gebruikt; er komt geen importmodule of blijvende Excel-koppeling.
- Michel en Henk krijgen een privé dagplanner met verblijf, vlucht, ander vervoer, activiteit en vrije notitie. Ieder onderdeel kan een optie, gepland of bevestigd zijn.
- Documenten worden privé per reisdag opgeslagen met een expliciet type: hotelbevestiging, visum, vliegticket, ander vervoersticket, excursieticket, verzekering of overig.
- De documentenbucket, metadata en elke download zijn uitsluitend toegankelijk voor reisleden via RLS en kortlevende URL’s. Bestanden zijn nooit openbaar of onderdeel van de reisblog.

Bewust buiten deze stap: OCR, e-mailimport, automatische Excel-import, documentbewerking, publieke documentlinks en een volledige boekings-/betalingsadministratie.

### Afgerond — publicatie van een dag (14 oktober 2026)

- De publieke home haalt voor de concrete reis alleen al gepubliceerde dagen op. Zijn er nog geen verhalen, dan toont de site geen geplande of privé-dagen maar een rustige aankondiging.
- Een dagkaart opent de gecontroleerde URL `/reizen/[reis-slug]/dagen/[dagnummer]`. De route verifieert beide delen van de URL en toont uitsluitend een gepubliceerd verslag.
- De openbare dagpost ondersteunt titel, locatie, kopjes, alinea’s en een galerij. Alleen foto’s met de expliciete keuze **Gebruik voor publicatie en social** verschijnen daar.
- De oorspronkelijke foto en de private Scaleway-bucket blijven onzichtbaar. De publieke pagina leest alleen de geoptimaliseerde WebP via een RLS-gecontroleerde route; een niet-geselecteerde, niet-klare of niet-gepubliceerde foto geeft geen beeld terug.
- Na **Publiceer dag** verschijnt in de privé-editor een duidelijke knop naar de publieke dag. Daarnaast zijn er open-knoppen voor Instagram, Facebook en Polarsteps. De caption wordt nog steeds bewust eerst gekopieerd: deze platformen bieden vanuit een webapp geen betrouwbare, veilige vooraf ingevulde poststroom.
- De geselecteerde originelen kunnen vanuit dezelfde editor via het iPhone-deelmenu aan de fotobibliotheek worden toegevoegd, zodat zij bij het sociale bericht vooraan staan.
- Technische controle: `npm run build` is geslaagd op 14 oktober 2026. Een echte iPhone-rondgang voor de deelactie en een publicatie met definitieve reisinhoud blijft gewenst.

### Afgerond — actuele en eerdere openbare reizen (14 oktober 2026)

- De publieke homepage herkent de actuele reis aan `travelling` of aan de reisperiode. Als er tijdelijk geen actieve reis is, toont zij de eerstvolgende niet-afgesloten openbare reis eerlijk als volgende reis.
- Bezoekers krijgen een duidelijke actie om de actuele reis te volgen. Alleen gepubliceerde verhalen verschijnen op de homepage en in de reisdetailpagina.
- Eerdere openbare reizen worden als apart overzicht getoond zodra er reizen met een afgesloten status of verstreken einddatum bestaan.
- De nieuwe route `/reizen/[slug]` bevat de chronologische tijdlijn van gepubliceerde verhalen; een individuele dagpost heeft veilige vorige/volgende-navigatie binnen diezelfde reis.
- Er zijn geen schemawijzigingen of privé-leesrechten toegevoegd. De bestaande RLS-regels blijven bepalen welke reizen, dagen en foto’s publiek leesbaar zijn.
- Technische controle: `npm run build` is geslaagd op 14 oktober 2026.

### Afgerond — privé planner en documentkluis (14 oktober 2026)

- `/app/trips` is nu de besloten reiswerkplek: Henk en Michel kiezen een reisdag, leggen verblijf, vlucht, ander vervoer, activiteit of notitie vast en zien wat nog een optie is, gepland staat of bevestigd is.
- Ieder document krijgt een herkenbaar type: **hotelbevestiging**, **visum**, **vliegticket**, **ander vervoersticket**, **excursieticket**, **verzekering** of **overig**. Daardoor blijft de dagkluis onderweg scanbaar zonder de inhoud van bestanden te hoeven openen.
- De app slaat alleen metadata in Supabase op; het bestand komt in de nieuwe private bucket `trip-documents`. Uploads accepteren PDF, afbeeldingen (inclusief HEIC), Word- en Excel-bestanden tot 25 MB.
- Elk document kan alleen door een reisgenoot worden geüpload, gezien en via een kortlevende ondertekende downloadlink geopend. De bucket is in productie bevestigd als niet-publiek; er bestaan twee privé planner-tabellen met RLS.
- De productiemigratie `20261014125112_add_private_planning_and_documents.sql` is toegepast en `npm run build` is geslaagd op 14 oktober 2026.
- Nog praktisch te toetsen: één echte documentupload en download op iPhone, inclusief openen vanuit de bestanden-app. OCR, e-mailinvoer en automatisch uitlezen blijven bewust buiten deze versie.

### Verfijning — centrale documentbibliotheek (14 oktober 2026)

- Een Mac kan een PDF afhankelijk van de bron als generiek bestandstype doorgeven. De upload herkent ondersteunde bestanden daarom gecontroleerd aan zowel extensie als MIME-type en geeft het correcte type mee aan de private opslag.
- Naast documenten per reisdag bestaat er nu `/app/documents`: een centrale, privé bibliotheek voor de hele reis. Een bestand kan daar aan een reisdag worden gekoppeld of bewust als reisdocument zonder dag worden bewaard.
- De bibliotheek filtert op documenttype en reisdag. De dagweergave blijft voor het snelle gebruik onderweg bestaan en linkt door naar het volledige overzicht.

### Bouwafspraak reisstructuur — vooraf vastgelegd (14 oktober 2026)

- De besloten app wordt reisgericht: iedere planner-, document- en volgende verslagpagina krijgt expliciet de gekozen reis in de URL en dataquery mee.
- **Reis** opent op desktop een uitklapbare navigatie met alle toegankelijke reizen, de onderdelen Plan de reis, Documenten, Reisverslag, Foto’s en Publiceren, plus bovenaan **Nieuwe reis**.
- Een nieuwe reis vraagt alleen titel, landen/bestemmingen, datums, fase en een optionele korte omschrijving. Zij start altijd privé, krijgt de maker als eigenaar en maakt lege reisdagen voor de volledige periode aan.
- De bestaande reis blijft intact. Mobiel blijft de knop **Reis** naar een duidelijk reisoverzicht leiden; een diepe uitklapnavigatie past daar niet goed.

Bewust buiten deze stap: reizen verwijderen of dupliceren, reisgenoten uitnodigen/beheren, wijzigingen aan openbare zichtbaarheid en inhoudelijke planning per nieuwe reis.

### Afgerond — privé reisstructuur (14 oktober 2026)

- `/app/trips` is het besloten overzicht van alle toegankelijke reizen, met fase, periode, bestemming en directe ingangen naar de reisonderdelen.
- De desktopnavigatie onder **Reis** is inklapbaar: bovenaan staat **Nieuwe reis**, daarna iedere reis met de vaste subpagina’s Plan de reis, Documenten, Reisverslag, Foto’s en Publiceren. Op mobiel opent **Reis** het overzicht.
- Een nieuwe reis wordt standaard privé aangemaakt. De maker wordt eigenaar en de app maakt voor de volledige reisperiode meteen de lege reisdagen aan.
- Planner en documentkluis hebben nu een expliciete reisroute (`/app/trips/[reis-id]/plan` en `/app/trips/[reis-id]/documents`); gegevens van verschillende reizen lopen daardoor niet door elkaar.
- Productiemigratie `20261014131749_allow_private_trip_creation.sql` is toegepast. De drie benodigde RLS-creatiepolicies en de maker-kolom zijn in productie gecontroleerd; `npm run build` is geslaagd.

### Afgerond — reisdagkalender en planningscockpit (14 oktober 2026)

- Het reis-submenu zet alle onderdelen nu expliciet onder elkaar. Iedere reis heeft daarnaast een ingeklapte lijst met zijn reisdagen en directe sprongen naar de bijbehorende regel in het planoverzicht.
- Bestaande reisdagen zijn veilig genormaliseerd op hun kalenderdatum: gekoppelde documenten en verslagen behouden hun dag-id. Ontbrekende dagen binnen iedere reisperiode worden als lege dagen aangevuld.
- De Nepal/Bhutan-reis loopt nu volledig van dag 1 op 1 november 2026 tot en met dag 37 op 7 december 2026. Dit is in productie gecontroleerd.
- Boven het bestaande dagdetail staat op **Plan de reis** nu een overzichtstabel met per dag de status van vlucht, verblijf, ander vervoer en activiteit. Een lege cel maakt direct zichtbaar wat Michel nog moet plannen.
- Datum, titel, plaats, route en dagstatus zijn per reisdag bewerkbaar. De update is begrensd tot de gekozen reis en valt onder RLS voor reisleden.
- Productiemigratie `20261014132509_normalize_trip_days_and_allow_updates.sql` is toegepast; `npm run build` is geslaagd.

### Afgerond — RLS-reparatie voor private planning en publieke verhalen (14 oktober 2026)

- De foutmelding achter de lege Nepal-reisdagen was een echte RLS-recursielus: een regel op `trip_days` raadpleegde `day_entries`, terwijl een regel op `day_entries` terug naar `trip_days` keek. De app ving die databasefout op als een lege lijst.
- Private reisdagen zijn nu uitsluitend leesbaar voor reisleden. Publieke reisstatus alleen maakt de planning niet langer leesbaar voor bezoekers.
- Een dagverslag draagt voortaan zijn reis-id, dagnummer en datum als publicatiegegevens. Daardoor kunnen openbare tijdlijnen en dagposts uitsluitend gepubliceerde verslagen lezen, zonder de private planningstabel te raadplegen.
- Bestaande verslagen zijn met hun oorspronkelijke reisdag aangevuld. Nieuwe verslagen vullen deze gegevens bij het opslaan automatisch en gecontroleerd in.
- Productiemigratie `20261014133836_decouple_public_entries_from_trip_days.sql` is toegepast. RLS-test: Henk ziet 37 Nepal-reisdagen; een anonieme lezer heeft geen toegang tot `trip_days`. Er zijn nu geen gepubliceerde dagverslagen zichtbaar, zoals verwacht.

### Bouwafspraak — één planningscockpit (14 oktober 2026)

- De dubbele combinatie van reisoverzicht en losse dagplanner wordt vervangen door één interactieve tabel: per rij één reisdag en per kolom vlucht, verblijf, vervoer of activiteit.
- Een lege cel is een uitnodiging om precies dat onderdeel toe te voegen. Optie, gepland en **✓ bevestigd** blijven zichtbaar in dezelfde cel; een passend opgeslagen document verschijnt als subtiele documentvermelding.
- Boven de tabel staan compacte cijfers en filters voor alles, open acties en de vier categorieën. Het aandachtgetal combineert nog niet bevestigde onderdelen met dagen waar een plaats is ingevuld maar geen verblijf bestaat.
- Daggegevens, notities en documenten verschijnen alleen in een uitklapbaar dagdetail. Daardoor bestaat er nog maar één reisoverzicht en synchroniseert een nieuwe vlucht of reservering direct met de rij erboven.

### Bouwafspraak — reisaanmaak en bruikbare hoofdnavigatie (14 oktober 2026)

- Het formulier voor een nieuwe reis gebruikt rustige Nederlandse datumvelden (`dd-mm-jjjj`) met directe, specifieke validatie. De server blijft uitsluitend ISO-datums accepteren en valideert opnieuw.
- Reizigers en vertrekplaats worden als optionele, privé reisgegevens bewaard. Zij komen niet voor in publieke routes, pagina’s of API-antwoorden.
- De tekst over plannen spreekt consequent over **jullie** in plaats van één reisgenoot bij naam.
- **Reis** blijft een uitklapbare desktopgroep, maar is ook zelf een link naar het reisoverzicht. **Foto’s** toont de private fotobibliotheek van de gekozen reis; **Meer** biedt praktische routes naar reisbeheer en documenten in plaats van een placeholder.

Bewust buiten deze stap: uitnodigingen of rollen voor reisgenoten, bewerken/verwijderen van reizen, openbare reisvelden, en een aparte fotobewerkingsworkflow.

### Afgerond — reisaanmaak en bruikbare hoofdnavigatie (14 oktober 2026)

- Nieuwe reizen gebruiken nu datumvelden in Nederlands formaat (`dd-mm-jjjj`). Het formulier meldt onmiddellijk en concreet welke datum ontbreekt of ongeldig is, inclusief een terugreis vóór vertrek; de API valideert dezelfde grens opnieuw met ISO-datums.
- **Reizigers** en **vertrekplaats** zijn optionele, private velden op een reis. De productiemigratie `20261014192341_add_trip_travelers_and_departure_location.sql` is toegepast; beide velden staan alleen op de besloten reisrij en komen niet voor in openbare queries.
- De introductie bij een nieuwe reis spreekt over **jullie** en wijst niet langer één reisgenoot aan als planner.
- In de desktopnavigatie is **Reis** zowel uitklapbaar als rechtstreeks te openen naar het volledige reisoverzicht. De mobiele route blijft het overzicht openen.
- `/app/photos` is nu een private, per reis te kiezen fotobibliotheek. Zij toont alleen klaargezette WebP-versies via bestaande, kortlevende ondertekende links; originelen blijven in de private opslag. Oude reisfoto-links leiden daar ook naartoe.
- `/app/more` is een praktische reisbeheerpagina met directe routes naar een nieuwe reis, alle reizen, planning, documenten en foto’s per reis.
- Technische controle: productieschema en migratiehistorie zijn gecontroleerd; `npm run build` is geslaagd op 14 oktober 2026. Een echte aanmaakronde met Nederlandse datums en de nieuwe velden blijft de gewenste gebruikerscontrole.

### Bestaande beveiligingssignalen buiten deze bouwstap

- Supabase meldt nog steeds dat `public.rls_auto_enable()` als publiek uitvoerbare `SECURITY DEFINER`-functie beschikbaar is en dat gelekte-wachtwoordbescherming uit staat. Beide instellingen bestonden vóór deze wijziging en zijn niet aangepast; ze vragen om een afzonderlijke, expliciet goedgekeurde beveiligingsstap.

### Bouwafspraak — gedeelde privéwerkplek voor ingelogde reisgenoten (14 oktober 2026)

- Henk en Michel werken als kleine, vertrouwde groep. Iedere ingelogde gebruiker kan daarom alle **private** reizen, reisdagen, planning, documenten, verslagen en foto-metadata lezen en bewerken; de kwetsbare lidmaatschapsketen is geen toegangsvoorwaarde meer.
- De eerste reis krijgt geen verplichte `trip_members`-regel meer. Daardoor kan de reis met reisdagen in één directe flow worden aangemaakt, zonder de RLS-fout bij de accountkoppeling.
- Supabase Storage blijft privé. Alleen ingelogde gebruikers kunnen de bestaande document- en webfoto-buckets benaderen; anonieme bezoekers behouden uitsluitend de expliciet gepubliceerde verhalen en geselecteerde webfoto’s.
- De datumvelden accepteren ook acht cijfers, bijvoorbeeld `03122026`, en zetten die tijdens het typen om naar `03-12-2026`.

Bewust buiten deze stap: publieke schrijf- of documenttoegang, open registratie, een account- of uitnodigbeheer, en het openbaar maken van originelen.

### Afgerond — gedeelde privéwerkplek voor ingelogde reisgenoten (14 oktober 2026)

- De accountkoppelingsfout bij de eerste reis was veroorzaakt door de verplichte `trip_members`-RLS-keten. De API maakt nu direct de reis en haar reisdagen aan; een lidmaatschapsrecord is niet langer nodig voor de dagelijkse werking.
- Alle private reistabellen — reizen, reisdagen, planning, documenten, dagverslagen, interviews en foto-metadata — gebruiken nu directe toegang voor de rol `authenticated`. Henk en Michel zien en bewerken dus dezelfde werkplek zodra zij zijn ingelogd.
- De privé-buckets `trip-documents` en `trip-web-images` zijn op dezelfde manier alleen voor ingelogde gebruikers toegankelijk. De buckets zelf en de originelen blijven niet-publiek; anonieme toegang bestaat alleen voor reeds gepubliceerde verhalen en expliciet geselecteerde webfoto’s.
- Een teruggedraaide productietest onder Henks account kon een nieuwe reis én eerste lidmaatschapsregel direct maken (`created_memberships: 1`) zonder gegevens achter te laten. Daarmee is de oorspronkelijke RLS-blokkade concreet geverifieerd.
- Datumvelden zetten acht cijfers tijdens invoer om naar het Nederlandse formaat: `03122026` wordt `03-12-2026`.
- Productiemigratie `20261014193205_simplify_authenticated_trip_access.sql` is toegepast en `npm run build` is geslaagd op 14 oktober 2026.

### Bouwafspraak — planner met meerdere onderdelen en verblijfsperiodes (14 oktober 2026)

- Iedere dag/categorie in de planningscockpit kan meerdere onderdelen tonen en toevoegen. Bestaande items blijven ongewijzigd en kunnen stuk voor stuk worden geopend en bewerkt.
- Een verblijf krijgt een optionele uitcheckdatum. Hetzelfde verblijf verschijnt dan op iedere tussenliggende overnachtingsdag; de uitcheckdag zelf telt niet als nacht.
- Een document hoort primair bij een planningonderdeel. De bestaande koppeling wordt in de cockpit zichtbaarder gemaakt; documenten die alleen aan een dag hangen blijven bestaan.
- De cockpit maakt opslaan zichtbaar en blokkeert dubbele acties tijdens een actieve bewerking. De statusmeter wordt hernoemd naar het concrete aantal **opties**; "gepland" telt dus niet meer als aandachtspunt.
- De dagkop wordt op kleine schermen afgekapt in plaats van dat tekst en datum over elkaar heen lopen.

Bewust buiten deze stap: spreadsheet-/tekstimport, kopiëren naar volgende dagen, bulk-upload, categoriegebonden boekingsvelden, budget, openpuntenlijst, reisgenootdossiers en automatische documentextractie.

### Afgerond — planner met meerdere onderdelen en verblijfsperiodes (14 oktober 2026)

- Een planningvak kan nu meerdere items van hetzelfde type tonen. Daardoor kunnen bijvoorbeeld twee vluchten op één dag allebei onder **Vlucht** blijven staan; de knop verandert na het eerste item in **+ nog een**.
- Een verblijf kan bij toevoegen of bewerken een uitcheckdatum krijgen. Het item wordt vanaf de incheckdag tot, maar niet inclusief, de uitcheckdag getoond. Bestaande verblijven zonder datum behouden hun oorspronkelijke, ééndaagse weergave.
- Het bestaande documentmodel had al een koppeling met een planningonderdeel. Die koppeling is nu direct bruikbaar vanuit ieder bewerkbaar onderdeel en blijft naast daggebonden documenten bestaan.
- Tijdens opslaan blokkeert de cockpit andere acties en toont de betreffende knop **Opslaan…**. Dit voorkomt dubbelklikken en dubbele onderdelen.
- De teller heet nu **opties** en telt uitsluitend items met de status Optie. Geplande, maar nog niet bevestigde items worden dus niet meer als onduidelijk aandachtspunt geteld.
- De dagkop gebruikt afkappen op kleine schermen, zodat een lange plaats of "Nog invullen" de datum niet meer overlapt.
- Productiemigratie `20261014194555_add_planning_item_checkout_date.sql` is toegepast; de nullable datumkolom is in productie gecontroleerd en `npm run build` is geslaagd op 14 oktober 2026.

### Bouwafspraak — boekingsvelden per planningtype en menuherstel (14 oktober 2026)

- Het reis-submenu krijgt een eigen verticale container, zodat alle onderdelen onder de gekozen reis staan en niet naast elkaar kunnen vloeien.
- Privé planningitems krijgen optionele, gestructureerde velden: boekingsnummer, ticketnummer, vertrek- en aankomsttijd, adres, telefoon, bedrag, valuta en betaalstatus.
- De editor toont alleen de passende velden: vlucht gebruikt tijd- en ticketvelden; verblijf gebruikt contact-, prijs- en betaalvelden; vervoer en activiteit gebruiken tijd, boekingsnummer en prijs/betaalstatus.
- Bestaande vrije notities, titel, locatie en uitcheckdatum blijven bewaard. Er worden geen gegevens uit bestaande notities gemigreerd of afgeleid.

Bewust buiten deze stap: import, visa/verzekering als aparte planningssoort, paspoort- en loyaliteitsgegevens, budgetoverzicht, openpuntenlijst en publieke velden.

### Afgerond — boekingsvelden per planningtype en menuherstel (14 oktober 2026)

- Het submenu binnen **Reis** heeft nu per gekozen reis een eigen verticale navigatiecontainer. De vaste onderdelen en ingeklapte reisdagen kunnen daardoor niet meer naast elkaar doorlopen.
- Een planningonderdeel kan nu optioneel een boekingsnummer, ticketnummer, vertrek- en aankomsttijd, adres, telefoonnummer, bedrag, drieletter-valuta en betaalstatus bewaren. Alle gegevens blijven privé binnen de ingelogde reiswerkplek.
- De bewerkeditor houdt de invoer compact per type: vlucht toont tijden en ticketgegevens; verblijf toont uitcheckdatum en contactgegevens; vervoer en activiteit tonen tijd en boekingsnummer. Bedrag, valuta en betaalstatus zijn beschikbaar waar passend.
- Bestaande titels, locaties, notities, documenten en uitcheckdatums zijn ongewijzigd gebleven; lege nieuwe velden zijn bewust optioneel.
- Productiemigratie `20261014194941_add_planning_booking_fields.sql` is toegepast en `npm run build` is geslaagd op 14 oktober 2026.

### Bouwafspraak — rijkere activiteiten, dagnotities en flexibele documentkoppeling (14 oktober 2026)

- Activiteiten krijgen optionele, gestructureerde velden voor duur in minuten en hoogte in meters. Elk planningonderdeel kan daarnaast afzonderlijk als **optioneel** worden gemarkeerd, los van de boekingsstatus.
- Dagnotities krijgen een eigen, herkenbare ingang vanuit iedere dagregel; de bestaande privé-notitie blijft de ene plek voor algemene zaken zoals gids, maaltijden en losse aandachtspunten.
- Bij uploaden vanuit een planningonderdeel kan de gebruiker zelf het documenttype kiezen en bepalen of het document bij dat onderdeel of algemeen bij die reisdag hoort.
- De editor blijft na het opslaan open, met een bevestiging, zodat uploaden of een tweede aanvulling direct kan volgen.

Bewust buiten deze stap: meerdere directe koppelingen van één document aan verschillende onderdelen, bulk-upload, documentextractie, import en een nieuw reisbudget- of openpuntenoverzicht.

### Afgerond — rijkere activiteiten, dagnotities en flexibele documentkoppeling (14 oktober 2026)

- Activiteiten kunnen nu een duur in minuten en hoogte in meters hebben. De gegevens staan zichtbaar in het activiteitenvak, zodat meerdere stops niet meer in één vrije notitie hoeven.
- **Optioneel onderdeel** is een afzonderlijke keuze, naast Optie/Gepland/Bevestigd. Bedrag, valuta en betaalstatus zijn bij alle planningsonderdelen beschikbaar en worden in het overzicht getoond zodra zij zijn ingevuld.
- Iedere dagregel toont nu duidelijk **+ dagnotitie** of **📝 Dagnotitie**. De uitklapbare dageditor legt ook uit dat dit de plek is voor gids, maaltijden en algemene afspraken; deze bestaande gegevens blijven privé.
- Vanuit de editor is documenttype vrij te kiezen. Een document kan aan het geopende onderdeel óf algemeen aan de reisdag worden gekoppeld. Na opslaan blijft de editor open, zodat uploaden direct daarna kan plaatsvinden.
- Productiemigratie `20261014195504_add_activity_planning_details.sql` is toegepast en `npm run build` is geslaagd op 14 oktober 2026. De beveiligingsscan toont uitsluitend de drie al bekende waarschuwingen over `rls_auto_enable()` en gelekte-wachtwoordbescherming.

### Bouwafspraak — actuele Vandaag-pagina en plannerherstel (14 oktober 2026)

- **Vandaag** kiest de datum in de tijdzone van de reiswerkplek. Vóór vertrek verschijnt de eerstvolgende reis met aftellen en praktische snelkoppelingen; alleen tijdens een reis verschijnt de echte kalenderdag en het dagverslag.
- De oude vaste voorbeeldtekst en Poon-Hill-gegevens verdwijnen uit de besloten Vandaag-route. Zonder actieve of toekomstige reis wordt een neutrale starttoestand getoond.
- Tijdinvoer wordt een gevalideerd 24-uursveld (`uu:mm`), onafhankelijk van de 12-uursvoorkeur van Safari. Lange dagtitels in het zijmenu mogen over twee regels lopen in plaats van onzichtbaar afgekapt te worden.
- De actie **+ toevoegen** in een activiteitenvak krijgt een expliciete, klikbare bediening en wordt opnieuw gecontroleerd op desktop en mobiel.
- De vermoedelijke dubbele Nepal-reis wordt alleen-lezen onderzocht. De app rendert momenteel één submenu per reisrecord; deze stap verwijdert, verbergt of combineert geen gegevens.

Bewust buiten deze stap: datamigratie, samenvoegen/verwijderen van reizen en wijzigingen aan publieke reispagina’s.

### Afgerond — actuele Vandaag-pagina en plannerherstel (14 oktober 2026)

- De besloten **Vandaag**-pagina bevat geen vaste 6-november-, Poon-Hill- of voorbeeldstatistieken meer. Zij bepaalt de datum in de tijdzone Europe/Lisbon en toont alleen een echte reisdag tijdens de reis.
- Vóór vertrek toont Vandaag de eerstvolgende reis, het aantal resterende dagen en snelle ingangen naar plan en documenten. Zonder actieve of toekomstige reis verschijnt een neutrale toestand; na afloop wordt geen oude reisdag hergebruikt.
- Tijdvelden worden na openen van een planningonderdeel als 24-uursinvoer `uu:mm` aangeboden, met dezelfde servervalidatie. Lange titels in het zijmenu mogen nu over regels lopen in plaats van afgekapt te worden.
- De bestaande knop **+ toevoegen** blijft de directe route naar het activiteitenformulier. De technische buildcontrole is geslaagd; een handmatige interactietest kon niet met bestaande reisdata worden herhaald, omdat de ingelogde browser-sessie op dat moment geen reizen terugkreeg.
- De mogelijke dubbele Nepal-reis is niet aangepast. De app rendert één submenu per reisrecord; zonder een leesbare lijst met actuele records is samenvoegen of verwijderen niet verantwoord.
- `npm run build` is geslaagd op 14 oktober 2026.

### Bouwafspraak — mobiele reisdagen en documentkluis (15 oktober 2026)

- Tijdens een actieve reis toont **Vandaag** de planning van vandaag én de eerstvolgende reisdag als leesbare mobiele kaarten, met tijden, boekingsreferentie, navigatie/bellen waar beschikbaar en directe documentacties.
- Een verlopen sessie bij een document leidt herkenbaar terug naar inloggen. Documentacties tonen voortaan een duidelijke, grote kaartactie in plaats van een kleine losse link.
- De documentkluis begint met de lijst. Een document heeft een bewerkbare titel en kan aan nul, één of meerdere planningonderdelen worden gekoppeld; bestaande enkelvoudige koppelingen blijven behouden.
- De nieuwe koppeltabel volgt het reeds goedgekeurde model van deze besloten, gedeelde werkplek: uitsluitend ingelogde gebruikers krijgen toegang; anonieme toegang blijft uitgesloten.

Bewust buiten deze stap: offline kopieën op een toestel, een cache-/wisstrategie bij uitloggen, import via AI/PDF/e-mail, bulk-upload, de desktop-zijpaneel-editor en wijzigingen aan publieke pagina’s.

### Afgerond — mobiele reisdagen en documentkluis (15 oktober 2026)

- Tijdens een actieve reis haalt **Vandaag** nu de planning en documenten op voor vandaag en de eerstvolgende reisdag. De mobiele kaarten tonen vlucht-/verblijfsdetails, tijden, boekingsreferentie, navigatie of bellen wanneer die gegevens bestaan, en directe documentknoppen.
- Bij een documentactie zonder geldige sessie gaat de app terug naar inloggen met een terugkeerpad. De documentkaart is volledig aanklikbaar en bevat daarnaast een expliciete grote actie.
- De documentpagina toont de lijst voor het uploadgedeelte. Titel en gekoppelde planningonderdelen zijn daar te bewerken; bij uploaden kan één document meteen aan meerdere onderdelen worden gekoppeld.
- Nieuwe tabel `trip_document_planning_items` bewaart de meerdere koppelingen. Bestaande `planning_item_id`-koppelingen zijn gemigreerd en blijven compatibel met de bestaande planner.
- Productiemigratie `20261015075736_document_planning_item_links.sql` is toegepast en `npm run build` is geslaagd op 15 oktober 2026.

### Bouwafspraak — offline reisdossier en leesbare planner (15 oktober 2026)

- Alle documenten van de gekozen reis kunnen op verzoek alleen op het huidige toestel worden bewaard. Kopieën verdwijnen automatisch zodra de reis voorbij is en blijven altijd handmatig te verwijderen.
- Op mobiel wordt de planner een leesbare dagkaartweergave zonder horizontaal scrollen. Snel details en documenten vinden is het hoofddoel; bewerken blijft beschikbaar maar niet dominant.
- Op desktop gebruiken zowel toevoegen als bewerken hetzelfde vaste rechter zijpaneel. Het reisoverzicht blijft daardoor in positie.

Bewust buiten deze stap: server-side documentkopieën, synchronisatie tussen toestellen, AI-import, bulk-upload en wijzigingen aan private reisgegevens of het databaseschema.

### Afgerond — offline reisdossier en leesbare planner (15 oktober 2026)

- De documentpagina heeft een actie **Maak offline beschikbaar**. Die downloadt alle documenten van de reis naar de browsercache op het huidige toestel; **Verwijder offline kopieën** wist ze weer. De cache wordt bij het volgende openen automatisch verwijderd wanneer de einddatum van de reis voorbij is.
- Documenten openen gebruiken offline kopieën als een verbinding ontbreekt. De service worker bewaart daarnaast de privénavigatie-shell die nodig is om de app onderweg te openen.
- De planner toont op mobiel compacte kaarten per reisdag met vaste labels voor vlucht, verblijf, vervoer en activiteit. De zes-kolomstabel verdwijnt daar en kan niet meer horizontaal uit het scherm lopen.
- Bestaande onderdelen én **+ toevoegen** openen op desktop als een vast rechter zijpaneel. Op mobiel opent hetzelfde formulier schermvullend.
- `npm run build` en `git diff --check` zijn geslaagd op 15 oktober 2026.

### Bouwafspraak — publieke reissite, veilige basis (15 oktober 2026)

- De publieke routes gebruiken uitsluitend een sessieloze anonieme Supabase-client met vaste kolomselecties. Privé planner-, document-, reisgenoot-, interview-, caption- en GPS-velden mogen nooit in publieke responses terechtkomen.
- Anonieme database-toegang wordt beperkt tot openbare reizen, gepubliceerde dagverhalen en geselecteerde webfoto’s. Privé en unlisted reizen gedragen zich identiek als een niet-bestaande route.
- De publieke site krijgt naast home en reis/dagverhaal eigen routes voor reizen, route, foto’s en over ons. De besloten `/app/*`-omgeving blijft buiten deze bouwstap.

Bewust buiten deze eerste publieke release: statistiekvelden, exacte locatiepublicatie, GPS-route, openbare documenten, import en wijzigingen in de privéplanner.

### Afgerond — publieke reissite, veilige basis (15 oktober 2026)

- Productiemigratie `20261015083218_secure_public_data_access.sql` beperkt anonieme toegang zowel per rij als per kolom. Gepubliceerde inhoud is alleen zichtbaar wanneer de bovenliggende reis openbaar is; bestandsnamen, private captions, EXIF/GPS, documenten en privéreisvelden zijn geen anoniem toegankelijke kolommen meer.
- Home en bestaande openbare reisfuncties gebruiken voortaan een sessieloze anonieme client. Een ingelogde bezoeker krijgt daardoor via de publieke datalaag hetzelfde resultaat als een anonieme bezoeker.
- De openbare afbeeldingsroute gebruikt dezelfde anonieme toegangslaag, levert alleen WebP zonder bestandsnaamheader en retourneert een neutrale 404 voor onbekende of niet-openbare assets.
- Nieuwe publieke routes zijn `/reizen`, `/reizen/[slug]/route`, `/reizen/[slug]/fotos` en `/over-ons`; zij tonen alleen expliciet gepubliceerde inhoud.
- `npm run build` en `git diff --check` zijn geslaagd. Er is geen gedrag in `/app/*` aangepast.

### Bouwafspraak — chronologische publieke reisvolgorde (15 oktober 2026)

- De publieke homepage kiest eerst een actieve reis. Is niemand onderweg, dan staat de reis met de eerstvolgende vertrekdatum bovenaan.
- Overige toekomstige, openbare reizen verschijnen daaronder in chronologische volgorde. Eerdere reizen krijgen een aparte, herkenbare ingang vanuit de homepage.
- De publieke reisindex kan via die ingang uitsluitend eerdere reizen tonen.

Bewust buiten deze stap: wijzigingen aan reisdata, reisstatussen, zichtbaarheid, gepubliceerde dagverhalen en de besloten `/app/*`-omgeving.

### Afgerond — chronologische publieke reisvolgorde (15 oktober 2026)

- De homepage sorteert openbare reizen op vertrekdatum en kiest nu aantoonbaar in deze volgorde: actieve reis, eerstvolgende toekomstige reis, en alleen daarna een eerder afgeronde reis als terugval.
- Verdere geplande reizen staan onder de hoofdreis als **Komende reizen**, van vroeg naar laat.
- De homepage heeft een knop **Bekijk reizen uit het verleden**. Die opent `/reizen?periode=verleden`, waar uitsluitend reizen staan die zijn afgelopen of als voltooid/gearchiveerd zijn gemarkeerd.
- `npm run build` en `git diff --check` zijn geslaagd. De wijziging gebruikt alleen al-publieke reisvelden; geen privégegevens of databaserollen zijn aangepast.

### Bouwafspraak — levendige publieke homepage (15 oktober 2026)

- De publieke homepage krijgt een warme, fotografiegedreven hero en gelaagde reisblokken in de stijlrichting van de aangeleverde mockups: groot displaytype, rustige contrasten, duidelijke kaarten en subtiele route-/landaccenten.
- Een geselecteerde openbare WebP-foto kan als hero-achtergrond worden gebruikt zodra er een gepubliceerd dagverhaal met foto bestaat. Zonder publieke foto blijft de hero bewust een abstracte, merkwaardige achtergrond — nooit een privéfoto of een vaste voorbeeldbestemming.
- De oude, vaste aanduiding **Himalaya** verdwijnt. Titels, perioden, landen en links blijven uitsluitend afkomstig van de openbare reisgegevens.

Bewust buiten deze stap: nieuwe foto-uploadregels, databasewijzigingen, routekaarten met GPS, de privéplanner, documenten en wijzigingen aan zichtbaarheid/publicatie.

### Afgerond — levendige publieke homepage (15 oktober 2026)

- De vaste, onjuiste aanduiding **Himalaya** is verwijderd. Ook de route-/landaccenten op de homepage zijn nu decoratief en niet langer een harde bestemmingstekst.
- De homepage heeft een warmere, gelaagde hero, rustiger typografische hiërarchie, beweeglijke maar gereduceerd-beweging-veilige kaarten en heldere blokken voor verhalen, komende reizen en het reisarchief.
- Wanneer er een geselecteerde foto bij een gepubliceerd dagverhaal bestaat, kan alleen die al-openbare WebP als hero-achtergrond worden gebruikt. Zonder foto blijft de hero abstract; privédocumenten, originelen en niet-gepubliceerde foto’s worden niet opgevraagd.
- `npm run build` en `git diff --check` zijn geslaagd. Er is geen gedrag in `/app/*` gewijzigd.

### Bouwafspraak — vaste omslagfoto per reis (15 oktober 2026)

- In **Reis → Publiceren** komt één omslagfoto per reis, met upload, voorvertoning, vervangen en verwijderen.
- De omslagfoto is onafhankelijk van een dagverslag. Het origineel blijft in de privé-opslag; alleen een gestripte WebP-versie mag zichtbaar zijn op de publieke hero van een openbare reis.
- De publieke homepage gebruikt een expliciete omslagfoto vóór een geselecteerde foto uit een gepubliceerd dagverhaal.

Bewust buiten deze stap: een reisbrede fotobibliotheek, meerdere omslagfoto’s, wijziging van bestaande dagfoto’s en aanpassingen aan reiszichtbaarheid.

### Afgerond — vaste omslagfoto per reis (15 oktober 2026)

- **Publiceren** bevat nu het blok **Omslagfoto**. HEIC, HEIF, JPEG, PNG en WebP tot 50 MB worden ondersteund, met lokale voorvertoning, veilige omzetting naar WebP, vervangen en verwijderen.
- Nieuwe tabel `trip_covers` bewaart precies één omslagfoto per reis. Originele bestanden blijven privé op Scaleway; webversies staan in de bestaande private image-bucket.
- De anonieme database- en opslagregels geven uitsluitend leesrecht op de minimale WebP-gegevens wanneer de gekoppelde reis openbaar is. Bestandsnamen en originelen zijn niet publiek toegankelijk.
- De homepage kiest eerst deze omslagfoto; zonder omslagfoto gebruikt zij hooguit een reeds geselecteerde, gepubliceerde dagfoto en anders de abstracte hero.
- Productiemigratie `20261015120436_add_trip_covers.sql` is toegepast. `npm run build` en `git diff --check` zijn geslaagd op 15 oktober 2026.

### Bouwafspraak — zichtbaarheid van publieke omslagfoto’s herstellen (15 oktober 2026)

- De openbare omslagfoto-selectie leest uitsluitend het al toegestane foto-id. De gereed-status wordt volledig in de databasepolicy afgedwongen.
- Alleen een omslagfoto met een geslaagde WebP-verwerking van een openbare reis is anoniem leesbaar; uploadstatus, bestandsnaam en origineel blijven buiten de publieke kolommen.

Bewust buiten deze correctie: uploadgedrag, omslagfoto-keuze, bestaande foto’s, zichtbaarheidinstellingen en de besloten app.

### Afgerond — zichtbaarheid van publieke omslagfoto’s herstellen (15 oktober 2026)

- De publieke homepage leest nu alleen het omslagfoto-id dat anoniem is toegestaan. De databasepolicy bepaalt of de rij bestaat: uitsluitend een voltooide WebP-omslagfoto van een openbare reis wordt doorgelaten.
- Hierdoor is de omslagfoto zichtbaar zodra de verwerking klaar is, zonder dat uploadstatus, originele naam, private opslaglocatie of origineel bestand publiek beschikbaar worden.
- Productiemigratie `20261015133156_restrict_public_trip_covers_to_ready.sql` is toegepast. `npm run build` en `git diff --check` zijn geslaagd op 15 oktober 2026.

### Bouwafspraak — minimale publieke omslagfoto-view (15 oktober 2026)

- De publieke homepage leest omslagfoto’s via een read-only databaseview met uitsluitend foto-id en reis-id, niet langer rechtstreeks uit de privétabel.
- De view bevat zelf de harde voorwaarden: alleen een verwerkte WebP-omslagfoto van een openbare reis. Uploadstatus, bestandsnaam, objectpaden en originelen worden niet als viewkolom aangeboden.

Bewust buiten deze correctie: foto-upload, opslag, zichtbaarheidkeuzes, bestaande reisgegevens en alle besloten routes.

### Afgerond — minimale publieke omslagfoto-view (15 oktober 2026)

- De homepage leest een omslagfoto via `public_trip_covers`, een read-only view die alleen foto-id en reis-id levert wanneer de WebP klaar is en de reis openbaar is.
- De view biedt geen uploadstatus, bestandsnaam, objectpad of origineel aan. De binaire WebP blijft uitsluitend beschikbaar via de bestaande gecontroleerde afbeeldingsroute.
- Productiemigratie `20261015154044_add_public_trip_cover_view.sql` is toegepast. `npm run build` en `git diff --check` zijn geslaagd op 15 oktober 2026.

### Bouwafspraak — omslagfoto-route via veilige view (15 oktober 2026)

- De gecontroleerde afbeeldingsroute leest hetzelfde beperkte publieke omslagfoto-record als de homepage, zodat de heroverwijzing en de WebP-download onder exact dezelfde voorwaarden werken.
- De view bevat alleen een ondoorzichtig WebP-opslagpad voor de reeds openbare, verwerkte afbeelding. Geen Scaleway-originelen, bestandsnamen, captions, EXIF, GPS of documentgegevens komen in deze route.

Bewust buiten deze correctie: publieke lijsttoegang tot opslag, originele foto’s, uploadgedrag en de besloten foto-editor.

### Afgerond — omslagfoto-route via veilige view (15 oktober 2026)

- De publieke hero en de afbeeldingsroute gebruiken nu allebei `public_trip_covers`; daardoor kan een omslagfoto die de homepage kiest ook daadwerkelijk als WebP worden gestreamd.
- De view bevat uitsluitend het niet-herleidbare web-objectpad dat nodig is om de al-openbare afbeelding te leveren. Originele Scaleway-keys, bestandsnamen, captions, EXIF en GPS zijn niet beschikbaar.
- Productiemigratie `20261015154222_expose_public_cover_web_path_to_route.sql` is toegepast. `npm run build` en `git diff --check` zijn geslaagd op 15 oktober 2026.

### Bouwafspraak — publieke API-schema-refresh (15 oktober 2026)

- Na toevoeging van de omslagfoto-view wordt alleen de PostgREST-schema-cache vernieuwd, zodat de bestaande view direct voor de publieke leesroute beschikbaar is.

Bewust buiten deze correctie: tabellen, data, RLS-regels, opslag en applicatiegedrag.

### Afgerond — publieke API-schema-refresh (15 oktober 2026)

- Productiemigratie `20261015154332_reload_public_api_schema.sql` heeft de PostgREST-schema-cache vernieuwd, zodat de publieke omslagfoto-view direct beschikbaar is voor de bestaande leesroute.

### Bouwafspraak — gecontroleerde uitlevering publieke omslag-WebP (15 oktober 2026)

- De Storage-regel voor de publieke afbeeldingsroute gebruikt dezelfde read-only `public_trip_covers`-view als de route zelf. Daardoor kan uitsluitend de WebP van een openbare reis met afgeronde verwerking worden opgehaald.
- De wijziging herstelt alleen het uitleveren van die reeds publieke WebP. Originelen, andere objecten in de bucket, bestandsnamen en privégegevens blijven onbereikbaar voor anonieme bezoekers.

Bewust buiten deze correctie: omslagfoto-upload, tabeldata, reiszichtbaarheid, private opslag en alle besloten routes.

### Afgerond — gecontroleerde uitlevering publieke omslag-WebP (15 oktober 2026)

- De oorzaak was een oudere Storage-policy voor publieke dagfoto’s die tijdens iedere anonieme afbeeldingsdownload alsnog een privétabel probeerde te lezen. Daardoor strandde ook een geldige omslagfoto op 404.
- Zowel de bestaande dagfoto-policy als de nieuwe omslagfoto-policy gebruiken nu elk een minimale, afgeschermde toestemmingsfunctie. Die controleert uitsluitend of een exact WebP-pad bij een openbare reis en expliciet gepubliceerde/gereed gemelde afbeelding hoort.
- De homepage geeft de veilige omslagfoto-route door en die route retourneert live `200 image/webp` voor de Nepal-omslagfoto. Originelen, bestandsnamen, documenten en overige objecten in de bucket blijven privé.
- Productiemigraties `20261015154807_allow_public_cover_web_image_stream.sql` en `20261015154901_authorize_public_cover_web_image_stream.sql` plus `20261015154925_authorize_public_web_image_streams.sql` zijn toegepast op 15 oktober 2026.

### Bouwafspraak — mobiele kwaliteitsronde onderweg (15 oktober 2026)

- De private documentkluis mag op ieder mobiel formaat binnen de viewport blijven. Documentkaarten, filters, upload- en offline-acties krijgen consistente aanraakvlakken van minimaal 44px.
- Mobiele plannerkaarten krijgen een vaste, afbreekveilige dagkop: dagtitel, datum en route blijven leesbaar zonder overlap.
- Vóór vertrek toont **Vandaag** naast de afteller een compacte vooruitblik op de eerste twee reisdagen, inclusief beschikbare planning en dagdocumenten. Tijdens de reis blijft de bestaande Vandaag/Morgen-weergave gelden.
- Private routes krijgen lichte `loading.tsx`-skeletons. De offlinefunctie toont een bruikbare registratie-/cachefout in plaats van die stil te negeren.

Bewust buiten deze stap: nieuwe planningvelden, import, budget/open-puntenuitbreiding, wijzigingen aan reisdata, server-side offlinekopieën, synchronisatie en publieke routes.

### Afgerond — mobiele kwaliteitsronde onderweg (15 oktober 2026)

- Documentkaarten en documentformulieren breken lange titels, gekoppelde onderdelen en bestandsnamen binnen de beschikbare schermbreedte af. Mobiele document-, upload-, offline- en detailacties hebben nu minimaal een 44px-aanraakvlak.
- De mobiele dagkop in de planner gebruikt nu aparte regels voor titel, datum/route en dagnotitie. Lange waarden worden afgebroken in plaats van over elkaar heen te lopen.
- Vóór vertrek leest **Vandaag** de eerste twee echte reisdagen, hun planning en beschikbare dagdocumenten uit de gekozen reis. De bestaande Vandaag/Morgen-kaarten worden daarvoor hergebruikt met passende koppen; er is geen voorbeelddata toegevoegd.
- Private app- en reisroutes hebben lichte `loading.tsx`-skeletons. De offlinefunctie meldt een mislukte service-workerregistratie nu duidelijk, terwijl de afzonderlijke documentcache bruikbaar blijft.
- `npm run build` en `git diff --check` zijn geslaagd op 15 oktober 2026. De echte offline-rondgang (vliegtuigstand na vooraf downloaden) blijft nog een handmatige iPhone-test.

### Bouwafspraak — privé reisdossier (15 oktober 2026)

- De planner krijgt complete operationele vluchtvelden: maatschappij, vluchtnummer, vertrek- en aankomstdatum/-tijd, vertrek- en aankomstterminal en stoel. Activiteiten en vervoer krijgen tijd, adres en een externe link.
- Visum en permit worden een eigen privé planningssoort, met dezelfde status-, document- en prijsmechaniek als de bestaande onderdelen.
- Onder de planner komt een privé reisdossier met reizigers (naam, rol, stoel-/ticket- en loyaliteitsgegevens), contacten (rol, telefoon, e-mail, adres en notitie), een budget met geraamde/werkelijke bedragen per valuta en de bestaande open-puntenlijst.
- Open punten krijgen een eigenaar, deadline en optionele koppeling met een reisdag of planningonderdeel. Alle nieuwe tabellen zijn RLS-beveiligd en uitsluitend toegankelijk voor ingelogde gebruikers; geen ervan krijgt anonieme grants of een publieke route.

Bewust buiten deze stap: paspoortnummers, geboortedata, paspoortscans, import, kopiëren naar volgende dagen, betalingsintegraties, server-side documentextractie en wijzigingen aan de publieke website.

### Deellevering — privé reisdossierfundament (15 oktober 2026)

- Productiemigratie `20261015175727_add_private_trip_dossier.sql` voegt privé tabellen toe voor reizigers, contacten en budgetregels, plus operationele velden voor vlucht/activiteit/vervoer en uitgebreidere open punten. Alle nieuwe tabellen hebben RLS, krijgen alleen rechten voor `authenticated` en expliciet geen anonieme toegang.
- Onder de planner staat nu een privé reisdossier waarin reizigers, contacten en budgetregels kunnen worden toegevoegd. Budgettotalen worden per valuta getoond. Paspoortnummers, geboortedata en scans worden niet opgeslagen.
- De bestaande open-punten-API accepteert nu eigenaar, deadline en koppeling met een planningonderdeel; de zichtbare uitgebreide editor voor die velden, en het volledig gelijk trekken van snelle planninginvoer met alle nieuwe vlucht-/activiteitsvelden, worden in de resterende UI-afronding van dit blok toegevoegd.
- `npm run build` en `git diff --check` zijn geslaagd op 15 oktober 2026.
