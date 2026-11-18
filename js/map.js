// Kort med OpenStreetMap via Leaflet (vendor/leaflet, indlæst som global `L`).
const DK_CENTER = [56.1, 10.4];
const DK_ZOOM = 7;
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-bidragydere';

export const osmLink = (lat, lng) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

export const fmtPos = (p) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;

function baseMap(el) {
  const map = L.map(el, { zoomControl: true, attributionControl: true }).setView(DK_CENTER, DK_ZOOM);
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
  return map;
}

function myPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("GPS understøttes ikke på denne enhed"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1
        ? "Adgang til position blev afvist. Tillad placering for siden i browserens indstillinger."
        : "Kunne ikke finde din position")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}
export { myPosition };

function pinIcon(color, label, cls = "") {
  if (cls === "spot") {
    // Pladser vises som en firkant lige under punktet, så de ikke dækker fangster samme sted
    return L.divIcon({
      className: "map-pin-wrap",
      html: `<div class="map-pin spot" style="--pin:${color}"><span>${label}</span></div>`,
      iconSize: [28, 28], iconAnchor: [14, -4], popupAnchor: [0, 6],
    });
  }
  return L.divIcon({
    className: "map-pin-wrap",
    html: `<div class="map-pin ${cls}" style="--pin:${color}"><span>${label}</span></div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -32],
  });
}

// ---------- Vælg position (dialog) ----------
let picker = null;

export function pickLocation({ initial = null, hint = null, title = "Vælg position" } = {}) {
  const dlg = document.getElementById("mapPicker");
  document.getElementById("mapPickerTitle").textContent = title;
  dlg.showModal();
  if (!picker) {
    const map = baseMap(document.getElementById("pickerMap"));
    picker = { map, marker: null, value: null };
    map.on("click", (e) => setPick(e.latlng));
  }
  const { map } = picker;
  map.invalidateSize();
  picker.value = null;
  if (picker.marker) { picker.marker.remove(); picker.marker = null; }
  const start = initial || hint;
  if (initial) setPick(initial);
  if (start) map.setView([start.lat, start.lng], 14); else map.setView(DK_CENTER, DK_ZOOM);
  updatePickerText();

  return new Promise((resolve) => {
    const done = (val) => { cleanup(); dlg.close(); resolve(val); };
    const onSave = () => done(picker.value);
    const onCancel = () => done(undefined);
    const onLocate = async () => {
      const t = document.getElementById("mapPickerText");
      t.textContent = "Finder din position…";
      try {
        const p = await myPosition();
        setPick(p);
        map.setView([p.lat, p.lng], 15);
      } catch (err) { t.textContent = err.message; }
    };
    const onEsc = (e) => { e.preventDefault(); onCancel(); };
    const save = document.getElementById("mapPickerSave");
    const cancel = document.getElementById("mapPickerCancel");
    const locate = document.getElementById("mapPickerLocate");
    save.addEventListener("click", onSave);
    cancel.addEventListener("click", onCancel);
    locate.addEventListener("click", onLocate);
    dlg.addEventListener("cancel", onEsc);
    function cleanup() {
      save.removeEventListener("click", onSave);
      cancel.removeEventListener("click", onCancel);
      locate.removeEventListener("click", onLocate);
      dlg.removeEventListener("cancel", onEsc);
    }
    setTimeout(() => map.invalidateSize(), 50);
  });
}

function setPick(latlng) {
  const p = { lat: latlng.lat, lng: latlng.lng };
  picker.value = p;
  if (!picker.marker) {
    picker.marker = L.marker([p.lat, p.lng], { draggable: true, icon: pinIcon("#e0a526", "🎣") }).addTo(picker.map);
    picker.marker.on("dragend", () => setPick(picker.marker.getLatLng()));
  } else {
    picker.marker.setLatLng([p.lat, p.lng]);
  }
  updatePickerText();
}

function updatePickerText() {
  document.getElementById("mapPickerText").textContent = picker.value
    ? `Valgt: ${fmtPos(picker.value)} – tryk igen eller træk i nålen for at flytte`
    : "Tryk på kortet der hvor fisken blev fanget";
  document.getElementById("mapPickerSave").disabled = !picker.value;
}

// ---------- Oversigtskort ----------
let main = null;

export function showMainMap(el) {
  if (!main) {
    const map = baseMap(el);
    main = { map, layer: L.featureGroup().addTo(map), fitted: false };
  }
  setTimeout(() => main.map.invalidateSize(), 30);
  return main.map;
}

/**
 * items: [{ lat, lng, color, label, kind: "catch"|"spot", popupHTML }]
 */
export function setMainMarkers(items, { fit = false } = {}) {
  if (!main) return;
  main.layer.clearLayers();
  for (const it of items) {
    L.marker([it.lat, it.lng], { icon: pinIcon(it.color, it.label, it.kind), zIndexOffset: it.kind === "spot" ? -100 : 0 })
      .bindPopup(it.popupHTML, { maxWidth: 240, minWidth: 180 })
      .addTo(main.layer);
  }
  if ((fit || !main.fitted) && items.length) {
    main.map.fitBounds(main.layer.getBounds(), { padding: [40, 40], maxZoom: 13 });
    main.fitted = true;
  }
}

export function focusMain(lat, lng, zoom = 15) {
  if (main) main.map.setView([lat, lng], zoom);
}

export function locateOnMain() {
  return myPosition().then((p) => {
    focusMain(p.lat, p.lng, 13);
    return p;
  });
}
