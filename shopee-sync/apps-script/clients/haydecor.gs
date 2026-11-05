/**
 * Konfigurasi klien: HAYDECOR (Daily Tracking).
 * Di Apps Script disimpan sebagai file "client.gs", berdampingan dengan core.gs.
 * ID spreadsheet TIDAK ditulis di sini: isi Script Property SPREADSHEET_ID di project klien.
 * Klien baru: salin file ini, ubah name, nama tab, dan pemetaan kolom. Jangan ubah core.gs.
 */
const CLIENT = {
  name: 'Haydecor',

  datasets: {
    // Iklan Shopee → tab RAW_SHOPEE_ADS (struktur lama Daily Tracking + Impr/Click/Order di F–H)
    ads: {
      enabled: true,
      sheet: 'RAW_SHOPEE_ADS',
      createIfMissing: false,   // tab produksi: jangan pernah dibuat otomatis
      allowOverwrite: true,     // false = angka lama yang sudah terisi tidak pernah ditimpa
      date: { realFormat: 'yyyy-mm-dd', textPattern: 'yyyy-MM-dd', emptyTab: 'date' },
      numFormat: '0',           // angka RAW; null = jangan ubah format
      columns: [
        { header: 'Date', field: 'Date', type: 'date', key: true },
        { header: 'Channel', field: 'Channel', type: 'text', map: { 'Shopee Ads': 'Shopee_Ads' } },
        { header: 'Spend', field: 'Net Cost Spent', type: 'num' },             // kartu "Biaya Iklan"
        { header: 'Revenue', field: 'Purchase Conversion Value', type: 'num' }, // kartu "Penjualan"
        { header: 'Ads_Type', field: 'Ads Type', type: 'text', key: true, map: { 'GMV Max Product': 'Product', 'Iklan Toko': 'Shop' } },
        { header: 'Impr', field: 'Impr', type: 'num', optional: true },
        { header: 'Click', field: 'Click', type: 'num', optional: true },
        { header: 'Order', field: 'Order', type: 'num', optional: true },
      ],
    },

    // Performa Toko → tab baru "Shopee Overview" (dibuat otomatis saat Kirim pertama).
    // Kalau tab ini sudah dibuat oleh Code.gs v2 sebelumnya, skemanya sama dan dipakai apa adanya.
    overview: {
      enabled: true,
      sheet: 'Shopee Overview',
      createIfMissing: true,
      allowOverwrite: true,
      date: { realFormat: 'yyyy-mm-dd', textPattern: 'yyyy-MM-dd', emptyTab: 'date' },
      numFormat: '0',
      columns: [
        { header: 'Date', field: 'Date', type: 'date', key: true },
        { header: 'Orders (Confirmed)', field: 'Orders (Confirmed)', type: 'num' },
        { header: 'Sales (Confirmed)', field: 'Sales (Confirmed)', type: 'num' },
        { header: 'Visitors', field: 'Visitors', type: 'num' },
      ],
    },

    // Off-platform → RAW_SHOPEE_UTM, header A–Q sama dengan template Heiji. Tab belum ada di
    // Haydecor → dibuat otomatis saat Kirim pertama, dengan tanggal asli yyyy-mm-dd (seragam dengan
    // RAW_SHOPEE_ADS). Mau persis seperti Heiji (teks dd-mm-yyyy)? Ganti date menjadi
    // { realFormat: null, textPattern: null, emptyTab: 'dd-MM-yyyy' } SEBELUM Kirim pertama.
    offplatform: {
      enabled: true,
      sheet: 'RAW_SHOPEE_UTM',
      createIfMissing: true,
      allowOverwrite: true,
      date: { realFormat: 'yyyy-mm-dd', textPattern: 'yyyy-MM-dd', emptyTab: 'date' },
      numFormat: '0',
      columns: [
        { header: 'Tanggal', field: 'Tanggal', type: 'date', key: true },
        { header: 'Platform', field: 'Platform', type: 'text', key: true },
        { header: 'Channel', field: 'Channel', type: 'text', key: true },
        { header: 'Campaign Description', field: 'Campaign Description', type: 'text', key: true },
        { header: 'Penjualan (IDR)', field: 'Penjualan (IDR)', type: 'num' },
        { header: 'Pesanan', field: 'Pesanan', type: 'num' },
        { header: 'Produk', field: 'Produk', type: 'num' },
        { header: 'Kunjungan', field: 'Kunjungan', type: 'num' },
        { header: 'Pengunjung', field: 'Pengunjung', type: 'num' },
        { header: 'Total Pembeli', field: 'Total Pembeli', type: 'num' },
        { header: 'Pembeli Baru', field: 'Pembeli Baru', type: 'num' },
        { header: 'Tingkat Konversi (Pesanan Dibuat dibagi Kunjungan)', field: 'Tingkat Konversi (Pesanan Dibuat dibagi Kunjungan)', type: 'rate' },
        { header: 'Pengguna Tambahkan ke Keranjang', field: 'Pengguna Tambahkan ke Keranjang', type: 'num' },
        { header: 'Nilai Produk Ditambahkan ke Keranjang (IDR)', field: 'Nilai Produk Ditambahkan ke Keranjang (IDR)', type: 'num' },
        { header: 'Produk Ditambahkan ke Keranjang', field: 'Produk Ditambahkan ke Keranjang', type: 'num' },
        { header: 'Tingkat Konversi (Kunjungan ke Tambahkan ke Keranjang)', field: 'Tingkat Konversi (Kunjungan ke Tambahkan ke Keranjang)', type: 'rate' },
        { header: 'Tingkat Konversi (Pesanan Dibuat dari Ditambahkan ke Keranjang)', field: 'Tingkat Konversi (Pesanan Dibuat dari Ditambahkan ke Keranjang)', type: 'rate' },
      ],
    },
  },
};
