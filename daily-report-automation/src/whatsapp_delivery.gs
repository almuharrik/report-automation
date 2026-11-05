/**
 * ============================================================
 * WHATSAPP_DELIVERY.GS — Delivery via Fonnte API (target: Group WhatsApp)
 * ============================================================
 * Reuse getDailyOverview(), getDailyMTD(), dan generateTelegramMessage()
 * yang sudah ada — isi pesan sama persis dengan yang dikirim ke Telegram,
 * cuma beda jalur pengiriman.
 *
 * Target pengiriman = Group ID WhatsApp (bukan nomor pribadi), format
 * diakhiri "@g.us". Cara dapat Group ID: lihat whatsapp_group_setup.gs.
 *
 * Setup Fonnte: 1 device/token untuk semua client, beda hanya Group ID
 * tujuan per client. Trigger dipasang TERPISAH dari Telegram.
 * ============================================================
 */

/**
 * sendWhatsAppReport(clientKey)
 * Ambil data, generate pesan (reuse generateTelegramMessage), kirim
 * lewat Fonnte API ke grup WhatsApp client tsb.
 */
function sendWhatsAppReport(clientKey) {
  const client = getClientConfigs_()[clientKey];
  if (!client) throw new Error('Client key tidak dikenal: ' + clientKey);

  const fonnteToken = getFonnteToken_();
  if (!fonnteToken) throw new Error('FONNTE_TOKEN belum diisi di Script Properties.');
  if (!client.waTarget) throw new Error('Group ID WhatsApp untuk ' + clientKey + ' belum diisi di Script Properties (HAYDECOR_WA_GROUP_ID / RHA_WA_GROUP_ID).');

  const dailyOverview = getDailyOverview(clientKey);
  const dailyMTD = getDailyMTD(clientKey);
  const message = generateTelegramMessage(client.label, dailyOverview, dailyMTD);

  const url = 'https://api.fonnte.com/send';
  const options = {
    method: 'post',
    headers: { 'Authorization': fonnteToken },
    payload: {
      target: client.waTarget,
      message: message
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    throw new Error('Gagal kirim WhatsApp untuk ' + clientKey + '. Response: ' + responseText);
  }

  // Fonnte tetap bisa balas HTTP 200 walau gagal proses internal,
  // jadi cek juga field "status" di body JSON kalau ada.
  try {
    const parsed = JSON.parse(responseText);
    if (parsed.status === false) {
      throw new Error('Fonnte menolak pengiriman untuk ' + clientKey + '. Response: ' + responseText);
    }
  } catch (parseErr) {
    // kalau response bukan JSON valid, biarkan lanjut — sudah dicek responseCode di atas
  }

  Logger.log('WhatsApp report terkirim untuk ' + clientKey + ': ' + responseText);
  return responseText;
}

/**
 * Kirim untuk SEMUA client aktif secara berurutan.
 * Pasang di trigger terpisah dari runDailyTelegramReportAll (waktu bebas).
 * Error di 1 client tidak menghentikan pengiriman ke client lain.
 */
function runDailyWhatsAppReportAll() {
  if (isTodaySunday_()) {
    Logger.log('Hari ini Minggu — Daily WhatsApp Report di-skip.');
    return;
  }

  const configs = getClientConfigs_();
  Object.keys(configs).forEach(function (clientKey) {
    try {
      sendWhatsAppReport(clientKey);
    } catch (err) {
      Logger.log('ERROR WhatsApp client ' + clientKey + ': ' + err.message);
    }
  });
}

/**
 * Wrapper per client — supaya bisa langsung di-klik "Run" di editor
 * tanpa error "Client key tidak dikenal: undefined". Fungsi sendWhatsAppReport()
 * dan sendTelegramReport() butuh parameter, sehingga TIDAK BOLEH di-run
 * langsung lewat tombol Run (Apps Script memanggilnya tanpa argumen).
 */
function sendWhatsAppReport_Haydecor() {
  sendWhatsAppReport('HAYDECOR');
}

function sendWhatsAppReport_RHA() {
  sendWhatsAppReport('RHA');
}

/**
 * Test manual sebelum pasang trigger. Jalankan dari editor:
 * testSendWhatsApp()
 */
function testSendWhatsApp() {
  ['HAYDECOR', 'RHA'].forEach(function (clientKey) {
    try {
      sendWhatsAppReport(clientKey);
      Logger.log(clientKey + ': WhatsApp terkirim.');
    } catch (err) {
      Logger.log(clientKey + ' ERROR: ' + err.message);
    }
  });
}
