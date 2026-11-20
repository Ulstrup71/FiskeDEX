// Fredningstider og mindstemål for lyst- og fritidsfiskeri i Danmark.
//
// Kilder (tjekket 20. november 2026):
//  - Miljøstyrelsen: "Mindstemål og fredningstider"
//    https://mst.dk/borger/lyst-og-fritidsfiskeri/mindstemaal-og-fredningstider
//  - Miljøstyrelsen: "Fredning og mindstemål i saltvand – gældende fra 01.01.2026" (PDF)
//  - Miljøstyrelsen: "Fredning og mindstemål i ferskvand" (PDF, BEK nr 1198 af 07/06/2021)
//  - BEK nr 1198 af 07/06/2021 (ferskvand), BEK nr 1673 af 10/12/2025 (gedde/aborre ved
//    Sydsjælland, Møn, Lolland og Falster), BEK nr 486 af 15/05/2025 og Rådets forordning
//    (EU) 2026/249 (ål).
//
// Reglerne ændres jævnligt, og der kan gælde lokale regler (fredningsbælter ved
// å-udløb, regler for det enkelte fiskevand m.m.). Opdatér denne fil, når reglerne ændres.
//
// Format pr. art og vandtype ("fersk"/"salt"):
//   fred: [{ text, from: [md, dag], to: [md, dag], where?, onlyColored? } | { text, all: true, where? }]
//   min:  "40 cm" eller [{ cm, where }]
//   note: ekstra tekst
// Arter der ikke står her, har ingen generel fredningstid eller mindstemål.

export const RULES_CHECKED = "20. november 2026";
export const RULES_SOURCE = "https://mst.dk/borger/lyst-og-fritidsfiskeri/mindstemaal-og-fredningstider";

const SALMON_SALT_FRED = [
  { text: "16. november – 15. januar (fisk i gydedragt)", from: [11, 16], to: [1, 15], onlyColored: true, where: "Overalt" },
  { text: "15. september – 28./29. februar", from: [9, 15], to: [2, 29], where: "Vadehavet" },
];
const FRESH_TROUT_FRED = [{ text: "16. november – 28./29. februar", from: [11, 16], to: [2, 29] }];

export const RULES = {
  gedde: {
    fersk: { fred: [{ text: "15. marts – 30. april", from: [3, 15], to: [4, 30] }], min: "60 cm" },
    salt: { fred: [{ text: "1. april – 15. maj", from: [4, 1], to: [5, 15], where: "Overalt" }], min: "60 cm" },
    note: "I visse salt- og ferskvandsområder ved Sydsjælland, Møn, Lolland og Falster må gedder slet ikke landes (skal genudsættes). Se BEK nr 1673 af 10/12/2025.",
  },
  aborre: {
    fersk: { min: "Intet generelt mindstemål" },
    salt: { min: "20 cm" },
    note: "Ved Sydsjælland, Møn, Lolland og Falster gælder i visse salt- og ferskvandsområder et mindstemål på 24 cm og et maksimumsmål på 30 cm. I visse ferskvandsområder dér må aborrer ikke landes 1. marts – 30. april (BEK nr 1673 af 10/12/2025).",
  },
  sandart: {
    fersk: { fred: [{ text: "1. maj – 31. maj", from: [5, 1], to: [5, 31] }], min: "50 cm" },
  },
  havorred: {
    fersk: { fred: FRESH_TROUT_FRED, min: "40 cm" },
    salt: { fred: SALMON_SALT_FRED, min: "40 cm" },
    totalFredet: "Havørred (og alle ørredarter) er totalfredet hele året i Ringkøbing, Nissum og Stadil Fjorde og Von Å.",
    note: "I saltvand må du i fredningstiden kun tage helt blanke fisk med løse skæl med hjem – farvede fisk skal straks genudsættes nænsomt. Omkring Bornholm er farvet havørred fredet 15. september – 28./29. februar, også i de bornholmske vandløb.",
  },
  baekorred: {
    fersk: { fred: FRESH_TROUT_FRED, min: "30 cm" },
    totalFredet: "Alle ørredarter er fredet hele året i Ringkøbing og Stadil Fjord samt Von Å.",
  },
  soorred: {
    fersk: { fred: FRESH_TROUT_FRED, min: "40 cm" },
  },
  laks: {
    fersk: { fred: FRESH_TROUT_FRED, min: "40 cm" },
    salt: { fred: SALMON_SALT_FRED, min: "60 cm" },
    totalFredet: "Laks er totalfredet hele året i Vadehavet nord for Låningsvejen til Mandø, i Ringkøbing, Nissum og Stadil Fjorde og Von Å.",
    note: "I Østersøen (underområde 22–31) må højst én fedtfinneklippet (udsat) laks pr. person pr. dag hjemtages, og den skal tages hele med hjem. I fredningstiden i saltvand må kun helt blanke fisk tages med hjem.",
  },
  stalling: {
    fersk: { fred: [{ text: "15. marts – 15. maj", from: [3, 15], to: [5, 15] }], min: "33 cm" },
    note: "Stalling var fredet hele året til og med 15. maj 2026. Fra 16. maj 2026 gælder fredningstid 15. marts – 15. maj og mindstemål 33 cm.",
  },
  helt: {
    fersk: { fred: [{ text: "1. november – 31. januar", from: [11, 1], to: [1, 31] }], min: "36 cm" },
    salt: {
      fred: [
        { text: "1. november – 31. januar", from: [11, 1], to: [1, 31], where: "Overalt" },
        { text: "1. oktober – 31. marts", from: [10, 1], to: [3, 31], where: "Nissum Fjord" },
        { text: "1. november – 28./29. februar", from: [11, 1], to: [2, 29], where: "Ringkøbing og Stadil Fjord" },
      ],
      min: [{ cm: "36 cm", where: "Alle farvande" }, { cm: "34 cm", where: "Ringkøbing Fjord" }],
    },
  },
  snaebel: {
    fersk: { fred: [{ text: "Fredet hele året", all: true }] },
    salt: { fred: [{ text: "Fredet hele året", all: true }] },
    totalFredet: "Snæbel er totalfredet – alle fangede snæbler skal genudsættes.",
  },
  stenbider: {
    fersk: { fred: [{ text: "Fredet hele året", all: true }] },
    salt: { fred: [{ text: "Fredet hele året", all: true }] },
    totalFredet: "Stenbider er fredet hele året i både salt- og ferskvand.",
  },
  aal: {
    fersk: { min: "45 cm", note: "Ingen generel fredningstid, men ruser må ikke bruges i ferskvand 16. oktober – 31. juli." },
    salt: { fred: [{ text: "Rekreativt fiskeri forbudt 2026–2028", all: true, where: "Overalt" }], min: [{ cm: "40 cm", where: "Alle farvande" }, { cm: "38 cm", where: "Ringkøbing/Nissum/Stadil Fjord, Roskilde Fjord og Isefjord" }] },
    note: "Rekreativt fiskeri efter europæisk ål i saltvand er forbudt i 2026, 2027 og 2028 (Rådets forordning (EU) 2026/249 og BEK nr 486 af 15/05/2025). Mindstemålene i saltvand er derfor kun relevante, hvis forbuddet ophæves.",
  },
  torsk: {
    salt: {
      fred: [{ text: "Fiskeri forbudt i hele 2026", all: true, where: "Vestlige Østersø (underområde 22–24)" }],
      min: [{ cm: "35 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }, { cm: "30 cm", where: "Skagerrak og Kattegat" }, { cm: "35 cm", where: "Bælterne og Østersøen" }],
    },
    note: "Rekreativt torskefiskeri er forbudt i Østersøen (underområde 22–32) i 2026. Torsk fanget utilsigtet skal straks genudsættes. Ingen fredningstid i Nordsøen, Skagerrak og Kattegat.",
  },
  hvilling: { salt: { min: [{ cm: "27 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }, { cm: "23 cm", where: "Skagerrak og Kattegat" }] } },
  lubbe: { salt: { min: [{ cm: "30 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }] } },
  sej: { salt: { min: [{ cm: "35 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }, { cm: "30 cm", where: "Skagerrak og Kattegat" }] } },
  makrel: { salt: { min: [{ cm: "30 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }, { cm: "20 cm", where: "Skagerrak og Kattegat" }] } },
  sild: { salt: { min: [{ cm: "20 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }, { cm: "18 cm", where: "Skagerrak og Kattegat" }] } },
  rodspaette: { salt: { min: [{ cm: "27 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }, { cm: "27 cm", where: "Skagerrak og Kattegat" }, { cm: "25 cm", where: "Bælterne og Østersøen" }] } },
  skrubbe: { salt: { min: [{ cm: "23 cm", where: "Bælterne og Østersøen, underområde 22–25" }, { cm: "21 cm", where: "Underområde 26–28" }, { cm: "18 cm", where: "Underområde 29–32" }] } },
  pighvar: { salt: { min: [{ cm: "30 cm", where: "Bælterne og Østersøen" }] } },
  slethvar: { salt: { min: [{ cm: "30 cm", where: "Bælterne og Østersøen" }] } },
  tunge: { salt: { min: [{ cm: "24 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }, { cm: "24 cm", where: "Skagerrak og Kattegat" }] } },
  havbars: {
    salt: {
      fred: [{ text: "Kun catch & release i februar og marts", from: [2, 1], to: [3, 31], where: "Nordsøen syd for Hanstholm" }],
      min: [{ cm: "42 cm", where: "Nordsøen, Limfjorden og Ringkøbing Fjord" }, { cm: "42 cm", where: "Skagerrak og Kattegat" }],
    },
    note: "I Nordsøen syd for Hanstholm (ICES IVb) må lystfiskere højst hjemtage 3 havbars pr. person pr. dag i januar og 1. april – 31. december. Resten af året er der kun catch & release, med stang eller håndline.",
  },
  hornfisk: { salt: { min: "Intet mindstemål" } },
  regnbueorred: { fersk: { min: "Intet mindstemål" }, salt: { min: "Intet mindstemål" } },
};

const md = (m, d) => m * 100 + d;

function inPeriod(p, date) {
  if (p.all) return true;
  const v = md(date.getMonth() + 1, date.getDate());
  const a = md(...p.from);
  const b = md(...p.to);
  return a <= b ? v >= a && v <= b : v >= a || v <= b; // over nytår
}

/**
 * Er arten i fredningstid i dag? Returnerer en liste af {water, text, where, onlyColored}
 * for de perioder, der gælder lige nu.
 */
export function closedNow(id, date = new Date()) {
  const r = RULES[id];
  if (!r) return [];
  const out = [];
  for (const water of ["fersk", "salt"]) {
    for (const p of r[water]?.fred || []) {
      if (inPeriod(p, date)) out.push({ water, ...p });
    }
  }
  return out;
}

/** Mindstemål (cm, som tal) for en art i en given vandtype: fjord = salt, sø/å = fersk. */
export function minSizeFor(id, habitat) {
  const r = RULES[id];
  if (!r) return null;
  const w = habitat === "fjord" ? r.salt : habitat ? r.fersk : (r.fersk || r.salt);
  const m = w?.min;
  if (!m) return null;
  const first = Array.isArray(m) ? m[0].cm : m;
  const n = parseFloat(first);
  return Number.isFinite(n) ? { cm: n, text: Array.isArray(m) ? m.map((x) => `${x.cm} (${x.where})`).join(", ") : m, varies: Array.isArray(m) && new Set(m.map((x) => x.cm)).size > 1 } : null;
}
