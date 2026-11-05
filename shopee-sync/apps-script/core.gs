/**
 * Shopee Seller Centre → Sheet Sync — core.gs v2.1 (MULTI-KLIEN)
 * File ini SAMA untuk semua klien. Konfigurasi per klien ada di clients/<klien>.gs (konstanta CLIENT).
 * Satu project Apps Script per klien berisi dua file: core.gs + client.gs (salinan clients/<klien>.gs).
 * Kompatibel dengan ekstensi v2.x. Yang berbeda per klien HANYA: konstanta CLIENT (client.gs) dan
 * Script Property SPREADSHEET_ID.
 *
 * Pasang sebagai project Apps Script STANDALONE (script.google.com → New project), satu project
 * per klien, BUKAN di dalam project lain (mis. Weekly_Report_Automation).
 *
 * ── Kontrak dengan ekstensi (JANGAN diubah per klien) ───────────────────────────────────────
 *   EXT  = bentuk data yang dikirim ekstensi + kunci yang dipakai popup untuk mencocokkan hasil.
 * ── Pemetaan per klien ─────────────────────────────────────────────────────────────────────
 *   CLIENT.datasets.<dataset>.columns = daftar kolom sheet → field ekstensi.
 *     type 'date' : kolom tanggal (wajib tepat satu, harus jadi bagian kunci)
 *     type 'num'  : angka hitungan; dibandingkan untuk status sama/berubah
 *     type 'rate' : persentase turunan; tidak dibandingkan, ditulis ulang bila angka berubah;
 *                   null dari API ditulis "-"
 *     type 'text' : teks; map = terjemahan nilai ekstensi → nilai di sheet
 *     key: true   : bagian dari kunci unik (harus sama persis dengan EXT.<dataset>.key)
 *     optional    : kalau header tidak ada di sheet, kolom ini dilewati (tidak error)
 *   Header dicocokkan berdasarkan NAMA (tidak peka huruf besar/kecil), bukan posisi.
 *   enabled: false → data dataset itu tidak dikirim; popup menandainya "tidak dikirim".
 *
 * ── Jaminan data lama ─────────────────────────────────────────────────────────────────────
 *   - Tidak pernah menghapus baris, mengosongkan sel, atau mengurutkan sheet.
 *   - Semua dataset dicek dulu; kalau satu gagal (tab/header salah, data tidak valid), TIDAK ADA
 *     yang ditulis ke tab mana pun.
 *   - Baris baru ditambahkan di bawah baris terakhir yang kolom TANGGAL-nya terisi, ditulis
 *     per kolom yang dipetakan saja. Kolom lain (rumus, isian manual) tidak ditimpa; rumus dari
 *     baris data terakhir disalin hanya ke sel baru yang masih kosong.
 *   - Baris lama: hanya sel angka yang kosong atau berbeda yang ditulis (berbeda → hanya jika
 *     allowOverwrite: true). Baris dibaca ulang sebelum ditulis; kalau sudah bergeser, batal.
 *
 * action "check" : hanya membandingkan.  action "upsert" : membandingkan ulang lalu menulis.
 * Tanpa token: URL /exec berfungsi sebagai kunci, jangan dibagikan di luar tim.
 * Setelah mengubah core.gs atau client.gs: Deploy → Manage deployments → Edit → Version: New version.
 */
const VERSION = '2.1';
const MAX_ROWS = 2000;

// ======================= KONTRAK EKSTENSI v2 (jangan diubah) =======================
const EXT = {
  ads: {
    key: ['Date', 'Ads Type'],
    num: ['Net Cost Spent', 'Impr', 'Click', 'Order', 'Purchase Conversion Value'], rate: [],
    valid: (r) => ['GMV Max Product', 'Iklan Toko'].indexOf(r['Ads Type']) !== -1 && r['Channel'] === 'Shopee Ads',
  },
  overview: {
    key: ['Date'],
    num: ['Orders (Confirmed)', 'Sales (Confirmed)', 'Visitors'], rate: [],
    valid: () => true,
  },
  offplatform: {
    key: ['Tanggal', 'Platform', 'Channel', 'Campaign Description'],
    num: ['Penjualan (IDR)', 'Pesanan', 'Produk', 'Kunjungan', 'Pengunjung', 'Total Pembeli', 'Pembeli Baru',
      'Pengguna Tambahkan ke Keranjang', 'Nilai Produk Ditambahkan ke Keranjang (IDR)', 'Produk Ditambahkan ke Keranjang'],
    rate: ['Tingkat Konversi (Pesanan Dibuat dibagi Kunjungan)', 'Tingkat Konversi (Kunjungan ke Tambahkan ke Keranjang)',
      'Tingkat Konversi (Pesanan Dibuat dari Ditambahkan ke Keranjang)'],
    valid: (r) => r['Platform'] === 'Semua' && typeof r['Channel'] === 'string' && r['Channel'] !== '' &&
      typeof r['Campaign Description'] === 'string',
  },
};

// =================================== WEB APP ===================================
function doGet() {
  try {
    const ss = openSs_();
    const datasets = {};
    Object.keys(EXT).forEach((d) => {
      const cfg = CLIENT.datasets[d];
      if (!cfg || !cfg.enabled) { datasets[d] = 'nonaktif'; return; }
      const sh = ss.getSheetByName(cfg.sheet);
      if (!sh && !cfg.createIfMissing) throw new Error('Tab "' + cfg.sheet + '" (' + d + ') tidak ditemukan.');
      datasets[d] = sh ? cfg.sheet + ': ' + mapHeaders_(sh, cfg, d).cols.map((c) => c.header).join(', ') : cfg.sheet + ' (akan dibuat)';
    });
    return json_({ ok: true, version: VERSION, client: CLIENT.name, msg: 'Shopee Sync aktif', datasets: datasets });
  } catch (err) {
    return err_(errMsg_(err));
  }
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return err_('Isi permintaan bukan JSON.'); }
  if (Array.isArray(body.rows)) return err_('Ekstensi versi lama (1.x). Pasang ekstensi v2.');
  const action = body.action === 'check' ? 'check' : 'upsert';
  const input = body.datasets || {};

  let total = 0;
  for (const d in input) {
    if (!EXT[d]) return err_('Dataset tidak dikenal: ' + d);
    if (!Array.isArray(input[d])) return err_('Dataset ' + d + ' harus berupa array.');
    total += input[d].length;
    const bad = input[d].findIndex((r) => !isValidRow_(d, r));
    if (bad !== -1) return err_('Format data tidak valid: ' + d + ', baris ke-' + (bad + 1) + '.');
  }
  if (total > MAX_ROWS) return err_('Terlalu banyak baris dalam satu kiriman (maks ' + MAX_ROWS + ').');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return err_('Sheet sedang diproses permintaan lain. Coba lagi sebentar.');
  try {
    const ss = openSs_();
    // Fase 1: rencanakan semua dataset. Error di sini → tidak ada yang ditulis.
    const plans = {};
    for (const d in input) plans[d] = plan_(ss, d, input[d]);
    const results = {};
    for (const d in plans) results[d] = plans[d].results;
    if (action === 'check') return json_({ ok: true, version: VERSION, results: results });

    // Fase 2: tulis.
    const summary = {};
    for (const d in plans) summary[d] = write_(ss, plans[d]);
    return json_({ ok: true, version: VERSION, summary: summary });
  } catch (err) {
    return err_(errMsg_(err));
  } finally {
    lock.releaseLock();
  }
}

// ================================== PERENCANAAN ==================================
function plan_(ss, d, rows) {
  const cfg = CLIENT.datasets[d];
  const ext = EXT[d];
  const extKey = (r) => ext.key.map((f) => String(r[f])).join('|');

  // Kunci yang sama dalam satu kiriman: ambil yang terakhir.
  const byKey = {};
  rows.forEach((r) => { byKey[extKey(r)] = r; });

  if (!cfg || !cfg.enabled) {
    return { d: d, disabled: true, results: Object.keys(byKey).map((k) => ({ key: k, status: 'disabled', old: null })) };
  }

  // Tab yang belum ada TIDAK dibuat di fase ini; dibuat di write_ setelah semua dataset lolos cek.
  const sh = ss.getSheetByName(cfg.sheet);
  if (!sh && !cfg.createIfMissing) throw new Error('Tab "' + cfg.sheet + '" tidak ditemukan. Tidak ada yang ditulis.');
  const tz = ss.getSpreadsheetTimeZone();
  const m = sh ? mapHeaders_(sh, cfg, d) : mapVirtual_(cfg);
  const lastData = sh ? lastDataRow_(sh, m.dateCol) : 1;
  const width = sh ? Math.max(sh.getLastColumn(), 1) : cfg.columns.length;
  const data = lastData >= 2 ? sh.getRange(2, 1, lastData - 1, width).getValues() : [];
  const style = detectStyle_(cfg, m, data, sh, lastData);

  const sheetKeyOfExt = (r) => ext.key.map((f) => toSheetText_(m.byField[f], r[f])).join('|');
  const index = {};
  data.forEach((vals, i) => {
    const k = m.keyCols.map((c) => c.type === 'date' ? normDate_(vals[c.idx], tz) : String(vals[c.idx]).trim()).join('|');
    if (k.split('|')[0] === '' || index[k]) return;
    const values = {};
    m.numCols.forEach((c) => { values[c.field] = num_(vals[c.idx]); });
    index[k] = { row: i + 2, values: values };
  });

  const results = [], ops = [];
  Object.keys(byKey).forEach((k) => {
    const r = byKey[k];
    const sk = sheetKeyOfExt(r);
    const ex = index[sk];
    if (!ex) { results.push({ key: k, status: 'new', old: null }); ops.push({ kind: 'new', r: r }); return; }

    const fills = m.numCols.filter((c) => ex.values[c.field] === null);
    const diffs = m.numCols.filter((c) => ex.values[c.field] !== null && ex.values[c.field] !== r[c.field]);
    const writes = fills.concat(cfg.allowOverwrite ? diffs : []);
    if (!writes.length && !diffs.length) { results.push({ key: k, status: 'same', old: null }); ops.push({ kind: 'same' }); return; }

    const old = {};
    ext.num.forEach((f) => {
      const c = diffs.find((x) => x.field === f);
      old[f] = c ? ex.values[f] : r[f]; // hanya angka yang benar-benar berbeda yang dicoret di popup
    });
    results.push({ key: k, status: 'changed', old: old });
    ops.push({ kind: writes.length ? 'update' : 'kept', r: r, row: ex.row, sk: sk, writes: writes, conflicts: diffs.length });
  });

  return { d: d, cfg: cfg, sh: sh, m: m, tz: tz, style: style, lastData: lastData, results: results, ops: ops };
}

// ==================================== MENULIS ====================================
function write_(ss, p) {
  if (p.disabled) return { disabled: p.results.length };
  const s = { inserted: 0, updated: 0, skipped: 0 };
  let kept = 0;
  const { m, tz, style, cfg } = p;
  let sh = p.sh;
  if (!sh) {
    sh = ss.insertSheet(cfg.sheet);
    sh.getRange(1, 1, 1, cfg.columns.length).setValues([cfg.columns.map((c) => c.header)]);
    sh.setFrozenRows(1);
  }

  // Baris lama
  p.ops.forEach((op) => {
    if (op.kind === 'same') { s.skipped++; return; }
    if (op.kind === 'kept') { s.skipped++; kept++; return; }
    if (op.kind !== 'update') return;
    const now = sh.getRange(op.row, 1, 1, sh.getLastColumn()).getValues()[0];
    const nowKey = m.keyCols.map((c) => c.type === 'date' ? normDate_(now[c.idx], tz) : String(now[c.idx]).trim()).join('|');
    if (nowKey !== op.sk) throw new Error('Isi tab "' + cfg.sheet + '" berubah saat proses (baris ' + op.row + '). Kirim ulang.');
    op.writes.forEach((c) => {
      const cell = sh.getRange(op.row, c.idx + 1);
      if (cfg.numFormat) cell.setNumberFormat(cfg.numFormat);
      cell.setValue(op.r[c.field]);
    });
    if (cfg.allowOverwrite && op.conflicts) m.rateCols.forEach((c) => { // persen turunan → ikut diperbarui bila angka ditimpa
      const cell = sh.getRange(op.row, c.idx + 1);
      cell.setNumberFormat(style.rateFmt);
      cell.setValue(rateCell_(style, op.r[c.field]));
    });
    if (op.conflicts && !cfg.allowOverwrite) kept++;
    s.updated++;
  });

  // Baris baru: ditulis PER KOLOM yang dipetakan, supaya kolom lain (rumus terisi ke bawah) aman.
  const news = p.ops.filter((op) => op.kind === 'new').map((op) => op.r);
  if (news.length) {
    const start = p.lastData + 1, n = news.length;
    const lack = start + n - 1 - sh.getMaxRows();
    if (lack > 0) sh.insertRowsAfter(sh.getMaxRows(), lack);
    m.cols.forEach((c) => {
      const range = sh.getRange(start, c.idx + 1, n, 1);
      if (c.type === 'date') range.setNumberFormat(style.dateFmt);
      else if (c.type === 'rate') range.setNumberFormat(style.rateFmt);
      else if (c.type === 'num' && cfg.numFormat) range.setNumberFormat(cfg.numFormat);
      range.setValues(news.map((r) => [cellValue_(c, r, style, tz)]));
    });
    s.inserted = n;
    s.formulas = carryFormulas_(sh, m, p.lastData, start, n);
  }
  if (kept) s.keptOld = kept;
  return s;
}

function cellValue_(c, r, style, tz) {
  const v = r[c.field];
  if (c.type === 'date') {
    const d = Utilities.parseDate(v, tz, 'yyyy-MM-dd');
    return style.dateKind === 'date' ? d : Utilities.formatDate(d, tz, style.datePattern);
  }
  if (c.type === 'rate') return rateCell_(style, v);
  if (c.type === 'text') return toSheetText_(c, v);
  return v;
}

function rateCell_(style, v) {
  if (v === null || v === undefined) return '-';
  return style.rateKind === 'text' ? (v * 100).toFixed(2).replace('.', ',') + '%' : v;
}

// Rumus di kolom yang TIDAK dipetakan: salin (R1C1, relatif) dari baris data terakhir ke sel baru yang kosong.
function carryFormulas_(sh, m, templateRow, start, n) {
  if (templateRow < 2) return 0;
  const lastCol = sh.getLastColumn();
  const mapped = {};
  m.cols.forEach((c) => (mapped[c.idx] = true));
  const tmpl = sh.getRange(templateRow, 1, 1, lastCol).getFormulasR1C1()[0];
  const target = sh.getRange(start, 1, n, lastCol);
  const tf = target.getFormulas(), tv = target.getValues();
  let count = 0;
  tmpl.forEach((f, j) => {
    if (!f || mapped[j]) return;
    for (let i = 0; i < n; i++) {
      if (!tf[i][j] && tv[i][j] === '') { sh.getRange(start + i, j + 1).setFormulaR1C1(f); count++; }
    }
  });
  return count;
}

// ================================ HEADER & GAYA ================================
function mapHeaders_(sh, cfg, d) {
  const width = Math.max(sh.getLastColumn(), 1);
  const header = sh.getRange(1, 1, 1, width).getValues()[0].map((h) => String(h).trim().toLowerCase());
  const missing = [], list = [];
  cfg.columns.forEach((c) => {
    const want = c.header.toLowerCase();
    const idx = header.indexOf(want);
    if (idx === -1) { if (!c.optional) missing.push(c.header); return; }
    if (header.indexOf(want, idx + 1) !== -1) throw new Error('Header "' + c.header + '" muncul lebih dari sekali di tab "' + cfg.sheet + '".');
    list.push(Object.assign({}, c, { idx: idx }));
  });
  if (missing.length) throw new Error('Tab "' + cfg.sheet + '": header wajib tidak ditemukan di baris 1: ' + missing.join(', ') + '. Tidak ada yang ditulis.');
  return finishMap_(cfg, list);
}

function mapVirtual_(cfg) { // tab belum ada (mode check dengan createIfMissing)
  const list = cfg.columns.map((c, i) => Object.assign({}, c, { idx: i }));
  return finishMap_(cfg, list);
}

function finishMap_(cfg, list) {
  const byField = {};
  list.forEach((c) => (byField[c.field] = c));
  const dates = list.filter((c) => c.type === 'date');
  if (dates.length !== 1) throw new Error('Konfigurasi "' + cfg.sheet + '": harus ada tepat satu kolom type "date".');
  const keyCols = list.filter((c) => c.key);
  return {
    cols: list, byField: byField,
    dateCol: dates[0].idx,
    keyCols: keyCols,
    numCols: list.filter((c) => c.type === 'num'),
    rateCols: list.filter((c) => c.type === 'rate'),
  };
}

// Gaya tanggal/persen: ikuti baris data terakhir (kecuali dipaksa oleh konfigurasi).
function detectStyle_(cfg, m, data, sh, lastData) {
  const st = { dateKind: null, datePattern: null, dateFmt: null, rateKind: 'number', rateFmt: '0.00%' };
  let last = null;
  for (let i = data.length - 1; i >= 0; i--) { if (data[i][m.dateCol] !== '' && data[i][m.dateCol] !== null) { last = data[i]; break; } }

  if (!last) {
    if (cfg.date.emptyTab === 'date') { st.dateKind = 'date'; st.dateFmt = cfg.date.realFormat || 'yyyy-mm-dd'; }
    else { st.dateKind = 'text'; st.datePattern = cfg.date.emptyTab; st.dateFmt = '@'; }
    return st;
  }
  const v = last[m.dateCol];
  if (isDate_(v)) {
    st.dateKind = 'date';
    const f = sh.getRange(lastData, m.dateCol + 1).getNumberFormat();
    st.dateFmt = cfg.date.realFormat || (f && f !== '@' && f !== 'General' ? f : 'yyyy-mm-dd');
  } else {
    const s = String(v).trim();
    st.dateKind = 'text'; st.dateFmt = '@';
    st.datePattern = cfg.date.textPattern ||
      (/^\d{2}-\d{2}-\d{4}$/.test(s) ? 'dd-MM-yyyy' : /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s) ? 'dd/MM/yyyy' : 'yyyy-MM-dd');
  }
  if (m.rateCols.length) {
    const rv = m.rateCols.map((c) => last[c.idx]).find((x) => x !== '-' && x !== '' && x !== null);
    if (typeof rv === 'string') { st.rateKind = 'text'; st.rateFmt = '@'; }
    else {
      const f = sh.getRange(lastData, m.rateCols[0].idx + 1).getNumberFormat();
      st.rateFmt = f && f !== '@' && f !== 'General' ? f : '0.00%';
    }
  }
  return st;
}

// ==================================== UTIL ====================================
// ID spreadsheet disimpan di Script Properties (Project Settings → Script Properties → SPREADSHEET_ID),
// BUKAN di kode, supaya file di repo identik dengan yang ter-deploy dan tidak memuat ID klien.
function openSs_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id || !/^[\w-]{25,}$/.test(id)) {
    throw new Error('Script Property SPREADSHEET_ID belum diisi (Project Settings → Script Properties).');
  }
  return SpreadsheetApp.openById(id);
}

function toSheetText_(c, v) {
  if (!c) return String(v === null || v === undefined ? '' : v).trim();
  if (c.type === 'date') return v;
  const s = String(v === null || v === undefined ? '' : v);
  return (c.map && Object.prototype.hasOwnProperty.call(c.map, s) ? c.map[s] : s).trim();
}

function isValidRow_(d, r) {
  const ext = EXT[d];
  if (!r || typeof r !== 'object') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r[ext.key[0]])) return false;
  if (!ext.num.every((c) => typeof r[c] === 'number' && isFinite(r[c]) && r[c] >= 0)) return false;
  if (!ext.rate.every((c) => r[c] === null || (typeof r[c] === 'number' && isFinite(r[c]) && r[c] >= 0))) return false;
  return ext.valid(r);
}

// Tanggal di sheet: Date, teks dd-mm-yyyy, dd/mm/yyyy, atau yyyy-mm-dd → yyyy-mm-dd.
function normDate_(v, tz) {
  if (isDate_(v)) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  const s = String(v === null || v === undefined ? '' : v).trim();
  const m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

// Angka asli apa adanya; teks seperti "Rp633,759" diambil digitnya (bilangan bulat). Kosong → null.
function num_(v) {
  if (typeof v === 'number') return v;
  const s = String(v === null || v === undefined ? '' : v).replace(/[^\d-]/g, '');
  return s === '' ? null : Number(s);
}

// Baris data terakhir menurut kolom TANGGAL (getLastRow ikut menghitung rumus yang diisi ke bawah).
function lastDataRow_(sh, dateIdx) {
  const last = sh.getLastRow();
  if (last < 2) return 1;
  const col = sh.getRange(2, dateIdx + 1, last - 1, 1).getValues();
  for (let i = col.length - 1; i >= 0; i--) if (col[i][0] !== '' && col[i][0] !== null) return i + 2;
  return 1;
}

function isDate_(v) { return Object.prototype.toString.call(v) === '[object Date]'; }
function errMsg_(err) { return (err && err.message) || String(err); }
function err_(msg) { return json_({ ok: false, version: VERSION, error: msg }); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
