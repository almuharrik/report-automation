/**
 * ============================================================
 * DAILY_TESTING.GS — Test functions
 * Jalankan manual satu-satu dari Apps Script editor (klik nama function
 * di dropdown lalu Run), urutannya: testDailyOverview -> testDailyMTD ->
 * testTelegramMessage -> (baru kalau semua OK) testSendTelegram.
 * ============================================================
 */

function testDailyOverview() {
  ['HAYDECOR', 'RHA'].forEach(function (clientKey) {
    try {
      const result = getDailyOverview(clientKey);
      Logger.log(clientKey + ' getDailyOverview():\n' + JSON.stringify(result, null, 2));
    } catch (err) {
      Logger.log(clientKey + ' ERROR: ' + err.message);
    }
  });
}

function testDailyMTD() {
  ['HAYDECOR', 'RHA'].forEach(function (clientKey) {
    try {
      const result = getDailyMTD(clientKey);
      Logger.log(clientKey + ' getDailyMTD():\n' + JSON.stringify(result, null, 2));
    } catch (err) {
      Logger.log(clientKey + ' ERROR: ' + err.message);
    }
  });
}

function testTelegramMessage() {
  const configs = getClientConfigs_();
  Object.keys(configs).forEach(function (clientKey) {
    try {
      const client = configs[clientKey];
      const dailyOverview = getDailyOverview(clientKey);
      const dailyMTD = getDailyMTD(clientKey);
      const message = generateTelegramMessage(client.label, dailyOverview, dailyMTD);
      Logger.log('--- Preview pesan untuk ' + clientKey + ' ---\n' + message);
    } catch (err) {
      Logger.log(clientKey + ' ERROR: ' + err.message);
    }
  });
}

/**
 * DEBUG: cetak raw value Channel & Cost untuk baris tanggal Daily Report Date,
 * lengkap dengan typeof-nya, supaya ketahuan apakah masalahnya nama channel
 * tidak match atau Cost bukan angka murni.
 * Jalankan manual: debugTodayRows('HAYDECOR') atau debugTodayRows('RHA')
 */
function debugTodayRows(clientKey) {
  const client = getClientConfigs_()[clientKey];
  if (!client) throw new Error('Client key tidak dikenal: ' + clientKey);

  const reportDate = getDailyReportDate_();
  const dateKey = formatDateKey_(reportDate);
  Logger.log('Daily Report Date (dateKey): ' + dateKey);

  const ss = SpreadsheetApp.openById(client.sheetId);
  const sheet = ss.getSheetByName(SHEET_NAME_CONSOLIDATED);
  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const idxTanggal = header.indexOf('Tanggal');
  const idxChannel = header.indexOf('Channel');
  const idxCost = header.indexOf('Cost');

  Logger.log('AD_CHANNELS di config: ' + JSON.stringify(AD_CHANNELS));
  Logger.log('--- Baris dengan dateKey cocok ---');

  let found = 0;
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[idxTanggal]) continue;
    const rowDateKey = normalizeCellDate_(r[idxTanggal]);
    if (rowDateKey !== dateKey) continue;

    found++;
    const rawChannel = r[idxChannel];
    const rawCost = r[idxCost];
    Logger.log(
      'Channel="' + rawChannel + '" (len=' + String(rawChannel).length + ') | ' +
      'Cost=' + JSON.stringify(rawCost) + ' (typeof=' + typeof rawCost + ') | ' +
      'Number(Cost)=' + Number(rawCost) + ' | ' +
      'MatchAdChannels=' + (AD_CHANNELS.indexOf(String(rawChannel).trim()) !== -1)
    );
  }
  if (found === 0) {
    Logger.log('TIDAK ADA baris ditemukan untuk dateKey ' + dateKey + ' — cek apakah tanggal di sheet formatnya beda.');
  }
}

/**
 * HATI-HATI: ini betulan mengirim pesan ke Telegram.
 * Pastikan testTelegramMessage() sudah dicek dan Script Properties lengkap.
 */
function testSendTelegram() {
  ['HAYDECOR', 'RHA'].forEach(function (clientKey) {
    try {
      sendTelegramReport(clientKey);
      Logger.log(clientKey + ': terkirim.');
    } catch (err) {
      Logger.log(clientKey + ' ERROR: ' + err.message);
    }
  });
}
