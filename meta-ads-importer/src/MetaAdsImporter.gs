/**
 * ============================================================
 * Meta Ads Importer — Haydecor
 * Supports: Meta CPAS + Meta Reguler (multi-account)
 * Google Apps Script — production ready
 * ============================================================
 *
 * SETUP:
 *   1. Buka Apps Script Editor → Project Settings → Script Properties
 *   2. Tambahkan 3 properties berikut:
 *
 *        Key                    Value
 *        ─────────────────────────────────────────
 *        META_ACCESS_TOKEN      <token dari Meta Business Manager>
 *        META_CPAS_ACCOUNT_ID   act_xxxxxxxxx
 *        META_REG_ACCOUNT_ID    act_xxxxxxxxx
 *
 *   3. Jalankan checkConfig() untuk verifikasi
 *   4. Test per account: importMetaCPAS() / importMetaREG()
 *      atau tarik semua sekaligus: importAllMeta()
 *   5. Pasang Time Trigger harian:
 *        Function : importAllMeta
 *        Type     : Day timer
 *        Time     : 6am – 7am
 *
 * MIGRATION dari versi lama:
 *   - Hapus Script Property lama: META_ACCOUNT_ID
 *   - Tambah META_CPAS_ACCOUNT_ID dan META_REG_ACCOUNT_ID
 *
 * CATATAN PENTING — Perbedaan struktur kolom antar sheet:
 *   RAW_META_CPAS dan RAW_META_REG sengaja punya LABEL KOLOM berbeda,
 *   karena goal optimasi campaign-nya berbeda:
 *     - RAW_META_CPAS → header: Date | Channel | Spend | Purchase | Purchase Value
 *     - RAW_META_REG  → header: Date | Channel | Spend | Action   | Action Type
 *   Posisi kolom (index) tetap SAMA di kedua sheet — hanya label & makna
 *   isinya yang berbeda. RAW_META_CPAS TIDAK terpengaruh oleh perubahan
 *   apa pun di ACCOUNT_CONFIGS.REG.
 *   Kalau goal campaign Reguler berubah di masa depan, cukup update
 *   ACCOUNT_CONFIGS.REG.actionType — header sheet yang SUDAH ADA tidak
 *   akan diubah otomatis oleh script (lihat getOrCreateSheet_()).
 * ============================================================
 */


// ─── GLOBAL CONSTANTS ────────────────────────────────────────

const META_API_VERSION  = 'v25.0';
const META_API_BASE_URL = 'https://graph.facebook.com';

// Meta tidak konsisten menamai action_type yang sama di campaign berbeda.
// Untuk setiap goal, daftarkan beberapa nama kandidat — getMetric_() akan
// memakai kandidat PERTAMA yang ditemukan di response.
const PURCHASE_ACTION_CANDIDATES = [
  'purchase',
  'omni_purchase',
  'offsite_conversion.fb_pixel_purchase',
];

const ADD_TO_CART_ACTION_CANDIDATES = [
  'add_to_cart',
  'omni_add_to_cart',
  'offsite_conversion.fb_pixel_add_to_cart',
];

// Index kolom (0-based) — SAMA untuk semua sheet, hanya label/nama kolom yang beda.
// Posisi kolom: 0=Date, 1=Channel, 2=Spend, 3=metric-count, 4=metric-value
const COL_IDX = {
  DATE          : 0,
  CHANNEL       : 1,
  SPEND         : 2,
  PURCHASE      : 3,   // dipakai juga untuk kolom "Action" di REG (posisi sama)
  PURCHASE_VALUE: 4,   // dipakai juga untuk kolom "Action Type" di REG (posisi sama)
};


// ─── ACCOUNT CONFIG ──────────────────────────────────────────
/**
 * Daftarkan semua Meta Ads account di sini.
 * Untuk menambah account baru: copy salah satu blok,
 * ganti key, sheetName, channel, fields, actionsField, valuesField.
 */
const ACCOUNT_CONFIGS = {

  CPAS: {
    label         : 'Meta CPAS',
    accountIdKey  : 'META_CPAS_ACCOUNT_ID',   // key di Script Properties
    tokenKey      : 'META_ACCESS_TOKEN',
    sheetName     : 'RAW_META_CPAS',
    channel       : 'Meta_CPAS',
    headers       : ['Date', 'Channel', 'Spend', 'Purchase', 'Purchase Value'],
    // CPAS menggunakan catalog_segment_* fields, goal: Purchase
    fields        : 'date_start,spend,catalog_segment_actions,catalog_segment_value',
    actionsField  : 'catalog_segment_actions',
    valuesField   : 'catalog_segment_value',
    actionType    : PURCHASE_ACTION_CANDIDATES,
  },

  REG: {
    label         : 'Meta Reguler',
    accountIdKey  : 'META_REG_ACCOUNT_ID',
    tokenKey      : 'META_ACCESS_TOKEN',
    sheetName     : 'RAW_META_REG',
    channel       : 'Meta_REG',
    headers       : ['Date', 'Channel', 'Spend', 'Action', 'Action Type'],
    // Regular campaign menggunakan actions & action_values fields, goal: Add to Cart
    fields        : 'date_start,spend,actions,action_values',
    actionsField  : 'actions',
    valuesField   : 'action_values',
    actionType    : ADD_TO_CART_ACTION_CANDIDATES,
  },

};


// ─── ENTRY POINTS ────────────────────────────────────────────

/**
 * Tarik semua account sekaligus. Gunakan ini untuk Time Trigger harian.
 */
function importAllMeta() {
  Logger.log('=== importAllMeta START ===');
  Object.values(ACCOUNT_CONFIGS).forEach(function(cfg) {
    importMetaAccount_(cfg);
  });
  Logger.log('=== importAllMeta SELESAI ===');
}

/** Tarik CPAS saja. Untuk test manual. */
function importMetaCPAS() {
  importMetaAccount_(ACCOUNT_CONFIGS.CPAS);
}

/** Tarik Meta Reguler saja. Untuk test manual. */
function importMetaREG() {
  importMetaAccount_(ACCOUNT_CONFIGS.REG);
}


// ─── CORE IMPORTER ───────────────────────────────────────────

/**
 * Fungsi inti: fetch → parse → upsert untuk satu account config.
 * Idempotent — aman dijalankan berkali-kali pada hari yang sama.
 *
 * @param {Object} cfg - Salah satu objek dari ACCOUNT_CONFIGS
 */
function importMetaAccount_(cfg) {
  Logger.log('--- Import START: ' + cfg.label + ' → ' + cfg.sheetName + ' ---');

  try {
    const raw = fetchMetaInsights_(cfg);

    if (!raw || raw.length === 0) {
      Logger.log('[' + cfg.label + '] Tidak ada data dari API. Proses dihentikan.');
      return;
    }

    const sheet = getOrCreateSheet_(cfg.sheetName, cfg.headers);

    raw.forEach(function(item) {
      const row = buildRow_(item, cfg);
      if (!row) return; // skip jika item tidak valid

      Logger.log('[' + cfg.label + '] Upserting: ' + JSON.stringify(row));
      upsertRow_(sheet, row);
    });

    Logger.log('--- Import SELESAI: ' + cfg.label + ' ---');

  } catch (err) {
    Logger.log('ERROR [' + cfg.label + ']: ' + err.message);
    throw err; // bubble up agar Apps Script mencatat failure di dashboard
  }
}


// ─── API LAYER ────────────────────────────────────────────────

/**
 * Fetch data insights dari Meta Marketing API untuk satu account.
 *
 * @param {Object} cfg - Account config dari ACCOUNT_CONFIGS
 * @returns {Object[]} Array of insight objects, atau [] jika kosong.
 */
function fetchMetaInsights_(cfg) {
  const props       = PropertiesService.getScriptProperties();
  const accessToken = props.getProperty(cfg.tokenKey);
  const accountId   = props.getProperty(cfg.accountIdKey);

  if (!accessToken) {
    throw new Error('Script Property tidak ditemukan: ' + cfg.tokenKey);
  }
  if (!accountId) {
    throw new Error('Script Property tidak ditemukan: ' + cfg.accountIdKey);
  }
  if (!accountId.startsWith('act_')) {
    throw new Error(cfg.accountIdKey + ' harus diawali "act_". Nilai saat ini: ' + accountId);
  }

  const params = {
    fields      : cfg.fields,
    level       : 'account',
    date_preset : 'yesterday',
    access_token: accessToken,
  };

  const queryString = Object.keys(params)
    .map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    })
    .join('&');

  const url = META_API_BASE_URL + '/' + META_API_VERSION + '/' + accountId + '/insights?' + queryString;

  Logger.log('[' + cfg.label + '] Fetching: ' + url.replace(accessToken, '***TOKEN***'));

  const response   = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const statusCode = response.getResponseCode();
  const body       = response.getContentText();

  Logger.log('[' + cfg.label + '] HTTP Status: ' + statusCode);

  if (statusCode !== 200) {
    Logger.log('[' + cfg.label + '] Response body: ' + body);
    throw new Error('[' + cfg.label + '] Meta API gagal. HTTP ' + statusCode);
  }

  const json = JSON.parse(body);

  if (json.error) {
    throw new Error('[' + cfg.label + '] API error: ' + JSON.stringify(json.error));
  }

  const data = json.data || [];
  Logger.log('[' + cfg.label + '] Records dari API: ' + data.length);

  return data;
}


// ─── METRIC HELPERS ───────────────────────────────────────────

/**
 * Cari nilai numerik dari array action objects berdasarkan action_type.
 * Mendukung beberapa kandidat nama action_type — dipakai karena Meta
 * kadang menamai event yang sama secara berbeda antar campaign/account
 * (misal: 'add_to_cart' vs 'omni_add_to_cart').
 *
 * @param {Object[]|undefined} actionArray      - e.g. actions / action_values
 * @param {string|string[]}    actionTypeOrList - satu action_type, atau array kandidat
 * @returns {number} Nilai numerik dari kandidat PERTAMA yang cocok, atau 0 jika tidak ada.
 */
function getMetric_(actionArray, actionTypeOrList) {
  if (!Array.isArray(actionArray)) return 0;

  const candidates = Array.isArray(actionTypeOrList) ? actionTypeOrList : [actionTypeOrList];

  for (let c = 0; c < candidates.length; c++) {
    const match = actionArray.find(function(item) {
      return item.action_type === candidates[c];
    });

    if (match) {
      const num = parseFloat(match.value);
      return isNaN(num) ? 0 : num;
    }
  }

  return 0; // tidak ada kandidat yang cocok
}


// ─── ROW BUILDER ──────────────────────────────────────────────

/**
 * Konversi satu insight object dari API menjadi array row untuk sheet.
 *
 * @param {Object} item - Satu element dari array data API
 * @param {Object} cfg  - Account config (untuk channel label & field names)
 * @returns {Array|null} Row array sesuai COL_IDX (posisi kolom sama di semua sheet), atau null jika tidak valid.
 */
function buildRow_(item, cfg) {
  if (!item || !item.date_start) {
    Logger.log('WARN: Item tidak valid, dilewati: ' + JSON.stringify(item));
    return null;
  }

  const date          = item.date_start;                                      // string YYYY-MM-DD
  const spend         = parseFloat(item.spend) || 0;
  const purchase      = getMetric_(item[cfg.actionsField], cfg.actionType);
  const purchaseValue = getMetric_(item[cfg.valuesField],  cfg.actionType);

  // Urutan harus sesuai COL_IDX (posisi kolom sama di semua sheet) & COL_IDX
  return [date, cfg.channel, spend, purchase, purchaseValue];
}


// ─── SHEET HELPERS ────────────────────────────────────────────

/**
 * Dapatkan sheet; buat baru dengan header jika belum ada.
 * Header TIDAK disentuh kalau sheet sudah ada — supaya tidak mengganggu
 * struktur kolom yang sudah diatur manual (misal RAW_META_REG yang
 * pakai label "Action" / "Action Type" alih-alih "Purchase").
 *
 * @param {string}   name    - Nama sheet
 * @param {string[]} headers - Header yang dipakai HANYA saat sheet baru dibuat
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet_(name, headers) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);

    // Format header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#D9D9D9');

    Logger.log('Sheet baru dibuat: ' + name + ' dengan header: ' + headers.join(', '));
  }

  return sheet;
}

/**
 * Normalisasi nilai cell tanggal → string "YYYY-MM-DD".
 * Menangani tiga kemungkinan tipe dari getValues():
 *   - Date object  (Sheets auto-convert kolom format Date)
 *   - Number       (serial date Excel/Sheets — jarang tapi bisa terjadi)
 *   - String       (kolom diformat Plain Text)
 *
 * @param {*} cellValue - Nilai mentah dari getValues()
 * @returns {string} "YYYY-MM-DD" atau '' jika tidak valid.
 */
function normalizeCellDate_(cellValue) {
  if (!cellValue) return '';

  if (cellValue instanceof Date) {
    return Utilities.formatDate(cellValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  if (typeof cellValue === 'number') {
    // Serial date: epoch Sheets = 30 Des 1899
    const epoch  = new Date(1899, 11, 30).getTime();
    const parsed = new Date(epoch + cellValue * 86400000);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
  }

  // String — ambil 10 karakter pertama (YYYY-MM-DD)
  const s = String(cellValue).trim();
  return s.length >= 10 ? s.substring(0, 10) : s;
}

/**
 * Cari nomor baris (1-based) yang memiliki tanggal tertentu di kolom Date.
 * Membaca seluruh kolom Date sekaligus (satu Sheets API call) — efisien.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {number} Row number jika ditemukan, -1 jika tidak ada.
 */
function findRowByDate_(sheet, dateStr) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const dateValues = sheet
    .getRange(2, COL_IDX.DATE + 1, lastRow - 1, 1)
    .getValues();

  for (let i = 0; i < dateValues.length; i++) {
    if (normalizeCellDate_(dateValues[i][0]) === dateStr) {
      return i + 2; // i=0 → baris 2 (baris 1 adalah header)
    }
  }

  return -1;
}

/**
 * Upsert satu row ke sheet berdasarkan tanggal sebagai unique key.
 * - Tanggal sudah ada → UPDATE (overwrite)
 * - Tanggal belum ada → INSERT (append)
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Array} row - Array nilai sesuai COL_IDX (posisi kolom sama di semua sheet)
 */
function upsertRow_(sheet, row) {
  const dateStr     = String(row[COL_IDX.DATE]);
  const existingRow = findRowByDate_(sheet, dateStr);

  if (existingRow !== -1) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    Logger.log('  UPDATE baris ' + existingRow + ' → ' + dateStr);
  } else {
    sheet.appendRow(row);
    Logger.log('  INSERT baris baru → ' + dateStr);
  }
}


// ─── UTILITIES ───────────────────────────────────────────────

/**
 * Verifikasi Script Properties tanpa menarik data.
 * Jalankan ini pertama kali untuk memastikan semua config sudah benar.
 */
function checkConfig() {
  const props = PropertiesService.getScriptProperties();

  const keys = [
    'META_ACCESS_TOKEN',
    'META_CPAS_ACCOUNT_ID',
    'META_REG_ACCOUNT_ID',
  ];

  keys.forEach(function(key) {
    const val = props.getProperty(key);
    if (!val) {
      Logger.log('❌ MISSING : ' + key);
    } else if (key === 'META_ACCESS_TOKEN') {
      Logger.log('✅ SET     : ' + key + ' (***' + val.slice(-6) + ')');
    } else {
      Logger.log('✅ SET     : ' + key + ' = ' + val);
    }
  });
}

/**
 * Hapus baris duplikat pada sheet tertentu, pertahankan yang TERAKHIR per tanggal.
 * Jalankan manual jika terjadi duplikasi data.
 *
 * @param {string} sheetName - Nama sheet yang akan dibersihkan
 */
function deduplicateSheet_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) { Logger.log('Sheet tidak ditemukan: ' + sheetName); return; }

  const lastRow = sheet.getLastRow();
  if (lastRow < 3) { Logger.log('Tidak ada duplikat (< 2 baris data).'); return; }

  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  // Buat map dateStr → index terakhir (overwrite jika duplikat)
  const seen = {};
  data.forEach(function(row, i) {
    const d = normalizeCellDate_(row[COL_IDX.DATE]);
    if (d) seen[d] = i;
  });

  const keepIndices  = new Set(Object.values(seen));
  const rowsToDelete = [];
  data.forEach(function(_, i) {
    if (!keepIndices.has(i)) rowsToDelete.push(i + 2);
  });

  // Hapus dari bawah ke atas agar row number tidak bergeser
  rowsToDelete.sort(function(a, b) { return b - a; });
  rowsToDelete.forEach(function(rowNum) {
    sheet.deleteRow(rowNum);
    Logger.log('Deleted duplicate row ' + rowNum + ' di sheet: ' + sheetName);
  });

  Logger.log('deduplicateSheet selesai [' + sheetName + ']: ' + rowsToDelete.length + ' baris dihapus.');
}

/** Shortcut dedup untuk masing-masing sheet */
function deduplicateCPAS() { deduplicateSheet_(ACCOUNT_CONFIGS.CPAS.sheetName); }
function deduplicateREG()  { deduplicateSheet_(ACCOUNT_CONFIGS.REG.sheetName);  }


// ─── DEBUG HELPER ────────────────────────────────────────────

/**
 * Tarik raw response API tanpa parsing, untuk inspect action_type apa saja
 * yang sebenarnya dikembalikan Meta untuk account tertentu.
 * Jalankan ini kalau Purchase/Add to Cart selalu 0 padahal ada datanya.
 *
 * @param {Object} cfg - ACCOUNT_CONFIGS.CPAS atau ACCOUNT_CONFIGS.REG
 */
function debugRawActions_(cfg) {
  const raw = fetchMetaInsights_(cfg);

  if (!raw || raw.length === 0) {
    Logger.log('[' + cfg.label + '] Tidak ada data.');
    return;
  }

  raw.forEach(function(item) {
    Logger.log('[' + cfg.label + '] date_start: ' + item.date_start);
    Logger.log('[' + cfg.label + '] field "' + cfg.actionsField + '": ' +
      JSON.stringify(item[cfg.actionsField], null, 2));
    Logger.log('[' + cfg.label + '] field "' + cfg.valuesField + '": ' +
      JSON.stringify(item[cfg.valuesField], null, 2));
  });
}

function debugRawActionsREG()  { debugRawActions_(ACCOUNT_CONFIGS.REG);  }
function debugRawActionsCPAS() { debugRawActions_(ACCOUNT_CONFIGS.CPAS); }
