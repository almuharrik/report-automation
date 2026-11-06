# BCG Matrix Dashboard — Shopee Product Portfolio

Dashboard web untuk memetakan produk toko Shopee ke **4 kuadran BCG** berdasarkan **traffic** dan **conversion rate (CR)**, lalu menerjemahkannya ke keputusan iklan: produk mana yang di-scale, di-fix, atau di-deprioritas.

> **Status:** v1 berjalan di production (Google Apps Script + Google Sheets). v2 (riwayat kuadran bulanan + ad spend) dalam tahap migrasi, lihat [`docs/`](docs/).

---

## Ringkasan

| Kuadran | Nama | Traffic | CR | Aksi default |
|---|---|---|---|---|
| **K1** | ⭐ Star | Tinggi | Tinggi | Scale Ads |
| **K2** | 💎 Hidden Gem | Rendah | Tinggi | Boost budget |
| **K3** | 🔧 Need Fix | Tinggi | Rendah | Fix halaman produk (PDP) dulu, baru scale |
| **K4** | 📦 Depriority | Rendah | Rendah | Stop ads, review konten dan stok |

## Fitur v1

- **Tanpa upload.** Data dibaca langsung dari tab `RUMUS` di Google Sheet yang sama.
- **KPI strip** per kuadran: Total Revenue sebagai highlight, plus Total SKU, Avg Traffic, Avg CR, Avg ROAS.
- **Tab Produk:** tabel produk (cari, filter kuadran/kategori, sort, pagination), CR diberi warna terhadap benchmark.
- **Tab BCG Matrix:** visual 4 kuadran, ukuran titik = Sales.
- **Tab By Category:** distribusi kuadran per kategori, revenue, dan skor *health* (% SKU di K1+K2).
- **Panel insight** di sidebar yang berubah sesuai kuadran terpilih.
- Tombol **Refresh** untuk menarik data terbaru tanpa deploy ulang.

## Arsitektur v1

```
 Google Sheet
 ├─ tab RUMUS  (formula: join data produk Shopee + iklan + kuadran)
 │
 └──► Code.gs  (Apps Script, getSheetData)
        │  baca RUMUS, cari kolom by header, hitung CR, bentuk JSON
        ▼
      BCG.html  (frontend, google.script.run → render dashboard)
```

## Struktur repo

```
reporting_tools/bcg_matrix/
├── README.md
├── src/
│   ├── Code.gs          # backend Apps Script (doGet + getSheetData)
│   └── BCG.html         # frontend dashboard
├── preview/
│   └── bcg_v2_preview.html   # mockup v2 dengan DATA DUMMY (bukan production)
└── docs/
    ├── V1_SPEC.md            # spesifikasi teknis versi yang berjalan
    ├── MIGRATION_TAHAP_1.md  # plan: riwayat bulanan di Google Sheets
    └── MIGRATION_TAHAP_2.md  # plan: core database di server internal
```

## Setup

1. Buka Google Sheet yang berisi tab **`RUMUS`**.
2. **Extensions → Apps Script**.
3. Buat file `Code.gs` dan `BCG.html` (tipe HTML), lalu isi dari folder [`src/`](src/).
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: sesuai kebutuhan (mis. *Anyone with Google account*)
5. Buka URL Web App. Dashboard langsung memuat data.

**Update kode:** cukup replace isi file lalu **Save**, lalu refresh browser. Deploy ulang hanya perlu jika mengubah *Execute as* atau *Who has access*, atau ingin URL baru.

## Kontrak data (tab `RUMUS`)

Header dibaca dengan **exact match** (tidak peka huruf besar/kecil, spasi dan underscore diabaikan).

| Kolom | Wajib | Dipakai untuk |
|---|---|---|
| `Nama Produk` | ✅ | Nama di tabel |
| `Kuadran Number` | ✅ | Nilai 1–4; baris selain itu dilewati |
| `Pengunjung` | ✅ | Traffic dan penyebut CR |
| `Pembeli` | ✅ | Pembilang CR |
| `Sales` | ✅ | Revenue |
| `ROAS` | ➖ | ROAS (`-` atau kosong dianggap tidak beriklan) |
| `Biaya` | ➖ | Biaya iklan |
| `Range Price` | ➖ | Menentukan benchmark CR untuk pewarnaan |
| `Category` | ➖ | Grouping kategori (kosong atau `#N/A` menjadi *Uncategorized*) |
| `Link` | ➖ | Nama produk menjadi link ke halaman Shopee |

Detail lengkap ada di [`docs/V1_SPEC.md`](docs/V1_SPEC.md).

## Catatan penting

- **CR dihitung di kode:** `Pembeli ÷ Pengunjung × 100`, bukan membaca kolom `CR`. Ini sengaja, karena parsing kolom `CR` pernah menghasilkan angka salah.
- **Kuadran ditentukan di Sheet**, bukan di kode. Dashboard hanya membaca kolom `Kuadran Number`.
- **Warna CR di tabel belum sinkron dengan kuadran di Sheet.** Lihat bagian *Known issues* di [`docs/V1_SPEC.md`](docs/V1_SPEC.md#8-known-issues).
- **Jangan commit data klien** (CSV export, nama produk, ID toko) ke repo publik.

## Roadmap

| Tahap | Isi | Dokumen |
|---|---|---|
| v1 | Dashboard snapshot satu periode | *(berjalan)* |
| **Tahap 1** | Riwayat kuadran bulanan + ad spend, tetap di Google Sheets | [`MIGRATION_TAHAP_1.md`](docs/MIGRATION_TAHAP_1.md) |
| **Tahap 2** | Core database di server internal, upload data Shopee, benchmark terkonfigurasi | [`MIGRATION_TAHAP_2.md`](docs/MIGRATION_TAHAP_2.md) |
