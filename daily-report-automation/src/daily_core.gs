/**
 * ============================================================
 * DAILY_CORE.GS — Data retrieval & calculation
 * Semua fungsi di sini PURE (tidak mengirim apapun), gampang di-test
 * lewat daily_testing.gs sebelum dipakai oleh telegram_delivery.gs.
 * ============================================================
 */

/**
 * Baca seluruh isi Table_Consolidated jadi array of objects.
 * Grain per baris: 1 tanggal x 1 channel (termasuk row "Shopee" total marker).
 * Header wajib: Tanggal | Channel | Cost | Revenue Ads | Revenue | ...
 */
function readConsolidatedRows_(sheetId) {
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(SHEET_NAME_CONSOLIDATED);
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME_CONSOLIDATED + '" tidak ditemukan di spreadsheet ' + sheetId);
  }

  const values = sheet.getDataRange().getValues();
  const header = values[0];

  const idx = {
    tanggal: header.indexOf('Tanggal'),
    channel: header.indexOf('Channel'),
    cost: header.indexOf('Cost'),
    revenueAds: header.indexOf('Revenue Ads'),
    revenue: header.indexOf('Revenue')
  };

  Object.keys(idx).forEach(function (key) {
    if (idx[key] === -1) {
      throw new Error('Kolom "' + key + '" tidak ditemukan di header Table_Consolidated. Header aktual: ' + header.join(', '));
    }
  });

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[idx.tanggal]) continue; // skip baris kosong
    rows.push({
      dateKey: normalizeCellDate_(r[idx.tanggal]),
      channel: String(r[idx.channel]).trim(),
      cost: Number(r[idx.cost]) || 0,
      revenueAds: Number(r[idx.revenueAds]) || 0,
      revenue: Number(r[idx.revenue]) || 0
    });
  }
  return rows;
}

/**
 * Daily Report Date = kemarin, relatif ke waktu script dijalankan
 * (pakai timezone project, Project Settings > General).
 */
function getDailyReportDate_() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
}

/**
 * getDailyOverview(clientKey)
 * Ambil performa daily closing (kemarin) untuk 1 client.
 * clientKey: 'HAYDECOR' | 'RHA'
 */
function getDailyOverview(clientKey) {
  const client = getClientConfigs_()[clientKey];
  if (!client) throw new Error('Client key tidak dikenal: ' + clientKey);
  if (!client.sheetId) throw new Error('Sheet ID untuk ' + clientKey + ' belum diisi di Script Properties.');

  const reportDate = getDailyReportDate_();
  const dateKey = formatDateKey_(reportDate);

  const allRows = readConsolidatedRows_(client.sheetId);
  const todayRows = allRows.filter(function (r) { return r.dateKey === dateKey; });

  // Total revenue marketplace (row marker "Shopee")
  const totalRevenueRow = todayRows.find(function (r) { return r.channel === TOTAL_REVENUE_MARKER; });
  const totalRevenue = totalRevenueRow ? totalRevenueRow.revenue : 0;

  // Channel performance — hanya AD_CHANNELS, exclude row marker total.
  // hasData = pernah ada aktivitas (cost>0 atau revenueAds>0) di sheet ini
  // sampai dengan reportDate. Dipakai untuk auto-hide channel yang belum
  // berjalan (misal TikTok Ads) dari pesan Telegram, sampai channel itu
  // benar-benar mulai punya data.
  const channels = AD_CHANNELS.map(function (ch) {
    const row = todayRows.find(function (r) { return r.channel === ch.sheetName; });
    const hasLaunched = allRows.some(function (r) {
      return r.channel === ch.sheetName && r.dateKey <= dateKey && (r.cost > 0 || r.revenueAds > 0);
    });
    return {
      name: ch.label,
      spend: row ? row.cost : 0,
      revenue: row ? row.revenueAds : 0,
      hasData: hasLaunched
    };
  });

  const totalSpend = channels.reduce(function (sum, c) { return sum + c.spend; }, 0);
  const totalRevenueAds = channels.reduce(function (sum, c) { return sum + c.revenue; }, 0);

  const acr = totalRevenue > 0 ? (totalSpend / totalRevenue) * 100 : 0;
  const roas = totalSpend > 0 ? (totalRevenueAds / totalSpend) : 0;

  const nonAdsRevenue = totalRevenue - totalRevenueAds;
  const nonAdsContribution = totalRevenue > 0 ? (nonAdsRevenue / totalRevenue) * 100 : 0;

  return {
    date: reportDate,
    dateLabel: Utilities.formatDate(reportDate, Session.getScriptTimeZone(), 'dd MMM yyyy'),
    summary: {
      revenue: totalRevenue,
      spend: totalSpend,
      acr: acr,
      roas: roas,
      nonAdsRevenue: nonAdsRevenue,
      nonAdsContribution: nonAdsContribution
    },
    channels: channels
  };
}

/**
 * getDailyMTD(clientKey)
 * MTD dari tanggal 1 bulan Daily Report Date sampai Daily Report Date (inclusive).
 * PENTING: bulan ikut Daily Report Date (kemarin), BUKAN tanggal bot dijalankan.
 * Contoh: bot jalan 1 Jun -> Daily Report Date 31 Mei -> MTD 1-31 Mei.
 *
 * ASUMSI PERLU DIVERIFIKASI SAAT TESTING:
 * Revenue MTD dijumlah HANYA dari row TOTAL_REVENUE_MARKER ("Shopee"),
 * bukan dari semua channel, supaya tidak double count. Cek angka hasil
 * testDailyMTD() terhadap MTD yang kamu tahu benar sebelum go-live.
 */
function getDailyMTD(clientKey) {
  const client = getClientConfigs_()[clientKey];
  if (!client) throw new Error('Client key tidak dikenal: ' + clientKey);
  if (!client.sheetId) throw new Error('Sheet ID untuk ' + clientKey + ' belum diisi di Script Properties.');

  const reportDate = getDailyReportDate_();
  const monthStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);

  const startKey = formatDateKey_(monthStart);
  const endKey = formatDateKey_(reportDate);

  const allRows = readConsolidatedRows_(client.sheetId);
  const rangeRows = allRows.filter(function (r) { return r.dateKey >= startKey && r.dateKey <= endKey; });

  const revenueMTD = rangeRows
    .filter(function (r) { return r.channel === TOTAL_REVENUE_MARKER; })
    .reduce(function (sum, r) { return sum + r.revenue; }, 0);

  const spendMTD = rangeRows
    .filter(function (r) { return getAdChannelSheetNames_().indexOf(r.channel) !== -1; })
    .reduce(function (sum, r) { return sum + r.cost; }, 0);

  const acrMTD = revenueMTD > 0 ? (spendMTD / revenueMTD) * 100 : 0;

  return {
    periodLabel: Utilities.formatDate(monthStart, Session.getScriptTimeZone(), 'dd MMM') +
      ' - ' + Utilities.formatDate(reportDate, Session.getScriptTimeZone(), 'dd MMM yyyy'),
    revenue: revenueMTD,
    spend: spendMTD,
    acr: acrMTD
  };
}
