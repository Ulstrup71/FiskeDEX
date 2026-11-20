import { SPECIES, HABITATS, GROUP_COLORS, BAIT_OPTIONS, METHOD_OPTIONS } from "./species.js";
import { db, uid, compressImage, blobToDataURL, dataURLToBlob } from "./db.js";
import { ILLUSTRATIONS } from "./illustrations.js";
import { pickLocation, myPosition, showMainMap, setMainMarkers, focusMain, locateOnMain, osmLink, fmtPos } from "./map.js";

// ---------- State ----------
const state = {
  catches: [],
  spots: [],
  marks: new Set(),      // arter manuelt krydset af som fanget
  photoMeta: new Map(),  // photoId -> catchId
  filters: { q: "", habitat: "", status: "", group: "" },
};
const speciesById = Object.fromEntries(SPECIES.map((s, i) => [s.id, { ...s, num: i + 1 }]));
const urlCache = new Map(); // photoId -> objectURL

// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (d) => d ? new Date(d + "T00:00").toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" }) : "";
const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2400);
}

function fishSVG(color = "#1d6b72") {
  return `<svg viewBox="0 0 200 100" aria-hidden="true">
    <path fill="${color}" d="M18 50c22-30 70-40 108-30 14 4 26 12 34 20l26-22c4-3 8 0 7 4l-8 28 8 28c1 4-3 7-7 4l-26-22c-8 8-20 16-34 20-38 10-86 0-108-30z"/>
    <path fill="${color}" opacity=".7" d="M78 22c10-12 26-16 38-14-4 6-6 12-6 16zM84 78c8 8 20 12 30 10-4-4-6-9-6-13z"/>
    <circle cx="44" cy="44" r="6" fill="#fff"/><circle cx="43" cy="44" r="3" fill="#13262b"/>
    <path d="M60 36c6 8 6 20 0 28" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// Tegning af arten (fra js/illustrations.js) – ellers en simpel silhuet.
function fishArt(s, cls = "") {
  const il = ILLUSTRATIONS[s.id];
  return il
    ? `<img class="fish-art ${cls}" src="img/fish/${il.file}" alt="Tegning af ${esc(s.name)}" loading="lazy">`
    : fishSVG(GROUP_COLORS[s.group]);
}

function photoURL(id) {
  return urlCache.get(id);
}

async function loadPhotoURL(id) {
  if (urlCache.has(id)) return urlCache.get(id);
  const p = await db.get("photos", id);
  if (!p) return null;
  const url = URL.createObjectURL(p.blob);
  urlCache.set(id, url);
  return url;
}

function catchesFor(speciesId) {
  return state.catches.filter((c) => c.speciesId === speciesId).sort(sortCatches);
}
function sortCatches(a, b) {
  return (b.date + (b.time || "")).localeCompare(a.date + (a.time || ""));
}
function isCaught(speciesId) {
  return state.marks.has(speciesId) || state.catches.some((c) => c.speciesId === speciesId);
}
function spotName(id) {
  return state.spots.find((s) => s.id === id)?.name ?? "(slettet plads)";
}

// ---------- Load ----------
async function loadAll() {
  const [catches, spots, marks] = await Promise.all([db.all("catches"), db.all("spots"), db.all("marks")]);
  state.catches = catches;
  state.spots = spots.sort((a, b) => a.name.localeCompare(b.name, "da"));
  state.marks = new Set(marks.map((m) => m.speciesId));
  // Forudindlæs billed-URL'er for alle fangster (de er komprimerede, så det går hurtigt)
  const ids = catches.flatMap((c) => c.photoIds || []);
  await Promise.all(ids.map(loadPhotoURL));
}

// ---------- Render: header ----------
function renderProgress() {
  const caught = SPECIES.filter((s) => isCaught(s.id)).length;
  $("#caughtCount").textContent = caught;
  $("#totalCount").textContent = SPECIES.length;
  $("#progressFill").style.width = `${(caught / SPECIES.length) * 100}%`;

  // Hero: seneste fangst – eller et forslag til næste art at gå efter
  const latest = [...state.catches].sort(sortCatches)[0];
  let s, text;
  if (latest && speciesById[latest.speciesId]) {
    s = speciesById[latest.speciesId];
    text = `Seneste fangst: <b>${esc(s.name)}</b> · ${fmtDate(latest.date)}`;
  } else {
    const missing = SPECIES.filter((x) => !isCaught(x.id) && ILLUSTRATIONS[x.id]);
    s = missing[new Date().getDate() % Math.max(missing.length, 1)] || SPECIES[0];
    text = `Næste mål? <b>${esc(s.name)}</b>`;
  }
  $("#heroLatest").innerHTML = text;
  $("#heroArt").innerHTML = fishArt(s, "hero-img");
  $("#heroArt").dataset.id = s.id;
}

// ---------- Render: species grid ----------
function renderGrid() {
  const { q, habitat, status, group } = state.filters;
  const needle = q.trim().toLowerCase();
  const list = SPECIES.filter((s) => {
    if (needle && !(s.name.toLowerCase().includes(needle) || s.latin.toLowerCase().includes(needle))) return false;
    if (habitat && !s.habitats.includes(habitat)) return false;
    if (group && s.group !== group) return false;
    const c = isCaught(s.id);
    if (status === "caught" && !c) return false;
    if (status === "missing" && c) return false;
    return true;
  });

  const grid = $("#speciesGrid");
  if (!list.length) {
    grid.innerHTML = `<p class="empty">Ingen arter matcher filteret.</p>`;
    return;
  }
  grid.innerHTML = list.map((s) => {
    const sp = speciesById[s.id];
    const cs = catchesFor(s.id);
    const caught = isCaught(s.id);
    const thumb = fishArt(s);
    return `<article class="fish-card ${caught ? "caught" : ""}" data-id="${s.id}" tabindex="0" role="button" aria-label="${esc(s.name)}">
      <button class="quick-check" data-quick="${s.id}" title="${caught ? "Fanget" : "Markér som fanget"}" aria-pressed="${caught}">${caught ? "✔" : ""}</button>
      ${cs.length ? `<span class="badge">${cs.length}×</span>` : ""}
      <div class="thumb">${thumb}</div>
      <div class="body">
        <div class="num">#${String(sp.num).padStart(2, "0")} · ${esc(s.group)}</div>
        <div class="name">${esc(s.name)}</div>
        <div class="latin">${esc(s.latin)}</div>
        <div class="habs">${s.habitats.map((h) => `<span title="${HABITATS[h].label}">${HABITATS[h].icon}</span>`).join(" ")}</div>
      </div>
    </article>`;
  }).join("");
}

// ---------- Species detail ----------
let currentSpecies = null;

function openSpecies(id) {
  currentSpecies = id;
  renderSpeciesDetail();
  const dlg = $("#speciesDialog");
  if (!dlg.open) dlg.showModal();
}

function renderSpeciesDetail() {
  const s = speciesById[currentSpecies];
  if (!s) return;
  const cs = catchesFor(s.id);
  const caught = isCaught(s.id);
  const fromCatches = cs.length > 0;
  const allPhotos = cs.flatMap((c) => c.photoIds || []);
  const biggest = cs.reduce((m, c) => (Number(c.length) > Number(m?.length || 0) ? c : m), null);

  $("#speciesDetail").innerHTML = `
    <div class="sheet-head">
      <div class="detail-title">
        <h2>${esc(s.name)}</h2>
        <div class="latin">${esc(s.latin)}</div>
      </div>
      <button class="icon-btn" data-close aria-label="Luk">✕</button>
    </div>
    <figure class="detail-hero">${fishArt(s, "big")}
      ${ILLUSTRATIONS[s.id] ? `<figcaption>${esc(ILLUSTRATIONS[s.id].credit)} · <a href="${esc(ILLUSTRATIONS[s.id].source)}" target="_blank" rel="noopener">kilde</a></figcaption>` : ""}
    </figure>
    ${allPhotos.length ? `<div class="photos-row big">${allPhotos.map((p) => photoURL(p) ? `<img src="${photoURL(p)}" data-photo="${p}" alt="Eget billede">` : "").join("")}</div>` : ""}
    <div class="tags">
      <span class="tag">#${String(s.num).padStart(2, "0")}</span>
      <span class="tag" style="border-color:${GROUP_COLORS[s.group]}">${esc(s.group)}</span>
      ${s.habitats.map((h) => `<span class="tag">${HABITATS[h].icon} ${HABITATS[h].label}</span>`).join("")}
    </div>
    <p>${esc(s.desc)}</p>

    <div class="caught-toggle">
      <label class="check">
        <input type="checkbox" id="caughtToggle" ${caught ? "checked" : ""} ${fromCatches ? "disabled" : ""}>
        Vi har fanget denne art
      </label>
      ${fromCatches
        ? `<p class="muted small" style="margin:6px 0 0">${cs.length} fangst${cs.length > 1 ? "er" : ""} registreret${biggest?.length ? ` · største: ${esc(biggest.length)} cm` : ""}.</p>`
        : `<p class="muted small" style="margin:6px 0 0">Kryds af, eller registrér en fangst med plads, agn og billeder herunder.</p>`}
    </div>

    <div class="section-head">
      <h3>Fangster</h3>
      <button class="btn primary small" id="addCatchForSpecies">+ Registrér fangst</button>
    </div>
    <div class="catch-list">${cs.length ? cs.map(catchItemHTML).join("") : `<p class="empty">Ingen fangster endnu.</p>`}</div>
  `;
}

function catchItemHTML(c) {
  const s = speciesById[c.speciesId];
  const photos = c.photoIds || [];
  const first = photos[0] && photoURL(photos[0]);
  const where = [
    c.habitat ? `${HABITATS[c.habitat].icon} ${HABITATS[c.habitat].label}` : "",
    ...(c.spotIds || []).map(spotName),
  ].filter(Boolean).join(" · ");
  const bait = [...(c.baits || []), c.baitOther].filter(Boolean).join(", ");
  const size = [c.length ? `${c.length} cm` : "", c.weight ? `${c.weight} kg` : ""].filter(Boolean).join(" / ");
  return `<div class="catch-item" data-catch="${c.id}">
    <div class="cthumb ${first ? "" : "art"}">${first ? `<img src="${first}" alt="">` : (s ? fishArt(s) : fishSVG())}</div>
    <div>
      <h4>${esc(s?.name ?? "Ukendt art")}${size ? ` <span class="muted small">· ${esc(size)}</span>` : ""}${c.released ? ` <span class="tag">genudsat</span>` : ""}</h4>
      <div class="meta">${fmtDate(c.date)}${c.time ? " kl. " + esc(c.time) : ""}${c.angler ? " · " + esc(c.angler) : ""}</div>
      ${where || c.gps ? `<div class="meta">📍 ${esc(where)}${c.gps ? `${where ? " · " : ""}<a href="#" data-show-map="${c.gps.lat},${c.gps.lng}">vis på kort</a>` : ""}</div>` : ""}
      ${bait ? `<div class="meta">🎣 ${esc(bait)}${c.methods?.length ? " (" + esc(c.methods.join(", ")) + ")" : ""}</div>` : (c.methods?.length ? `<div class="meta">🎣 ${esc(c.methods.join(", "))}</div>` : "")}
      ${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ""}
      ${photos.length > 1 ? `<div class="photos-row">${photos.map((p) => photoURL(p) ? `<img src="${photoURL(p)}" data-photo="${p}" alt="">` : "").join("")}</div>` : ""}
    </div>
  </div>`;
}

// ---------- Catch list ----------
function renderCatchList() {
  const list = [...state.catches].sort(sortCatches);
  $("#catchList").innerHTML = list.length
    ? list.map(catchItemHTML).join("")
    : `<p class="empty">Ingen fangster endnu.<br>Tryk på <b>+ Ny fangst</b> eller vælg en art under <b>Arter</b>.</p>`;
}

// ---------- Spots ----------
function renderSpots() {
  const el = $("#spotList");
  if (!state.spots.length) {
    el.innerHTML = `<p class="empty">Ingen pladser endnu. Tilføj dine faste fiskepladser her eller direkte når du registrerer en fangst.</p>`;
    return;
  }
  el.innerHTML = state.spots.map((sp) => {
    const cs = state.catches.filter((c) => (c.spotIds || []).includes(sp.id));
    const species = [...new Set(cs.map((c) => speciesById[c.speciesId]?.name).filter(Boolean))];
    return `<div class="spot-item">
      <div class="info">
        <b>${HABITATS[sp.habitat]?.icon ?? "📍"} ${esc(sp.name)}</b>
        <div class="muted small">${cs.length} fangst${cs.length === 1 ? "" : "er"}${sp.lat ? ` · <a href="#" data-show-map="${sp.lat},${sp.lng}">vis på kort</a>` : " · ingen position"}</div>
        ${species.length ? `<div class="species-list">${esc(species.join(", "))}</div>` : ""}
      </div>
      <button class="btn small" data-place-spot="${sp.id}">${sp.lat ? "Flyt" : "📍 Placér"}</button>
      <button class="btn small" data-rename-spot="${sp.id}">Omdøb</button>
      <button class="btn small danger" data-del-spot="${sp.id}">Slet</button>
    </div>`;
  }).join("");
}

async function addSpot(name, habitat) {
  name = name.trim();
  if (!name) return null;
  const existing = state.spots.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const spot = { id: uid(), name, habitat: habitat || "fjord" };
  await db.put("spots", spot);
  state.spots.push(spot);
  state.spots.sort((a, b) => a.name.localeCompare(b.name, "da"));
  return spot;
}

// ---------- Stats ----------
function renderStats() {
  const cs = state.catches;
  const caught = SPECIES.filter((s) => isCaught(s.id)).length;
  const photos = cs.reduce((n, c) => n + (c.photoIds?.length || 0), 0);
  const perSpecies = {};
  cs.forEach((c) => (perSpecies[c.speciesId] = (perSpecies[c.speciesId] || 0) + 1));
  const top = Object.entries(perSpecies).sort((a, b) => b[1] - a[1])[0];
  const anglers = {};
  cs.forEach((c) => c.angler && (anglers[c.angler] = (anglers[c.angler] || 0) + 1));
  const topAngler = Object.entries(anglers).sort((a, b) => b[1] - a[1])[0];
  const byHab = (h) => SPECIES.filter((s) => s.habitats.includes(h));
  const habStat = (h) => `${byHab(h).filter((s) => isCaught(s.id)).length}/${byHab(h).length}`;
  $("#stats").innerHTML = [
    [caught + "/" + SPECIES.length, "arter fanget"],
    [cs.length, "fangster i alt"],
    [photos, "billeder"],
    [state.spots.length, "pladser"],
    [habStat("fjord"), "🌊 fjordarter"],
    [habStat("so"), "🏞️ søarter"],
    [habStat("aa"), "〰️ åarter"],
    [top ? esc(speciesById[top[0]].name) : "–", "oftest fanget"],
    [topAngler ? esc(topAngler[0]) : "–", "flest fangster"],
  ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");

  if (navigator.storage?.estimate) {
    navigator.storage.estimate().then(({ usage, quota }) => {
      $("#storageInfo").textContent = `Bruger ca. ${(usage / 1e6).toFixed(1)} MB af ${(quota / 1e6).toFixed(0)} MB tilgængelig plads.`;
    });
  }
}

function renderCredits() {
  $("#credits").innerHTML = SPECIES.filter((s) => ILLUSTRATIONS[s.id]).map((s) =>
    `<li><b>${esc(s.name)}</b>: <a href="${esc(ILLUSTRATIONS[s.id].source)}" target="_blank" rel="noopener">${esc(ILLUSTRATIONS[s.id].credit)}</a></li>`).join("");
}

function renderAll() {
  renderProgress();
  renderGrid();
  renderCatchList();
  renderSpots();
  renderStats();
  renderMap();
  if ($("#speciesDialog").open) renderSpeciesDetail();
}

// ---------- Catch form ----------
let editing = null;          // catch object being edited (or null for new)
let formPhotos = [];         // [{id, url, blob?, isNew}]
let removedPhotoIds = [];
let formGPS = null;

function buildStaticFormParts() {
  const sel = $("#catchForm [name=speciesId]");
  sel.innerHTML = [...SPECIES].sort((a, b) => a.name.localeCompare(b.name, "da"))
    .map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");

  $("#baitChecks").innerHTML = Object.entries(BAIT_OPTIONS).map(([grp, items]) => `
    <div class="bait-group"><h4>${esc(grp)}</h4><div class="chips">
      ${items.map((b) => `<label class="chip-check"><input type="checkbox" name="baits" value="${esc(b)}"><span>${esc(b)}</span></label>`).join("")}
    </div></div>`).join("");

  $("#methodChecks").innerHTML = METHOD_OPTIONS.map((m) =>
    `<label class="chip-check"><input type="checkbox" name="methods" value="${esc(m)}"><span>${esc(m)}</span></label>`).join("");
}

function renderSpotChecks(selected = []) {
  const el = $("#spotChecks");
  el.innerHTML = state.spots.length
    ? state.spots.map((sp) => `<label class="chip-check"><input type="checkbox" name="spots" value="${sp.id}" ${selected.includes(sp.id) ? "checked" : ""}><span>${HABITATS[sp.habitat]?.icon ?? ""} ${esc(sp.name)}</span></label>`).join("")
    : `<span class="muted small">Ingen gemte pladser endnu – tilføj en herunder.</span>`;
}

function renderAnglerList() {
  const names = [...new Set(state.catches.map((c) => c.angler).filter(Boolean))];
  $("#anglerList").innerHTML = names.map((n) => `<option value="${esc(n)}">`).join("");
}

function renderFormPhotos() {
  $("#photoEdit").innerHTML = formPhotos.map((p, i) =>
    `<div class="ph"><img src="${p.url}" alt=""><button type="button" class="rm" data-rm-photo="${i}" aria-label="Fjern billede">✕</button></div>`).join("");
}

async function openCatchForm({ speciesId = null, catchId = null } = {}) {
  const form = $("#catchForm");
  form.reset();
  editing = catchId ? state.catches.find((c) => c.id === catchId) : null;
  removedPhotoIds = [];
  formGPS = editing?.gps || null;

  const c = editing || {
    speciesId: speciesId || SPECIES[0].id,
    date: today(),
    time: nowTime(),
    angler: localStorageGet("lastAngler") || "",
    habitat: speciesId ? speciesById[speciesId].habitats[0] : "",
    spotIds: [], baits: [], methods: [], photoIds: [],
  };

  $("#catchFormTitle").textContent = editing ? "Redigér fangst" : "Ny fangst";
  form.speciesId.value = c.speciesId;
  form.date.value = c.date || today();
  form.time.value = c.time || "";
  form.angler.value = c.angler || "";
  $$("input[name=habitat]", form).forEach((r) => (r.checked = r.value === c.habitat));
  $$("input[name=baits]", form).forEach((b) => (b.checked = (c.baits || []).includes(b.value)));
  $$("input[name=methods]", form).forEach((m) => (m.checked = (c.methods || []).includes(m.value)));
  form.baitOther.value = c.baitOther || "";
  form.length.value = c.length || "";
  form.weight.value = c.weight || "";
  form.released.checked = !!c.released;
  form.notes.value = c.notes || "";
  renderSpotChecks(c.spotIds || []);
  renderAnglerList();
  setFormPos(formGPS);

  formPhotos = [];
  for (const id of c.photoIds || []) {
    const url = await loadPhotoURL(id);
    if (url) formPhotos.push({ id, url, isNew: false });
  }
  renderFormPhotos();
  $("#deleteCatchBtn").hidden = !editing;
  $("#catchDialog").showModal();
}

function setFormPos(p) {
  formGPS = p || null;
  $("#gpsText").innerHTML = formGPS
    ? `${fmtPos(formGPS)} · <a href="${osmLink(formGPS.lat, formGPS.lng)}" target="_blank" rel="noopener">OpenStreetMap</a>`
    : "Ingen position valgt";
  $("#clearPosBtn").hidden = !formGPS;
}

function selectedSpotPos() {
  const ids = $$("#spotChecks input:checked").map((x) => x.value);
  const sp = state.spots.find((s) => ids.includes(s.id) && s.lat);
  return sp ? { lat: sp.lat, lng: sp.lng } : null;
}

function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }

async function saveCatch(e) {
  e.preventDefault();
  const form = $("#catchForm");
  const fd = new FormData(form);
  const id = editing?.id || uid();

  // Gem nye billeder
  const photoIds = [];
  for (const p of formPhotos) {
    if (p.isNew) {
      await db.put("photos", { id: p.id, catchId: id, blob: p.blob });
      urlCache.set(p.id, p.url);
    }
    photoIds.push(p.id);
  }
  for (const pid of removedPhotoIds) {
    await db.del("photos", pid);
    const u = urlCache.get(pid);
    if (u) URL.revokeObjectURL(u);
    urlCache.delete(pid);
  }

  const c = {
    id,
    speciesId: fd.get("speciesId"),
    date: fd.get("date"),
    time: fd.get("time") || "",
    angler: (fd.get("angler") || "").trim(),
    habitat: fd.get("habitat") || "",
    spotIds: fd.getAll("spots"),
    gps: formGPS,
    baits: fd.getAll("baits"),
    baitOther: (fd.get("baitOther") || "").trim(),
    methods: fd.getAll("methods"),
    length: fd.get("length") || "",
    weight: fd.get("weight") || "",
    released: form.released.checked,
    notes: (fd.get("notes") || "").trim(),
    photoIds,
    created: editing?.created || Date.now(),
    updated: Date.now(),
  };
  await db.put("catches", c);
  if (c.gps) {
    for (const sp of state.spots.filter((x) => c.spotIds.includes(x.id) && !x.lat)) {
      sp.lat = c.gps.lat; sp.lng = c.gps.lng;
      await db.put("spots", sp);
    }
  }
  if (c.angler) localStorageSet("lastAngler", c.angler);

  const idx = state.catches.findIndex((x) => x.id === id);
  if (idx >= 0) state.catches[idx] = c; else state.catches.push(c);

  formPhotos = [];
  $("#catchDialog").close();
  renderAll();
  toast(editing ? "Fangst opdateret" : `${speciesById[c.speciesId].name} registreret! 🎣`);
  editing = null;
}

async function deleteCatch() {
  if (!editing || !confirm("Slet denne fangst og dens billeder?")) return;
  for (const pid of editing.photoIds || []) {
    await db.del("photos", pid);
    urlCache.delete(pid);
  }
  await db.del("catches", editing.id);
  state.catches = state.catches.filter((c) => c.id !== editing.id);
  editing = null;
  $("#catchDialog").close();
  renderAll();
  toast("Fangst slettet");
}

async function addPhotos(files) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    try {
      const blob = await compressImage(file);
      formPhotos.push({ id: uid(), blob, url: URL.createObjectURL(blob), isNew: true });
    } catch (err) {
      console.error(err);
      toast("Kunne ikke læse et af billederne");
    }
  }
  renderFormPhotos();
}

// ---------- Backup ----------
async function exportBackup() {
  toast("Forbereder backup…");
  const photos = await db.all("photos");
  const data = {
    app: "FiskeDEX",
    version: 1,
    exported: new Date().toISOString(),
    catches: state.catches,
    spots: state.spots,
    marks: [...state.marks],
    photos: await Promise.all(photos.map(async (p) => ({ id: p.id, catchId: p.catchId, data: await blobToDataURL(p.blob) }))),
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fiskedex-backup-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importBackup(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return toast("Filen er ikke en gyldig backup");
  }
  if (data.app !== "FiskeDEX") return toast("Filen er ikke en FiskeDEX-backup");
  const merge = $("#importMerge").checked;
  if (!merge && !confirm("Dette erstatter ALLE nuværende data på enheden. Fortsæt?")) return;
  if (!merge) { await db.clearAll(); urlCache.clear(); }

  for (const s of data.spots || []) await db.put("spots", s);
  for (const m of data.marks || []) await db.put("marks", { speciesId: m });
  for (const p of data.photos || []) await db.put("photos", { id: p.id, catchId: p.catchId, blob: await dataURLToBlob(p.data) });
  for (const c of data.catches || []) await db.put("catches", c);

  await loadAll();
  renderAll();
  toast(`Importeret: ${(data.catches || []).length} fangster, ${(data.photos || []).length} billeder`);
}

// ---------- Events ----------
function bindEvents() {
  // Tabs
  $$(".tab").forEach((t) => t.addEventListener("click", () => switchView(t.dataset.view)));

  // Filters
  $("#search").addEventListener("input", (e) => { state.filters.q = e.target.value; renderGrid(); });
  for (const [id, key] of [["#habitatFilter", "habitat"], ["#statusFilter", "status"]]) {
    $(id).addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      $$(".chip", $(id)).forEach((x) => x.classList.toggle("active", x === b));
      state.filters[key] = b.dataset.value;
      renderGrid();
    });
  }
  const groups = [...new Set(SPECIES.map((s) => s.group))];
  $("#groupFilter").innerHTML += groups.map((g) => `<option>${esc(g)}</option>`).join("");
  $("#groupFilter").addEventListener("change", (e) => { state.filters.group = e.target.value; renderGrid(); });

  $("#heroArt").addEventListener("click", () => openSpecies($("#heroArt").dataset.id));
  $(".brand").addEventListener("click", (e) => { e.preventDefault(); switchView("species"); });
  $("#search").addEventListener("focus", () => { if (!$("#view-species").classList.contains("active")) switchView("species"); });

  // Grid
  $("#speciesGrid").addEventListener("click", async (e) => {
    const quick = e.target.closest("[data-quick]");
    if (quick) {
      e.stopPropagation();
      const id = quick.dataset.quick;
      if (catchesFor(id).length) return openSpecies(id); // styres af fangster
      await toggleMark(id, !state.marks.has(id));
      return;
    }
    const card = e.target.closest(".fish-card");
    if (card) openSpecies(card.dataset.id);
  });
  $("#speciesGrid").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList.contains("fish-card")) openSpecies(e.target.dataset.id);
  });

  // Species dialog
  $("#speciesDialog").addEventListener("click", async (e) => {
    if (e.target === e.currentTarget || e.target.closest("[data-close]")) return $("#speciesDialog").close();
    const ph = e.target.closest("[data-photo]");
    if (ph) return openLightbox(ph.dataset.photo);
    if (e.target.closest("#addCatchForSpecies")) return openCatchForm({ speciesId: currentSpecies });
    const ci = e.target.closest("[data-catch]");
    if (ci) return openCatchForm({ catchId: ci.dataset.catch });
  });
  $("#speciesDialog").addEventListener("change", async (e) => {
    if (e.target.id === "caughtToggle") await toggleMark(currentSpecies, e.target.checked);
  });

  // Catch list
  $("#catchList").addEventListener("click", (e) => {
    const ph = e.target.closest("[data-photo]");
    if (ph) return openLightbox(ph.dataset.photo);
    const ci = e.target.closest("[data-catch]");
    if (ci) openCatchForm({ catchId: ci.dataset.catch });
  });
  $("#newCatchBtn").addEventListener("click", () => openCatchForm());

  // Catch form
  $("#catchForm").addEventListener("submit", saveCatch);
  $("#catchDialog").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) $("#catchDialog").close();
    const rm = e.target.closest("[data-rm-photo]");
    if (rm) {
      const [p] = formPhotos.splice(Number(rm.dataset.rmPhoto), 1);
      if (!p.isNew) removedPhotoIds.push(p.id); else URL.revokeObjectURL(p.url);
      renderFormPhotos();
    }
  });
  $("#catchForm [name=speciesId]").addEventListener("change", (e) => {
    const s = speciesById[e.target.value];
    const checked = $("#catchForm input[name=habitat]:checked");
    if (!checked && s) $$("#catchForm input[name=habitat]").forEach((r) => (r.checked = r.value === s.habitats[0]));
  });
  $("#photoInput").addEventListener("change", async (e) => {
    await addPhotos([...e.target.files]);
    e.target.value = "";
  });
  $("#deleteCatchBtn").addEventListener("click", deleteCatch);
  $("#addSpotInline").addEventListener("click", addSpotInline);
  $("#newSpotName").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addSpotInline(); } });
  $("#gpsBtn").addEventListener("click", async () => {
    $("#gpsText").textContent = "Finder din position…";
    try { setFormPos(await myPosition()); }
    catch (err) { setFormPos(formGPS); toast(err.message); }
  });
  $("#pickMapBtn").addEventListener("click", async () => {
    const p = await pickLocation({ initial: formGPS, hint: selectedSpotPos(), title: "Hvor blev fisken fanget?" });
    if (p) setFormPos(p);
  });
  $("#clearPosBtn").addEventListener("click", () => setFormPos(null));

  // Kort
  $("#mapSpecies").innerHTML += [...SPECIES].sort((a, b) => a.name.localeCompare(b.name, "da"))
    .map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("");
  for (const id of ["#mapSpecies", "#mapShowCatches", "#mapShowSpots"]) $(id).addEventListener("change", () => renderMap(true));
  $("#mapLocate").addEventListener("click", () => locateOnMain().catch((err) => toast(err.message)));
  $("#mainMap").addEventListener("click", (e) => {
    const b = e.target.closest("[data-open-catch]");
    if (b) openCatchForm({ catchId: b.dataset.openCatch });
  });
  // "vis på kort"-links overalt i appen
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-show-map]");
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    const [lat, lng] = a.dataset.showMap.split(",").map(Number);
    $$("dialog[open]").forEach((d) => d.close());
    switchView("map");
    setTimeout(() => focusMain(lat, lng), 60);
  }, true);

  // Spots
  $("#spotForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    await addSpot(f.name.value, f.habitat.value);
    f.reset();
    renderAll();
  });
  $("#spotList").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-del-spot]");
    const ren = e.target.closest("[data-rename-spot]");
    const place = e.target.closest("[data-place-spot]");
    if (place) {
      const sp = state.spots.find((x) => x.id === place.dataset.placeSpot);
      const p = await pickLocation({ initial: sp.lat ? { lat: sp.lat, lng: sp.lng } : null, title: `Placér "${sp.name}"` });
      if (p) { sp.lat = p.lat; sp.lng = p.lng; await db.put("spots", sp); renderAll(); toast("Position gemt"); }
      return;
    }
    if (del) {
      const id = del.dataset.delSpot;
      if (!confirm(`Slet pladsen "${spotName(id)}"? Fangsterne bevares.`)) return;
      await db.del("spots", id);
      state.spots = state.spots.filter((s) => s.id !== id);
      for (const c of state.catches.filter((c) => c.spotIds?.includes(id))) {
        c.spotIds = c.spotIds.filter((x) => x !== id);
        await db.put("catches", c);
      }
      renderAll();
    } else if (ren) {
      const sp = state.spots.find((s) => s.id === ren.dataset.renameSpot);
      const name = prompt("Nyt navn:", sp.name);
      if (name?.trim()) { sp.name = name.trim(); await db.put("spots", sp); renderAll(); }
    }
  });

  // Backup
  $("#exportBtn").addEventListener("click", exportBackup);
  $("#importInput").addEventListener("change", async (e) => {
    if (e.target.files[0]) await importBackup(e.target.files[0]);
    e.target.value = "";
  });
  $("#wipeBtn").addEventListener("click", async () => {
    if (!confirm("Er du sikker? Alle fangster, billeder og pladser slettes permanent.")) return;
    if (!confirm("Helt sikker? Overvej at eksportere en backup først.")) return;
    await db.clearAll();
    urlCache.forEach((u) => URL.revokeObjectURL(u));
    urlCache.clear();
    await loadAll();
    renderAll();
    toast("Alle data slettet");
  });

  // Lightbox
  $("#lightbox").addEventListener("click", () => $("#lightbox").close());
}

function switchView(view) {
  $$(".tab").forEach((x) => x.classList.toggle("active", x.dataset.view === view));
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
  window.scrollTo({ top: 0 });
  if (view === "map") {
    if (typeof L === "undefined") { $("#mapInfo").textContent = "Kortet kunne ikke indlæses."; return; }
    showMainMap($("#mainMap"));
    renderMap();
  }
}

function renderMap(fit = false) {
  if (!$("#view-map").classList.contains("active") || typeof L === "undefined") return;
  const sid = $("#mapSpecies").value;
  const items = [];
  if ($("#mapShowCatches").checked) {
    for (const c of state.catches) {
      if (!c.gps || (sid && c.speciesId !== sid)) continue;
      const s = speciesById[c.speciesId];
      if (!s) continue;
      const ph = (c.photoIds || [])[0];
      const img = ph && photoURL(ph) ? `<img src="${photoURL(ph)}" alt="">`
        : (ILLUSTRATIONS[s.id] ? `<img class="art" src="img/fish/${ILLUSTRATIONS[s.id].file}" alt="">` : "");
      const size = [c.length ? `${c.length} cm` : "", c.weight ? `${c.weight} kg` : ""].filter(Boolean).join(" / ");
      items.push({
        lat: c.gps.lat, lng: c.gps.lng, kind: "catch", label: "🐟", color: GROUP_COLORS[s.group],
        popupHTML: `<div class="map-pop">${img}<b>${esc(s.name)}</b>${size ? ` · ${esc(size)}` : ""}<br>
          <span>${fmtDate(c.date)}${c.angler ? " · " + esc(c.angler) : ""}</span>
          ${(c.spotIds || []).length ? `<br><span>📍 ${esc(c.spotIds.map(spotName).join(", "))}</span>` : ""}
          <br><button class="btn small" data-open-catch="${c.id}">Åbn fangst</button></div>`,
      });
    }
  }
  if ($("#mapShowSpots").checked) {
    for (const sp of state.spots) {
      if (!sp.lat) continue;
      const cs = state.catches.filter((c) => (c.spotIds || []).includes(sp.id) && (!sid || c.speciesId === sid));
      if (sid && !cs.length) continue;
      const names = [...new Set(cs.map((c) => speciesById[c.speciesId]?.name).filter(Boolean))];
      items.push({
        lat: sp.lat, lng: sp.lng, kind: "spot", label: HABITATS[sp.habitat]?.icon || "📍", color: "#0f3b46",
        popupHTML: `<div class="map-pop"><b>${esc(sp.name)}</b><br><span>${cs.length} fangst${cs.length === 1 ? "" : "er"}</span>
          ${names.length ? `<br><span>${esc(names.join(", "))}</span>` : ""}</div>`,
      });
    }
  }
  setMainMarkers(items, { fit });
  const noPos = state.catches.filter((c) => !c.gps).length;
  $("#mapInfo").innerHTML = items.length
    ? `${items.length} på kortet.${noPos ? ` ${noPos} fangst${noPos === 1 ? "" : "er"} har ingen position – åbn dem og tryk <b>Vælg på kort</b>.` : ""}`
    : "Ingen fangster eller pladser med position endnu. Når du registrerer en fangst, så tryk <b>Min position</b> eller <b>Vælg på kort</b>.";
}

async function addSpotInline() {
  const input = $("#newSpotName");
  const habitat = $("#catchForm input[name=habitat]:checked")?.value || "fjord";
  const sp = await addSpot(input.value, habitat);
  if (!sp) return;
  if (formGPS && !sp.lat) { sp.lat = formGPS.lat; sp.lng = formGPS.lng; await db.put("spots", sp); }
  const selected = [...$$("#spotChecks input:checked").map((x) => x.value), sp.id];
  renderSpotChecks(selected);
  input.value = "";
  renderSpots();
}

async function toggleMark(id, on) {
  if (on) { await db.put("marks", { speciesId: id }); state.marks.add(id); }
  else { await db.del("marks", id); state.marks.delete(id); }
  renderAll();
  if (on) toast(`${speciesById[id].name} krydset af ✔`);
}

function openLightbox(photoId) {
  const url = photoURL(photoId);
  if (!url) return;
  $("#lightboxImg").src = url;
  $("#lightbox").showModal();
}

// ---------- Init ----------
async function init() {
  buildStaticFormParts();
  bindEvents();
  renderCredits();
  try {
    await loadAll();
  } catch (err) {
    console.error(err);
    toast("Kunne ikke åbne databasen i denne browser");
  }
  renderAll();
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
