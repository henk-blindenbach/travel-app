# Travel Platform - Master Plan

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
- Wachtwoordherstelinterface en pagina om een nieuw wachtwoord te kiezen. De serververifieerbare Supabase `token_hash`-mailtemplate is voorbereid, maar kan in het huidige Free-project pas worden geactiveerd na het instellen van eigen SMTP.

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
