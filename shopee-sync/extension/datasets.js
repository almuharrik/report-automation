// Definisi dataset, dipakai bersama oleh background.js (importScripts) dan popup.js.
// Kunci (key) HARUS sama dengan yang dibuat Code.gs, karena hasil cek dicocokkan lewat kunci ini.
const OFF_HEADERS = [
  'Tanggal', 'Platform', 'Channel', 'Campaign Description',
  'Penjualan (IDR)', 'Pesanan', 'Produk', 'Kunjungan', 'Pengunjung', 'Total Pembeli', 'Pembeli Baru',
  'Tingkat Konversi (Pesanan Dibuat dibagi Kunjungan)',
  'Pengguna Tambahkan ke Keranjang', 'Nilai Produk Ditambahkan ke Keranjang (IDR)', 'Produk Ditambahkan ke Keranjang',
  'Tingkat Konversi (Kunjungan ke Tambahkan ke Keranjang)',
  'Tingkat Konversi (Pesanan Dibuat dari Ditambahkan ke Keranjang)',
];

const DATASETS = {
  ads: {
    label: 'Iklan Shopee',
    cols: ['Date', 'Net Cost Spent', 'Impr', 'Click', 'Order', 'Purchase Conversion Value', 'Channel', 'Ads Type'],
    dateCol: 'Date',
    key: (r) => `${r['Date']}|${r['Ads Type']}`,
    sub: (r) => r['Ads Type'],
    // [kolom, label di popup, dijumlah di baris Total?]
    show: [['Net Cost Spent', 'Biaya', true], ['Impr', 'Dilihat', true], ['Click', 'Klik', true],
      ['Order', 'Pesanan', true], ['Purchase Conversion Value', 'Penjualan', true]],
  },
  overview: {
    label: 'Performa Toko',
    cols: ['Date', 'Orders (Confirmed)', 'Sales (Confirmed)', 'Visitors'],
    dateCol: 'Date',
    key: (r) => r['Date'],
    sub: () => '',
    // Pengunjung tidak dijumlah: pengunjung unik per hari tidak bisa ditambahkan antarhari.
    show: [['Orders (Confirmed)', 'Pesanan', true], ['Sales (Confirmed)', 'Penjualan', true], ['Visitors', 'Pengunjung', false]],
  },
  offplatform: {
    label: 'Off-platform',
    cols: OFF_HEADERS,
    dateCol: 'Tanggal',
    key: (r) => [r['Tanggal'], r['Platform'], r['Channel'], r['Campaign Description']].join('|'),
    sub: (r) => r['Channel'] + (r['Campaign Description'] ? ' · ' + r['Campaign Description'] : ''),
    show: [['Penjualan (IDR)', 'Penjualan', true], ['Pesanan', 'Pesanan', true], ['Kunjungan', 'Kunjungan', true]],
    provisionalDays: 3, // data atribusi beberapa hari terakhir biasanya masih bertambah
  },
};
const DATASET_ORDER = ['ads', 'overview', 'offplatform'];
const pickCols = (dataset, r) => { const o = {}; DATASETS[dataset].cols.forEach((c) => (o[c] = r[c])); return o; };
