/**
 * ============================================================
 * CONFIG.GS — Daily Telegram Report (Multi-Client)
 * ============================================================
 * SETUP WAJIB sebelum dipakai:
 * Apps Script editor > Project Settings (ikon gerigi) > Script Properties
 * > Add script property, isi key-key berikut:
 *
 *   HAYDECOR_SHEET_ID     -> Spreadsheet ID Table_Consolidated Haydecor
 *   RHA_SHEET_ID          -> Spreadsheet ID Table_Consolidated RHA Gallery
 *   TELEGRAM_BOT_TOKEN    -> Bot token Telegram (1 bot untuk semua client)
 *   HAYDECOR_CHAT_ID      -> Chat ID Telegram tujuan Haydecor
 *   RHA_CHAT_ID           -> Chat ID Telegram tujuan RHA Gallery
 *   FONNTE_TOKEN          -> Token device Fonnte (1 device untuk semua client)
 *   HAYDECOR_WA_GROUP_ID  -> Group ID WhatsApp tujuan Haydecor (format: xxxx@g.us)
 *   RHA_WA_GROUP_ID       -> Group ID WhatsApp tujuan RHA Gallery (format: xxxx@g.us)
 *   Cara dapat Group ID: jalankan fetchWhatsAppGroups() lalu listWhatsAppGroups()
 *   di whatsapp_group_setup.gs (sekali saja, jangan dijadwalkan berulang).
 *
 * Spreadsheet ID = string panjang di URL sheet, di antara /d/ dan /edit
 * Chat ID Telegram bisa didapat lewat bot @userinfobot atau getUpdates API.
 * ============================================================
 */

const SHEET_NAME_CONSOLIDATED = 'Table_Consolidated';

// Channel iklan yang dihitung sebagai "channel performance".
// sheetName = harus PERSIS sama dengan isi kolom "Channel" di Table_Consolidated.
// label     = nama yang ditampilkan di pesan Telegram (boleh beda format).
// Urutan di array ini menentukan urutan tampil di pesan Telegram.
// Sama persis untuk semua client (Haydecor & RHA Gallery).
const AD_CHANNELS = [
  { sheetName: 'Meta_Reguler', label: 'Meta Reguler' },
  { sheetName: 'Meta_CPAS', label: 'Meta CPAS' },
  { sheetName: 'Shopee_Ads', label: 'Shopee Ads' },
  // TikTok Ads belum berjalan. Dibiarkan di sini dengan sheetName tebakan;
  // begitu channel ini live di Table_Consolidated, sesuaikan sheetName-nya
  // kalau ternyata penamaan asli berbeda (cek pakai debugTodayRows()).
  { sheetName: 'TikTok_Ads', label: 'TikTok Ads' }
];

/**
 * Helper: daftar sheetName saja (dipakai untuk filter SUMIFS-style).
 */
function getAdChannelSheetNames_() {
  return AD_CHANNELS.map(function (ch) { return ch.sheetName; });
}

// Marker row yang merepresentasikan TOTAL revenue marketplace (BUKAN channel iklan).
// Dipakai untuk:
//   - Non Ads Revenue = Revenue(marker ini) - SUM(Revenue Ads semua AD_CHANNELS)
//   - Revenue MTD     = SUM Revenue dari row dengan channel ini saja (hindari double count)
const TOTAL_REVENUE_MARKER = 'Shopee';

/**
 * Daftar client aktif. Tambah entry baru di sini kalau ada client baru masuk.
 */
function getClientConfigs_() {
  const props = PropertiesService.getScriptProperties();
  return {
    HAYDECOR: {
      label: 'Haydecor',
      sheetId: props.getProperty('HAYDECOR_SHEET_ID'),
      chatId: props.getProperty('HAYDECOR_CHAT_ID'),
      waTarget: props.getProperty('HAYDECOR_WA_GROUP_ID')
    },
    RHA: {
      label: 'RHA Gallery',
      sheetId: props.getProperty('RHA_SHEET_ID'),
      chatId: props.getProperty('RHA_CHAT_ID'),
      waTarget: props.getProperty('RHA_WA_GROUP_ID')
    }
  };
}

function getTelegramBotToken_() {
  return PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
}

function getFonnteToken_() {
  return PropertiesService.getScriptProperties().getProperty('FONNTE_TOKEN');
}

/**
 * Normalisasi cell tanggal jadi string 'yyyy-MM-dd' supaya perbandingan aman.
 * Google Sheets otomatis convert string tanggal jadi Date object saat dibaca,
 * jadi perbandingan string mentah bisa gagal kalau tidak dinormalisasi dulu.
 */
function normalizeCellDate_(cellValue) {
  if (cellValue instanceof Date) {
    return Utilities.formatDate(cellValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(cellValue).trim();
}

function formatDateKey_(dateObj) {
  return Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Cek apakah HARI INI (saat trigger dijalankan) adalah hari Minggu.
 * Dipakai untuk skip pengiriman report di trigger function.
 * getDay(): 0 = Minggu, 1 = Senin, ..., 6 = Sabtu.
 */
function isTodaySunday_() {
  return new Date().getDay() === 0;
}
