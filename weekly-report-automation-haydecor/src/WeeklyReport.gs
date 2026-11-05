// ============================================================
// WEEKLY PERFORMANCE REPORT v2.0 — HAYDECOR
// Google Apps Script
// Architecture  : Summary Sheets → Parser → Narrative → HTML Email
// Output        : HTML Email (GmailApp)
// Sheets        : KPI_PROGRESS | Weekly_Overview | Channel_Weekly
// ============================================================

// ── CONFIG ──────────────────────────────────────────────────
const CONFIG = {
  EMAIL: {
    RECIPIENT : "humamraffi@gmail.com",   // ← ganti / tambah penerima
    CC        : "",                             // ← opsional
    SENDER    : "M H Almuharrik",
    TITLE     : "Performance Marketing Consultant",
    BRAND     : "Haydecor",
  },

  // Warna brand untuk HTML email
  COLORS: {
    PRIMARY   : "#1a56db",   // biru
    SUCCESS   : "#057a55",   // hijau
    WARNING   : "#c27803",   // kuning
    DANGER    : "#c81e1e",   // merah
    NEUTRAL   : "#374151",   // abu gelap
    BG_HEADER : "#1e3a5f",   // navy header email
    BG_SECTION: "#f9fafb",   // abu terang background section
    BG_TABLE  : "#ffffff",
    BORDER    : "#e5e7eb",
  },
};

// ── TIMEZONE ─────────────────────────────────────────────────
const TZ = "Asia/Jakarta";

// ── ENTRY POINT ──────────────────────────────────────────────
/**
 * Fungsi utama. Run manual atau via trigger Senin 08.00.
 */
function sendWeeklyReport() {
  const kpi     = getKPIProgress();
  const weekly  = getWeeklyOverview();
  const channel = getChannelWeekly();

  const html    = buildEmailHTML(kpi, weekly, channel);
  const subject = buildSubject(weekly);

  GmailApp.sendEmail(CONFIG.EMAIL.RECIPIENT, subject, "", {
    htmlBody : html,
    cc       : CONFIG.EMAIL.CC || undefined,
    name     : CONFIG.EMAIL.SENDER,
  });

  Logger.log("Weekly report sent: " + subject);
}

// ── TRIGGER SETUP ─────────────────────────────────────────────
/**
 * Jalankan sekali untuk pasang trigger otomatis tiap Senin 08.00.
 */
function setupWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "sendWeeklyReport") {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger("sendWeeklyReport")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();
  Logger.log("Trigger terpasang: sendWeeklyReport setiap Senin 08.00 WIB.");
}

// ── DATA PARSERS ─────────────────────────────────────────────

function getKPIProgress() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("KPI_PROGRESS");
  const data  = sheet.getDataRange().getValues();
  data.shift();

  const kpi = {};
  data.forEach(row => {
    const metric = row[0];
    if (!metric) return;
    kpi[metric] = {
      current  : row[1],
      target   : row[2],
      expected : row[3],
      status   : String(row[4] || ""),
      progress : row[5],
    };
  });
  return kpi;
}

/**
 * Parse tanggal dari Google Sheets yang bisa berupa:
 * - Date object (kalau kolom diformat sebagai Date di Sheets)
 * - String "dd/MM/yyyy" (kalau kolom diformat sebagai Plain Text)
 * Kembalikan string "yyyy-MM-dd" atau null kalau kosong / invalid.
 */
function parseSheetDate_(val) {
  if (val === null || val === undefined || val === "") return null;

  // Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return Utilities.formatDate(val, TZ, "yyyy-MM-dd");
  }

  // Number — serial date Excel/Sheets (epoch: 30 Des 1899)
  if (typeof val === "number") {
    const epoch  = new Date(1899, 11, 30).getTime();
    const parsed = new Date(epoch + val * 86400000);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, TZ, "yyyy-MM-dd");
    }
  }

  // String format dd/MM/yyyy
  const str   = String(val).trim();
  const parts = str.split("/");
  if (parts.length === 3) {
    const d      = parseInt(parts[0], 10);
    const m      = parseInt(parts[1], 10) - 1;
    const y      = parseInt(parts[2], 10);
    const parsed = new Date(y, m, d);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, TZ, "yyyy-MM-dd");
    }
  }

  return null;
}

function getWeeklyOverview() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Weekly_Overview");
  let data = sheet.getDataRange().getValues();
  data.shift();
  data = data.filter(r => r[0] !== "");

  const today         = new Date();
  const currentMonday = new Date(today);
  const day           = currentMonday.getDay();
  const diff          = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
  currentMonday.setDate(diff);
  currentMonday.setHours(0, 0, 0, 0);

  const completed = data.filter(r => new Date(r[0]) < currentMonday);
  const last      = completed[completed.length - 1];
  const prior     = completed[completed.length - 2];

  const parseRow = row => {
    // Weekstart dari row[0] — selalu Date object hasil getValues()
    const weekStart = row[0] instanceof Date ? row[0] : new Date(row[0]);
    // Weekend = Weekstart + 6 hari, dihitung langsung di script
    const weekEnd   = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    return {
      week      : Utilities.formatDate(weekStart, TZ, "yyyy-MM-dd"),
      weekend   : Utilities.formatDate(weekEnd,   TZ, "yyyy-MM-dd"),
      spend     : row[1],
      revenue   : row[2],
      acr       : row[3],
      wowRevenue: row[4],
      wowSpend  : row[5],
      wowACR    : row[6],
    };
  };

  return {
    lastWeek : parseRow(last),
    priorWeek: parseRow(prior),
  };
}

function getChannelWeekly() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Channel_Weekly");
  let data = sheet.getDataRange().getValues();
  data.shift();
  data = data.filter(r => r[0] !== "");

  const latestWeek = Utilities.formatDate(
    data[data.length - 1][0], TZ, "yyyy-MM-dd"
  );

  const currentWeekData = data.filter(r =>
    Utilities.formatDate(r[0], TZ, "yyyy-MM-dd") === latestWeek
  );

  const channels = [];
  let topRevenue = null, highestROAS = null, decliningROAS = null;

  currentWeekData.forEach(r => {
    const ch = {
      channel   : r[1],
      spend     : r[2],
      revenueAds: r[3],
      roas      : r[4],
      spendWow  : r[5],
      revenueWow: r[6],
      roasWow   : r[7],
    };
    channels.push(ch);

    if (!topRevenue   || r[3] > topRevenue.revenue)    topRevenue   = { channel: r[1], revenue: r[3] };
    if (!highestROAS  || r[4] > highestROAS.roas)       highestROAS  = { channel: r[1], roas: r[4] };
    if (r[7] < 0 && (!decliningROAS || r[7] < decliningROAS.roasWow)) decliningROAS = { channel: r[1], roasWow: r[7] };
  });

  return { latestWeek, channels, topRevenueChannel: topRevenue, highestROASChannel: highestROAS, decliningChannel: decliningROAS };
}

// ── FORMATTERS ───────────────────────────────────────────────

function fmtRp(n) {
  return "Rp" + Intl.NumberFormat("id-ID").format(Math.round(n || 0));
}

function fmtPct(n, decimals) {
  return ((n || 0) * 100).toFixed(decimals || 1) + "%";
}

function fmtX(n) {
  return (n || 0).toFixed(2) + "x";
}

function fmtDateID(dateStr) {
  const d = new Date(dateStr);
  return Utilities.formatDate(d, TZ, "dd MMMM yyyy");
}

/**
 * Kembalikan objek { arrow, color, label } berdasarkan nilai WoW (desimal)
 * lowerIsBetter = true untuk metric seperti ACR (turun = bagus)
 */
function wowBadge(val, lowerIsBetter) {
  const C = CONFIG.COLORS;
  if (val === null || val === undefined) return { arrow: "—", color: C.NEUTRAL, label: "—" };
  const pct   = (val * 100).toFixed(1);
  const up    = val > 0;
  const good  = lowerIsBetter ? !up : up;
  const arrow = up ? "▲" : "▼";
  const color = val === 0 ? C.NEUTRAL : good ? C.SUCCESS : C.DANGER;
  return { arrow, color, label: `${arrow} ${Math.abs(pct)}% WoW` };
}

function statusColor(status) {
  const C = CONFIG.COLORS;
  if (!status) return C.NEUTRAL;
  if (status.includes("Healthy"))   return C.SUCCESS;
  if (status.includes("On Track"))  return C.SUCCESS;
  if (status.includes("Watchlist")) return C.WARNING;
  return C.DANGER;
}

function statusLabel(status) {
  if (!status) return "—";
  if (status.includes("Healthy"))   return "✅ Healthy";
  if (status.includes("On Track"))  return "✅ On Track";
  if (status.includes("Watchlist")) return "⚠️ Watchlist";
  return "🔴 Behind";
}

// ── SUBJECT ──────────────────────────────────────────────────

function buildSubject(weekly) {
  const label = fmtDateID(weekly.lastWeek.week);
  return `Weekly Performance Review — ${CONFIG.EMAIL.BRAND} | Week of ${label}`;
}

// ── HTML EMAIL BUILDER ───────────────────────────────────────

function buildEmailHTML(kpi, weekly, channel) {
  const C          = CONFIG.COLORS;
  const lastLabel  = fmtDateID(weekly.lastWeek.week);
  const lastEndLabel = weekly.lastWeek.weekend ? fmtDateID(weekly.lastWeek.weekend) : null;
  const periodLabel  = lastEndLabel ? `${lastLabel} – ${lastEndLabel}` : lastLabel;
  const priorLabel = fmtDateID(weekly.priorWeek.week);
  const today      = Utilities.formatDate(new Date(), TZ, "dd MMMM yyyy");

  const wRev  = wowBadge(weekly.lastWeek.wowRevenue, false);
  const wSpend= wowBadge(weekly.lastWeek.wowSpend,   true);
  const wACR  = wowBadge(weekly.lastWeek.wowACR,     true);

  // ── Narrative helpers ────────────────────────────────────────
  function revenueNarrative() {
    const rev   = weekly.lastWeek.wowRevenue;
    const spend = weekly.lastWeek.wowSpend;
    const dir   = rev >= 0 ? "tumbuh" : "turun";
    const spDir = spend >= 0 ? "peningkatan" : "penurunan";
    const pctRev   = Math.abs((rev   * 100)).toFixed(1);
    const pctSpend = Math.abs((spend * 100)).toFixed(1);

    return `Revenue pekan ini (${lastLabel}) tercatat sebesar <strong>${fmtRp(weekly.lastWeek.revenue)}</strong>, ` +
      `${dir} <strong>${pctRev}%</strong> dibanding pekan sebelumnya, ` +
      `seiring dengan ${spDir} spend sebesar ${pctSpend}%.`;
  }

  function acrNarrative() {
    const acr = weekly.lastWeek.acr;
    const acrWow = weekly.lastWeek.wowACR;
    if (acr === null || acr === undefined) return "";
    const level = acr <= 0.10 ? "berada dalam level yang sehat"
                : acr <= 0.14 ? "perlu dipantau agar tidak melewati batas ideal"
                : "sudah melewati batas ideal dan perlu perhatian";
    const dir   = acrWow < 0 ? "membaik" : "meningkat";
    return `Blended ACR pekan ini tercatat <strong>${fmtPct(acr)}</strong> — ${level}. ` +
      `ACR ${dir} ${Math.abs((acrWow * 100)).toFixed(1)}% dibanding pekan sebelumnya.`;
  }

  function kpiProgressNarrative() {
    if (!kpi.Revenue) return "";
    const status = kpi.Revenue.status;
    const prog   = fmtPct(kpi.Revenue.progress);
    if (status.includes("On Track")) {
      return `Revenue bulan berjalan telah mencapai <strong>${prog}</strong> dari target bulanan dan berada dalam pacing yang sehat.`;
    } else if (status.includes("Watchlist")) {
      return `Revenue bulan berjalan telah mencapai <strong>${prog}</strong> dari target bulanan, namun masih sedikit di bawah expected pacing — perlu akselerasi di pekan-pekan berikutnya.`;
    }
    return `Revenue bulan berjalan baru mencapai <strong>${prog}</strong> dari target bulanan dan masih jauh dari expected pacing — diperlukan review strategi segera.`;
  }

  function watchlistNarrative() {
  if (!channel.decliningChannel || channel.decliningChannel.roasWow >= 0) {
    return "Seluruh channel mencatatkan peningkatan ROAS pekan ini — tidak ada channel yang masuk watchlist.";
  }
  const ch  = channel.decliningChannel.channel;
  const pct = Math.abs((channel.decliningChannel.roasWow * 100)).toFixed(1);
  return `<strong>${ch}</strong> mengalami penurunan efisiensi terbesar pekan ini dengan ROAS turun ${pct}% WoW — perlu review bid strategy atau komposisi audience.`;
}

  // ── HTML Blocks ───────────────────────────────────────────────

  // KPI Progress rows
  const kpiRows = [
    { label: "Revenue",  key: "Revenue",  fmt: v => fmtRp(v),     lowerBetter: false },
    { label: "Spend",    key: "Spend",    fmt: v => fmtRp(v),     lowerBetter: true  },
    { label: "ACR",      key: "ACR",      fmt: v => fmtPct(v),    lowerBetter: true  },
  ].map(item => {
    const d = kpi[item.key];
    if (!d) return "";
    const sc = statusColor(d.status);
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};font-weight:600;color:${C.NEUTRAL}">${item.label}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right">${item.fmt(d.current)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right;color:#6b7280">${item.fmt(d.target)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right;color:#6b7280">${item.fmt(d.expected)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:center">
          <span style="background:${sc}18;color:${sc};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap">${statusLabel(d.status)}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right;font-weight:700">${fmtPct(d.progress)}</td>
      </tr>`;
  }).join("");

  // Channel rows
  const channelRows = channel.channels.map(ch => {
    const wR = wowBadge(ch.revenueWow, false);
    const wRoas = wowBadge(ch.roasWow, false);
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};font-weight:600;color:${C.NEUTRAL}">${ch.channel}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right">${fmtRp(ch.spend)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right">${fmtRp(ch.revenueAds)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right;color:${wR.color};font-weight:600">${wR.label}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right;font-weight:700">${fmtX(ch.roas)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid ${C.BORDER};text-align:right;color:${wRoas.color};font-weight:600">${wRoas.label}</td>
      </tr>`;
  }).join("");

  // ── WoW KPI Summary cards ─────────────────────────────────────
  function kpiCard(label, value, badge) {
    return `
      <td style="width:33%;padding:0 6px">
        <div style="background:#fff;border:1px solid ${C.BORDER};border-radius:8px;padding:16px 18px">
          <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${label}</div>
          <div style="font-size:20px;font-weight:700;color:${C.NEUTRAL};margin-bottom:4px">${value}</div>
          <div style="font-size:12px;font-weight:600;color:${badge.color}">${badge.label}</div>
        </div>
      </td>`;
  }

  // ── FULL HTML ─────────────────────────────────────────────────
  return `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;color:${C.NEUTRAL}">

<div style="max-width:680px;margin:24px auto;background:#f3f4f6">

  <!-- ── HEADER ── -->
  <div style="background:${C.BG_HEADER};border-radius:10px 10px 0 0;padding:28px 32px">
    <div style="font-size:11px;color:#93c5fd;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Weekly Performance Review</div>
    <div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:4px">${CONFIG.EMAIL.BRAND}</div>
    <div style="font-size:13px;color:#93c5fd">Periode ${periodLabel} &nbsp;·&nbsp; Dibuat: ${today}</div>
  </div>

  <!-- ── GREETING ── -->
  <div style="background:#fff;padding:24px 32px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">
    <p style="margin:0 0 10px;font-size:14px;line-height:1.7">Yth. Tim ${CONFIG.EMAIL.BRAND},</p>
    <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563">
      Berikut kami sampaikan <strong>Weekly Performance Review</strong> untuk periode <strong>${periodLabel}</strong>.
      Laporan ini mencakup progress terhadap target bulanan, review performa mingguan, dan analisis per channel ads.
    </p>
  </div>

  <!-- ════════════════════════════════════════════ -->
  <!-- SECTION 1: PROGRESS TO TARGET               -->
  <!-- ════════════════════════════════════════════ -->
  <div style="background:${C.BG_SECTION};padding:8px 32px 4px;margin-top:2px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">
    <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em">01</div>
    <div style="font-size:16px;font-weight:700;color:${C.NEUTRAL};margin-bottom:2px">Progress to Target</div>
    <div style="height:2px;width:36px;background:${C.PRIMARY};border-radius:2px;margin-bottom:14px"></div>
  </div>

  <div style="background:#fff;padding:4px 32px 20px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">
    <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:16px 0 16px">
      ${kpiProgressNarrative()}
    </p>

    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:${C.BG_SECTION}">
          <th style="padding:10px 14px;text-align:left;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Metric</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Aktual</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Target</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Expected</th>
          <th style="padding:10px 14px;text-align:center;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Status</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Progress</th>
        </tr>
      </thead>
      <tbody>${kpiRows}</tbody>
    </table>
    </div>
  </div>

  <!-- ════════════════════════════════════════════ -->
  <!-- SECTION 2: WEEKLY REVIEW                    -->
  <!-- ════════════════════════════════════════════ -->
  <div style="background:${C.BG_SECTION};padding:8px 32px 4px;margin-top:2px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">
    <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em">02</div>
    <div style="font-size:16px;font-weight:700;color:${C.NEUTRAL};margin-bottom:2px">Weekly Review</div>
    <div style="height:2px;width:36px;background:${C.PRIMARY};border-radius:2px;margin-bottom:14px"></div>
  </div>

  <div style="background:#fff;padding:4px 32px 20px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">

    <!-- KPI Cards -->
    <table style="width:100%;border-collapse:collapse;margin:16px 0 20px">
      <tr>
        ${kpiCard("Revenue", fmtRp(weekly.lastWeek.revenue), wRev)}
        ${kpiCard("Ad Spend", fmtRp(weekly.lastWeek.spend), wSpend)}
        ${kpiCard("Ad Cost Ratio", fmtPct(weekly.lastWeek.acr), wACR)}
      </tr>
    </table>

    <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 10px">
      ${revenueNarrative()}
    </p>
    <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0">
      ${acrNarrative()}
    </p>
  </div>

  <!-- ════════════════════════════════════════════ -->
  <!-- SECTION 3: CHANNEL PERFORMANCE              -->
  <!-- ════════════════════════════════════════════ -->
  <div style="background:${C.BG_SECTION};padding:8px 32px 4px;margin-top:2px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">
    <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em">03</div>
    <div style="font-size:16px;font-weight:700;color:${C.NEUTRAL};margin-bottom:2px">Channel Performance</div>
    <div style="height:2px;width:36px;background:${C.PRIMARY};border-radius:2px;margin-bottom:14px"></div>
  </div>

  <div style="background:#fff;padding:4px 32px 20px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">

    <!-- Highlights -->
    <div style="display:flex;gap:12px;margin:16px 0 20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="width:50%;padding:0 6px 0 0">
            <div style="background:#eff6ff;border-left:3px solid ${C.PRIMARY};border-radius:0 6px 6px 0;padding:12px 14px">
              <div style="font-size:11px;color:${C.PRIMARY};font-weight:700;margin-bottom:2px">TOP REVENUE</div>
              <div style="font-size:14px;font-weight:700;color:${C.NEUTRAL}">${channel.topRevenueChannel ? channel.topRevenueChannel.channel : "—"}</div>
            </div>
          </td>
          <td style="width:50%;padding:0 0 0 6px">
            <div style="background:#f0fdf4;border-left:3px solid ${C.SUCCESS};border-radius:0 6px 6px 0;padding:12px 14px">
              <div style="font-size:11px;color:${C.SUCCESS};font-weight:700;margin-bottom:2px">HIGHEST ROAS</div>
              <div style="font-size:14px;font-weight:700;color:${C.NEUTRAL}">${channel.highestROASChannel ? channel.highestROASChannel.channel + " · " + fmtX(channel.highestROASChannel.roas) : "—"}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:${C.BG_SECTION}">
          <th style="padding:10px 14px;text-align:left;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Channel</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Spend</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Revenue</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">Rev WoW</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">ROAS</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700;color:#6b7280;border-bottom:2px solid ${C.BORDER}">ROAS WoW</th>
        </tr>
      </thead>
      <tbody>${channelRows}</tbody>
    </table>
    </div>
  </div>

  <!-- ════════════════════════════════════════════ -->
  <!-- SECTION 4: WATCHLIST                        -->
  <!-- ════════════════════════════════════════════ -->
  <div style="background:${C.BG_SECTION};padding:8px 32px 4px;margin-top:2px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">
    <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em">04</div>
    <div style="font-size:16px;font-weight:700;color:${C.NEUTRAL};margin-bottom:2px">Watchlist</div>
    <div style="height:2px;width:36px;background:#f59e0b;border-radius:2px;margin-bottom:14px"></div>
  </div>

  <div style="background:#fff;padding:4px 32px 24px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER}">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-top:16px">
      <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px">⚠️ Perlu Perhatian</div>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#78350f">${watchlistNarrative()}</p>
    </div>
  </div>

  <!-- ── CTA LOOKER STUDIO ── -->
  <div style="background:#fff;padding:20px 32px 28px;border-left:1px solid ${C.BORDER};border-right:1px solid ${C.BORDER};margin-top:2px;text-align:center">
    <p style="margin:0 0 14px;font-size:13px;color:#6b7280">Untuk breakdown data yang lebih lengkap, silakan akses dashboard di bawah ini.</p>
    <a href="https://datastudio.google.com/s/gA-SrUxc_kU"
       style="display:inline-block;background:${C.PRIMARY};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;letter-spacing:0.02em">
      Lihat Full Dashboard →
    </a>
  </div>

  <!-- ── FOOTER ── -->
  <div style="background:${C.BG_HEADER};border-radius:0 0 10px 10px;padding:20px 32px">
    <p style="margin:0 0 6px;font-size:13px;color:#93c5fd;font-weight:600">${CONFIG.EMAIL.SENDER}</p>
    <p style="margin:0;font-size:12px;color:#6b7280">${CONFIG.EMAIL.TITLE}</p>
    <p style="margin:10px 0 0;font-size:11px;color:#4b5563;border-top:1px solid #2d4a6e;padding-top:10px">
      Email ini di-generate secara otomatis. Data bersumber dari sistem tracking internal ${CONFIG.EMAIL.BRAND}.
    </p>
  </div>

</div>
</body>
</html>`;
}

function debugWeekend() {
  const weekly = getWeeklyOverview();
  Logger.log("week     : " + weekly.lastWeek.week);
  Logger.log("weekend  : " + weekly.lastWeek.weekend);
  Logger.log("all keys : " + Object.keys(weekly.lastWeek).join(", "));
}


// ── TEST FUNCTIONS ────────────────────────────────────────────

function testKPI()      { Logger.log(JSON.stringify(getKPIProgress(),    null, 2)); }
function testWeekly()   { Logger.log(JSON.stringify(getWeeklyOverview(),  null, 2)); }
function testChannel()  { Logger.log(JSON.stringify(getChannelWeekly(),   null, 2)); }
function testPreview()  { Logger.log(buildEmailHTML(getKPIProgress(), getWeeklyOverview(), getChannelWeekly())); }
