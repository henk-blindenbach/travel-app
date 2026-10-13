<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Travel-app werkafspraken

Dit is een persoonlijk project van Henk en Michel. Werk pragmatisch en licht: er is geen Jira-proces, geen formele releasecyclus en geen aparte development- en productiondatabase. We werken voorlopig met één Supabase-omgeving.

- Beschrijf vóór iedere nieuwe bouwstap concreet wat je gaat maken, welke routes/data hierdoor veranderen en wat bewust buiten scope blijft.
- Wacht daarna op expliciet akkoord van Henk vóór je code, database-schema's, configuratie of externe koppelingen wijzigt. Een algemene probleembeschrijving is geen bouwopdracht.
- Na akkoord mag je de bijbehorende wijzigingen committen en naar `origin/main` pushen, tenzij Henk dit voor die stap anders aangeeft.
- Houd publieke content, privé-reisdata en secrets strikt gescheiden. Zet nooit wachtwoorden, API-keys, boekingscodes, PINs of gevoelige documenten in Git, publieke routes, logs of mockdata.
- De app blijft één herbruikbaar reisplatform; maak geen oplossingen die specifiek vastzitten aan de Nepal/Tibet/Bhutan/India-reis.
- Controleer na een bouwstap ten minste de relevante build of test en vermeld helder wat echt werkt en wat nog alleen een visuele placeholder is.
