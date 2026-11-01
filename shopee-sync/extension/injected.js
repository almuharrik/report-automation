// Jalan di konteks halaman (MAIN world). Hanya MEMBACA response yang sudah dipanggil halaman Shopee.
// Tidak membuat request apa pun ke Shopee.
(() => {
  if (window.__shopeeAdsSyncInstalled) return;
  window.__shopeeAdsSyncInstalled = true;

  const DAY = 86400;
  const TZ = 7 * 3600 * 1000; // GMT+7
  const NA = -1000000;        // nilai "tidak tersedia" dari API mydata
  const dayStr = (ms) => new Date(ms + TZ).toISOString().slice(0, 10);
  const today = () => dayStr(Date.now()); // hari berjalan belum final, tidak pernah diambil
  const isCount = (v) => typeof v === 'number' && isFinite(v) && v >= 0;
  const rateOrNull = (v) => (typeof v === 'number' && isFinite(v) && v !== NA && v >= 0 ? v : null);
  const post = (msg) => window.postMessage({ source: 'shopee-ads-sync', ...msg }, '*');
  const queryOf = (url) => { try { return new URL(url, window.location.origin).searchParams; } catch (e) { return new URLSearchParams(); } };

  // ---------- 1. Iklan Shopee (PAS). Uang dari API = Rupiah x 100.000 ----------
  const ADS_TYPES = { product_homepage_v2: 'GMV Max Product', shop_homepage: 'Iklan Toko' };
  function handleAds(json) {
    const d = json && json.data;
    if (!d || !Array.isArray(d.report_by_time)) return;
    const adsType = ADS_TYPES[d.key];
    if (!adsType) return;
    const t0 = today();
    const days = {};
    for (const b of d.report_by_time) {
      const day = dayStr(Number(b.key) * 1000);
      if (day >= t0) continue;
      const m = b.metrics || {};
      const t = (days[day] = days[day] || { cost: 0, impression: 0, click: 0, checkout: 0, gmv: 0 });
      t.cost += m.cost || 0;
      t.impression += m.impression || 0;
      t.click += m.click || 0;
      t.checkout += m.checkout || 0; // = kartu "Pesanan"
      t.gmv += m.broad_gmv || 0;     // = kartu "Penjualan"
    }
    const rows = Object.keys(days).sort().map((day) => ({
      'Date': day,
      'Net Cost Spent': Math.round(days[day].cost / 1e5),
      'Impr': days[day].impression,
      'Click': days[day].click,
      'Order': days[day].checkout,
      'Purchase Conversion Value': Math.round(days[day].gmv / 1e5),
      'Channel': 'Shopee Ads',
      'Ads Type': adsType,
    }));
    if (rows.length) post({ dataset: 'ads', rows });
  }

  // ---------- 2. Performa Toko (key-metrics). Uang dari API = Rupiah ----------
  // 1 hari  : pakai .value (pengunjung unik harian; titik per jam TIDAK boleh dijumlah).
  // >1 hari : pakai .points, satu titik per hari (terverifikasi di HAR 7 hari).
  const OVERVIEW = { 'Orders (Confirmed)': 'confirmed_orders', 'Sales (Confirmed)': 'confirmed_gmv', 'Visitors': 'shop_uv' };
  function handleOverview(json, q) {
    if (!json || json.code !== 0 || !json.result) return;
    const r = json.result;
    const start = Number(q.get('start_time')), end = Number(q.get('end_time'));
    if (!start || !end || end <= start) return;
    const nDays = Math.round((end - start) / DAY);
    const byDay = {};
    for (const [col, field] of Object.entries(OVERVIEW)) {
      const m = r[field];
      if (!m) return;
      if (nDays === 1) {
        (byDay[dayStr(start * 1000)] = byDay[dayStr(start * 1000)] || {})[col] = m.value;
      } else {
        const pts = Array.isArray(m.points) ? m.points : [];
        for (let i = 1; i < pts.length; i++) {
          if (pts[i].timestamp - pts[i - 1].timestamp !== DAY) {
            post({ dataset: 'overview', warning: 'Performa Toko tidak diambil: data rentang ini bukan per hari. Pilih rentang lain.' });
            return;
          }
        }
        for (const p of pts) (byDay[dayStr(p.timestamp * 1000)] = byDay[dayStr(p.timestamp * 1000)] || {})[col] = p.value;
      }
    }
    const t0 = today();
    const rows = Object.keys(byDay).sort()
      .filter((day) => day < t0 && Object.keys(OVERVIEW).every((c) => isCount(byDay[day][c])))
      .map((day) => ({
        'Date': day,
        'Orders (Confirmed)': byDay[day]['Orders (Confirmed)'],
        'Sales (Confirmed)': Math.round(byDay[day]['Sales (Confirmed)']),
        'Visitors': byDay[day]['Visitors'],
      }));
    if (rows.length) post({ dataset: 'overview', rows });
  }

  // ---------- 3. Off-platform (channel-metric). Uang dari API = Rupiah ----------
  // Hanya diterima bila filter = Semua Platform & Semua Channel. Data terfilter terlihat sama
  // bentuknya tetapi hanya sebagian, dan akan menimpa baris lengkap di sheet.
  // Di HAR: "Semua Platform" = terminal=0, "Semua Channel" = channel= (kosong).
  // Parameter tak dikenal ditolak (fail-closed): lebih baik tidak mengambil daripada menimpa dengan data parsial.
  const OFF_PARAMS = new Set(['SPC_CDS', 'SPC_CDS_VER', 'start_time', 'end_time', 'period', 'terminal', 'channel', 'fetag']);
  const OFF_COUNTS = {
    'Penjualan (IDR)': 'sales', 'Pesanan': 'orders', 'Produk': 'units', 'Kunjungan': 'visits', 'Pengunjung': 'visitors',
    'Total Pembeli': 'buyers', 'Pembeli Baru': 'new_buyers', 'Pengguna Tambahkan ke Keranjang': 'add_to_cart_users',
    'Nilai Produk Ditambahkan ke Keranjang (IDR)': 'add_to_cart_value', 'Produk Ditambahkan ke Keranjang': 'add_to_cart_units',
  };
  function handleOffPlatform(json, q) {
    if (!json || json.code !== 0 || !json.result) return;
    const extra = [...q.keys()].filter((k) => !OFF_PARAMS.has(k));
    if (q.get('terminal') !== '0' || (q.get('channel') || '') !== '' || extra.length) {
      post({ dataset: 'offplatform', warning: 'Off-platform tidak diambil karena filter aktif. Pilih "Semua Platform" dan "Semua Channel".' });
      return;
    }
    const list = json.result.channel_performance_by_day;
    if (!Array.isArray(list)) return;
    const t0 = today();
    let bad = 0;
    const rows = [];
    for (const x of list) {
      const day = dayStr(Number(x.date) * 1000);
      if (day >= t0) continue;
      if (!Object.values(OFF_COUNTS).every((f) => isCount(x[f])) || typeof x.channel !== 'string') { bad++; continue; }
      const row = { 'Tanggal': day, 'Platform': 'Semua', 'Channel': x.channel, 'Campaign Description': x.campaign_description || '' };
      for (const [col, f] of Object.entries(OFF_COUNTS)) row[col] = x[f];
      row['Tingkat Konversi (Pesanan Dibuat dibagi Kunjungan)'] = rateOrNull(x.visit_to_placed);
      row['Tingkat Konversi (Kunjungan ke Tambahkan ke Keranjang)'] = rateOrNull(x.visit_to_add_to_cart);
      row['Tingkat Konversi (Pesanan Dibuat dari Ditambahkan ke Keranjang)'] = rateOrNull(x.add_to_cart_placed);
      rows.push(row);
    }
    if (bad) post({ dataset: 'offplatform', warning: `${bad} baris Off-platform dilewati karena angkanya tidak lengkap.` });
    if (rows.length) post({ dataset: 'offplatform', rows });
  }

  // ---------- Router: versi path (v1/v2/v3) dibuat longgar agar tidak mati diam-diam ----------
  const ROUTES = [
    [/\/api\/pas\/v\d+\/report\/get_time_graph\//, handleAds],
    [/\/api\/mydata\/v\d+\/dashboard\/key-metrics\//, handleOverview],
    [/\/api\/mydata\/v\d+\/marketing\/off-platform\/traffic-reporting\/channel-metric\//, handleOffPlatform],
  ];
  const routeOf = (url) => { const r = ROUTES.find(([re]) => re.test(url)); return r && r[1]; };
  const run = (h, json, url) => { try { h(json, queryOf(url)); } catch (e) {} };

  // --- fetch ---
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
      const h = routeOf(url);
      if (h) res.clone().json().then((j) => run(h, j, url)).catch(() => {});
    } catch (e) {}
    return res;
  };

  // --- XMLHttpRequest ---
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__sasUrl = String(url || '');
    return origOpen.call(this, method, url, ...rest);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    const h = this.__sasUrl && routeOf(this.__sasUrl);
    if (h) {
      const url = this.__sasUrl;
      this.addEventListener('load', () => {
        try {
          const r = this.response;
          run(h, typeof r === 'string' ? JSON.parse(r) : r, url);
        } catch (e) {}
      });
    }
    return origSend.apply(this, args);
  };
})();
