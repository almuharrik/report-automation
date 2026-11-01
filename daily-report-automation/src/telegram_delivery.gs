/**
 * ============================================================
 * TELEGRAM_DELIVERY.GS — Formatting & sending
 * ============================================================
 */

function formatRupiah_(num) {
  return 'Rp' + Math.round(num).toLocaleString('id-ID');
}

function formatPercent_(num) {
  return num.toFixed(1) + '%';
}

function formatChannelRoas_(spend, revenue) {
  // Jika spend channel = 0, ROAS ditampilkan sebagai '-'
  if (spend === 0) return '-';
  return (revenue / spend).toFixed(1) + 'x';
}

/**
 * generateTelegramMessage(clientLabel, dailyOverview, dailyMTD)
 * Format sesuai spesifikasi: Rp pemisah ribuan ID, persen & ROAS 1 desimal.
 */
function generateTelegramMessage(clientLabel, dailyOverview, dailyMTD) {
  const s = dailyOverview.summary;

  let msg = '';
  msg += '📊 Daily Ads Snapshot — ' + clientLabel + '\n';
  msg += dailyOverview.dateLabel + '\n\n';

  msg += '📈 Daily Performance\n';
  msg += 'Revenue : ' + formatRupiah_(s.revenue) + '\n';
  msg += 'Spend   : ' + formatRupiah_(s.spend) + '\n';
  msg += 'ACR     : ' + formatPercent_(s.acr) + '\n';
  msg += 'ROAS    : ' + (s.spend > 0 ? s.roas.toFixed(1) + 'x' : '-') + '\n\n';

  msg += '📡 Channel Performance\n';
  // Channel yang belum pernah punya aktivitas (hasData=false, misal TikTok Ads
  // yang belum live) disembunyikan dulu — otomatis muncul begitu ada datanya.
  const activeChannels = dailyOverview.channels.filter(function (c) { return c.hasData; });
  activeChannels.forEach(function (c, i) {
    msg += '• ' + c.name + '\n';
    msg += '  Spend       : ' + formatRupiah_(c.spend) + '\n';
    msg += '  Revenue Ads : ' + formatRupiah_(c.revenue) + '\n';
    msg += '  ROAS        : ' + formatChannelRoas_(c.spend, c.revenue) + '\n';
    if (i < activeChannels.length - 1) msg += '\n';
  });
  msg += '\n';

  msg += '🗓️ MTD (' + dailyMTD.periodLabel + ')\n';
  msg += 'Revenue : ' + formatRupiah_(dailyMTD.revenue) + '\n';
  msg += 'Spend   : ' + formatRupiah_(dailyMTD.spend) + '\n';
  msg += 'ACR     : ' + formatPercent_(dailyMTD.acr) + '\n';

  return msg;
}

/**
 * sendTelegramReport(clientKey)
 * Ambil data, generate pesan, kirim ke chat Telegram client tsb.
 */
function sendTelegramReport(clientKey) {
  const client = getClientConfigs_()[clientKey];
  if (!client) throw new Error('Client key tidak dikenal: ' + clientKey);

  const botToken = getTelegramBotToken_();
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN belum diisi di Script Properties.');
  if (!client.chatId) throw new Error('Chat ID untuk ' + clientKey + ' belum diisi di Script Properties.');

  const dailyOverview = getDailyOverview(clientKey);
  const dailyMTD = getDailyMTD(clientKey);
  const message = generateTelegramMessage(client.label, dailyOverview, dailyMTD);

  const url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: client.chatId, text: message }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    throw new Error('Gagal kirim Telegram untuk ' + clientKey + '. Response: ' + response.getContentText());
  }
  Logger.log('Telegram report terkirim untuk ' + clientKey + ': ' + response.getContentText());
  return response.getContentText();
}

/**
 * Kirim untuk SEMUA client aktif secara berurutan.
 * Ini yang dipasang di scheduled trigger (jalan tiap pagi).
 * Error di 1 client tidak menghentikan pengiriman ke client lain.
 */
function runDailyTelegramReportAll() {
  if (isTodaySunday_()) {
    Logger.log('Hari ini Minggu — Daily Telegram Report di-skip.');
    return;
  }

  const configs = getClientConfigs_();
  Object.keys(configs).forEach(function (clientKey) {
    try {
      sendTelegramReport(clientKey);
    } catch (err) {
      Logger.log('ERROR client ' + clientKey + ': ' + err.message);
    }
  });
}
