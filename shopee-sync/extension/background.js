// Ekstensi TIDAK menyimpan riwayat terkirim. Sheet adalah satu-satunya sumber kebenaran.
// Yang disimpan hanya "buffer" data tertangkap per dataset, di chrome.storage.session
// (di memori, hilang saat browser ditutup) dan dikosongkan setelah Kirim berhasil.
importScripts('datasets.js');

const SCRIPT_MAJOR = 2; // Code.gs harus versi 2.x
const MAX_ROWS = 2000;

const getCfg = async () => (await chrome.storage.local.get('cfg')).cfg || {};
// buffer = { ads: {key: row}, overview: {...}, offplatform: {...} }
const getBuffer = async () => (await chrome.storage.session.get('buffer')).buffer || {};
const setBuffer = (buffer) => chrome.storage.session.set({ buffer });
const getWarnings = async () => (await chrome.storage.session.get('warnings')).warnings || {};
const countRows = (buffer) => DATASET_ORDER.reduce((n, d) => n + Object.keys(buffer[d] || {}).length, 0);

// Antrian: response yang datang hampir bersamaan tidak saling menimpa buffer,
// dan tangkapan baru yang datang saat Kirim berjalan tidak ikut terhapus.
let queue = Promise.resolve();
const serial = (fn) => (queue = queue.then(fn, fn));

function setBadge(n, color) {
  chrome.action.setBadgeText({ text: n ? String(n) : '' });
  if (color) chrome.action.setBadgeBackgroundColor({ color });
}

async function callScript(payload) {
  const cfg = await getCfg();
  if (!cfg.url) return { ok: false, error: 'Link Apps Script belum diisi.' };
  let res;
  try {
    const r = await fetch(cfg.url, {
      method: payload ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined, // hindari preflight CORS
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const text = await r.text();
    try { res = JSON.parse(text); } catch (e) {
      return { ok: false, error: 'Apps Script tidak membalas JSON. Pastikan deploy terbaru dengan akses "Anyone".' };
    }
  } catch (e) {
    return { ok: false, error: 'Tidak bisa terhubung ke Apps Script: ' + e.message };
  }
  if (parseInt(res.version, 10) !== SCRIPT_MAJOR) {
    return { ok: false, error: `Code.gs di link ini versi ${res.version || 'lama'}. Tempel Code.gs v2, lalu Deploy → Manage deployments → Edit → New version.` };
  }
  return res;
}

// Ambil isi buffer dalam bentuk payload: { dataset: [baris bersih] } (hanya dataset yang berisi).
function payloadOf(buffer) {
  const out = {};
  DATASET_ORDER.forEach((d) => {
    const rows = Object.values(buffer[d] || {}).map((r) => pickCols(d, r));
    if (rows.length) out[d] = rows;
  });
  return out;
}

// Tangkapan terbaru selalu menimpa yang lama untuk kunci yang sama.
const onCapture = (dataset, rows) => serial(async () => {
  if (!DATASETS[dataset] || !Array.isArray(rows)) return;
  const buffer = await getBuffer();
  const bucket = (buffer[dataset] = buffer[dataset] || {});
  rows.forEach((r) => (bucket[DATASETS[dataset].key(r)] = { ...pickCols(dataset, r), capturedAt: Date.now() }));
  await setBuffer(buffer);
  const warnings = await getWarnings(); // tangkapan sukses menghapus peringatan lama dataset itu
  if (warnings[dataset]) { delete warnings[dataset]; await chrome.storage.session.set({ warnings }); }
  setBadge(countRows(buffer), '#000000'); // hitam = tertangkap, belum dicek ke sheet
});

async function onWarn(dataset, warning) {
  const warnings = await getWarnings();
  warnings[dataset] = { msg: String(warning), at: Date.now() };
  await chrome.storage.session.set({ warnings });
}

async function onCheck() {
  const datasets = payloadOf(await getBuffer());
  if (!Object.keys(datasets).length) return { ok: true, results: {} };
  const res = await callScript({ action: 'check', datasets });
  if (res.ok) {
    const n = Object.values(res.results || {}).flat().filter((x) => x.status !== 'same').length;
    setBadge(n, '#EE4D2D');
  }
  return res;
}

const onSend = () => serial(async () => {
  const datasets = payloadOf(await getBuffer());
  const total = Object.values(datasets).reduce((n, rows) => n + rows.length, 0);
  if (!total) return { ok: true, summary: {} };
  if (total > MAX_ROWS) return { ok: false, error: `Terlalu banyak baris (${total}). Kirim maksimal ${MAX_ROWS} sekali jalan; pilih rentang tanggal lebih pendek.` };
  const res = await callScript({ action: 'upsert', datasets }); // sheet yang memutuskan baru/ubah/lewati
  if (res.ok) {
    await setBuffer({});
    setBadge(0);
  }
  await chrome.storage.session.set({ lastResult: { ...res, at: Date.now() } });
  return res;
});

async function onClear() {
  await chrome.storage.session.set({ buffer: {}, warnings: {}, lastResult: null });
  setBadge(0);
  return { ok: true };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const handlers = {
    CAPTURE: () => onCapture(msg.dataset, msg.rows).then(() => ({ ok: true })),
    WARN: () => onWarn(msg.dataset, msg.warning).then(() => ({ ok: true })),
    CHECK: onCheck,
    SEND: onSend,
    CLEAR: onClear,
    PING: () => callScript(null),
  };
  const h = handlers[msg && msg.type];
  if (!h) return false;
  h().then(sendResponse, (e) => sendResponse({ ok: false, error: String(e) }));
  return true; // respons async
});
