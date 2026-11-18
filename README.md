# FiskeDEX 🎣

Fiskeleksikon og fangstdagbog for fisk i danske **fjorde, søer og åer**.

## Funktioner
- **73 arter** med dansk og latinsk navn, gruppe, levested (fjord/sø/å) og beskrivelse
- **Kryds af** de arter, I har fanget, og følg fremskridtet (X / 73)
- **Registrér fangster** med:
  - dato, tid og hvem der fangede den
  - vandtype og **fiskepladser** (kryds af blandt gemte pladser eller tilføj nye) + GPS-position
  - **fanget på/med**: afkrydsning af agn/grej (blink, wobler, flue, orm, majs …) + fri tekst
  - fiskemetode, længde, vægt og om den blev genudsat
  - **billeder** (komprimeres automatisk)
  - **fri beskrivelse**
- Søg og filtrér på vandtype, gruppe og fanget/mangler
- **Kort (OpenStreetMap)**: alle fangster og pladser som nåle på et kort; filtrér på art, og tryk på en nål for at se fangsten
- Vælg en fangsts eller plads' position ved at **trykke på kortet** eller med **Min position** (GPS)
- Oversigt over pladser og hvilke arter der er fanget hvor
- Statistik
- **Backup**: eksportér/importér alt (inkl. billeder) som én fil – også til at dele med fiskemakkeren
- Virker **offline** og kan installeres på telefonens hjemmeskærm (PWA)

## Tegninger
70 af de 73 arter har en klassisk, håndkoloreret tegning, primært fra Marcus Elieser Blochs
*Ichthyologie* (1785–97) og suppleret med Couch, Denton, Donovan, Meyer og Cuvier & Valenciennes.
Alle er **public domain** og hentet fra Wikimedia Commons. Kilden til hver tegning står i appen
(under arten og under *Mere → Billedkilder*) og i `js/illustrations.js`.

Billederne er beskåret og renset for tekst, og papirfarven er ensrettet med `tools/cutout.py`.
Udsnittene står i `tools/mapping.py`. Regnløje, havkarusse og sortmundet kutling mangler stadig en
fri tegning og vises med en silhuet.

## Kort
Kortet bruger [Leaflet](https://leafletjs.com) (lagt i `vendor/leaflet`, BSD-2-licens) og kortfliser fra
[OpenStreetMap](https://www.openstreetmap.org/copyright). Kortfliserne kræver internet. Resten af appen virker offline.

## Data
Alt gemmes lokalt i browseren på enheden (IndexedDB). Der er ingen server. Brug *Mere → Eksportér backup* jævnligt.

## Kør lokalt
Det er en ren statisk side uden byggetrin:

```bash
python3 -m http.server 8000
```

Åbn http://localhost:8000.

## Udgiv gratis på GitHub Pages
Repository → *Settings* → *Pages* → *Deploy from a branch* → vælg branch og mappen `/ (root)`.
Åbn derefter adressen på telefonen og vælg *Føj til hjemmeskærm*.

## Tilføj eller ret arter
Rediger `js/species.js`. Hver art har et unikt `id` – ændr ikke et `id` for en art, der allerede har registrerede fangster.
