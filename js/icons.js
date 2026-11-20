// Enkle streg-ikoner (24x24, stroke = currentColor).
const svg = (body, extra = "") =>
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${body}</svg>`;

export const ICONS = {
  menu: svg('<path d="M4 7h16M4 12h10M4 17h16"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  filter: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  share: svg('<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  book: svg('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 7h6"/>'),
  map: svg('<path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2z"/><path d="M9 4v14M15 6v14"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  fish: svg('<path d="M3 12c3-4.5 9-6 13-3l4-3v12l-4-3c-4 3-10 1.5-13-3z"/><circle cx="8" cy="11" r=".8" fill="currentColor"/>'),
  hook: svg('<circle cx="15" cy="4" r="1.6"/><path d="M15 5.6V14a5 5 0 0 1-10 0v-2.5"/><path d="m5 11.5 2.6 2.4"/>'),
  calendar: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  ruler: svg('<path d="m3 17 14-14 4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  water: svg('<path d="M2 9c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1M2 15c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1"/>'),
  lake: svg('<ellipse cx="12" cy="14" rx="9" ry="5"/><path d="M7 14c2-1.2 4-1.2 6 0s4 1.2 6 0"/>'),
  river: svg('<path d="M7 3c4 3-4 6 0 9s-4 6 0 9M15 3c4 3-4 6 0 9s-4 6 0 9"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  locate: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
};

// Gruppe-ikoner til kategori-rækken (streg-tegnede fiskeformer)
export const GROUP_ICONS = {
  "": svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  "Rovfisk": svg('<path d="M2 12.5c2-2.5 6-3.5 11-3 2.5.3 4.5 1.3 6 2.5l3-2.5v7l-3-2.5c-1.5 1.2-3.5 2-6 2.2-5 .4-9-1-11-3.7z"/><path d="M2 12.5h4"/><path d="M11 9.5 12 7l3 2.3M13 15l1 2.2"/><circle cx="5.5" cy="11.3" r=".7" fill="currentColor"/>'),
  "Laksefisk": svg('<path d="M3 12c2.5-3 7-4.5 11-3.5 1.8.4 3.3 1.3 4.5 2.3L21.5 8v8l-3-2.8c-1.2 1-2.7 1.9-4.5 2.3-4 1-8.5-.5-11-3.5z"/><path d="M10 8.7 11.5 6l2.5 2.6"/><path d="M15.5 9.2v.6"/><circle cx="6.5" cy="11.2" r=".7" fill="currentColor"/><path d="M9 12.5h.01M12 11.5h.01M13 13.5h.01"/>'),
  "Fredfisk": svg('<path d="M3 12c2-4 6.5-6 10.5-5.2 2 .4 3.6 1.6 4.8 3L21.5 7v10l-3.2-2.8c-1.2 1.4-2.8 2.6-4.8 3C9.5 18 5 16 3 12z"/><path d="M9 7.3 11 4.5l3 2.4"/><circle cx="7" cy="11" r=".7" fill="currentColor"/><path d="M8.5 13.5c1.5 1 3 1 4.5 0"/>'),
  "Småfisk": svg('<path d="M6 12c1.5-2 4-3 6.5-2.5 1.2.2 2.2.9 3 1.6L18 9.5v5l-2.5-1.6c-.8.7-1.8 1.4-3 1.6C9.9 15 7.5 14 6 12z"/><circle cx="8.6" cy="11.4" r=".6" fill="currentColor"/><path d="M10 8.6V7M12 8.4V6.8M14 8.8V7.3"/>'),
  "Ål og lampretter": svg('<path d="M2.5 13c2-3 4-3 6 0s4 3 6 0 4-3 5.5-1l1.5 1.5"/><circle cx="4.2" cy="12" r=".6" fill="currentColor"/>'),
  "Sildefisk": svg('<path d="M3 12c2.5-2.5 7-3.5 11-2.8 1.8.3 3.3 1 4.5 1.8L21.5 9v6l-3-2c-1.2.8-2.7 1.5-4.5 1.8C10 15.5 5.5 14.5 3 12z"/><path d="M11 9.3 12 7.5l1.6 1.7"/><circle cx="6.3" cy="11.4" r=".6" fill="currentColor"/><path d="M8 12.6c3 .8 6 .8 9-.3"/>'),
  "Fladfisk": svg('<path d="M3 12c0-4 4.5-6.5 9-6.5S19 8 19 12s-2.5 6.5-7 6.5S3 16 3 12z"/><path d="M19 12l2.5-2.5v5z"/><circle cx="7" cy="10" r=".7" fill="currentColor"/><circle cx="8" cy="8.6" r=".7" fill="currentColor"/><path d="M11 11h.01M14 13h.01M13 9.5h.01M10.5 14h.01"/>'),
  "Torskefisk": svg('<path d="M2.5 12c2-3 6-4.5 10.5-4 2.5.3 4.5 1.5 6 3l2.5-2v6l-2.5-2c-1.5 1.5-3.5 2.6-6 3-4.5.5-8.5-1-10.5-4z"/><path d="M8 8.2 9 6l2 2M12 8l1-2 2 2.3M10 15.6l1 2"/><path d="M4.5 13.5 4 15"/><circle cx="5.8" cy="11" r=".7" fill="currentColor"/>'),
  "Kystfisk": svg('<path d="M3 12c1.5-3.5 5.5-5.5 9.5-5 2.3.3 4.2 1.6 5.5 3.2L21 8v8l-3-2.2c-1.3 1.6-3.2 2.9-5.5 3.2-4 .5-8-1.5-9.5-5z"/><path d="M7.5 7.5 9 5l1.5 2M10.5 7 12 4.8 13.5 7M13.5 7.2 15 5.3l1 2"/><circle cx="6.5" cy="11" r=".7" fill="currentColor"/>'),
};

// Erstatter <i data-icon="navn"></i> med SVG
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    if (el.dataset.hydrated) return;
    el.innerHTML = ICONS[el.dataset.icon] || "";
    el.dataset.hydrated = "1";
  });
}
