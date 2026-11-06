# Migrasi Tahap 2 — Core Database di Server Internal

**Status:** Direncanakan · **Dimulai setelah:** report selesai dan Tahap 1 stabil · **Prasyarat:** [`MIGRATION_TAHAP_1.md`](MIGRATION_TAHAP_1.md) selesai

## 1. Tujuan

Menjadikan **database di server internal** sebagai sumber data utama (*core database*) untuk:

1. **Data performa produk** Shopee (pengunjung, pembeli, sales per produk per periode)
2. **Data iklan** Shopee (spend, revenue iklan per produk per periode)
3. **Konfigurasi benchmark** traffic dan CR per range harga, **berversi**, sehingga kuadran bisa dihitung ulang dan diaudit

Google Sheets berhenti menjadi tempat penyimpanan; Sheets hanya tetap berguna sebagai tempat input manual bila diperlukan.

## 2. Kapan pindah (pemicu)

Pindah ke Tahap 2 bila salah satu terjadi:

- Klien/toko yang dikelola dengan dashboard ini ≥ 3
- `HISTORY` > ~50.000 baris atau dashboard terasa lambat (> 5 detik muat)
- Perlu akses klien terkontrol (login) tanpa memberi akses ke Google Sheet
- Perlu audit: "kenapa produk ini berpindah kuadran?" dengan benchmark yang berlaku saat itu

## 3. Arsitektur

```
 Export Shopee (xlsx/csv)                          Pengguna (browser)
  ├─ Performa Produk                                      │
  └─ Performa Iklan                                       │  HTTPS (reverse proxy + login)
        │                                                 ▼
        ▼  upload                                  ┌────────────┐
 ┌──────────────────┐   validasi + parse           │ Dashboard  │  halaman statis
 │  Upload Service  │──────────────┐               └─────┬──────┘
 │  (API)           │              ▼                     │ JSON
 └──────────────────┘       ┌─────────────┐        ┌─────▼──────┐
                            │ PostgreSQL  │◄───────│  Read API  │
                            │  raw_*      │        └────────────┘
                            │  dim_*      │
                            │  fact_*     │◄── Transform job (hitung CR, band, kuadran, flag)
                            │  config_*   │
                            └─────────────┘
```

Komponen:

| Komponen | Peran |
|---|---|
| **Upload Service** | Menerima file, menyimpan file asli + hash, memvalidasi, memasukkan ke tabel `raw_*` |
| **Transform job** | Menghitung `fact_product_monthly` dari `raw_*` + `config_*`; dijalankan setelah upload sukses atau saat config berubah |
| **Read API** | Endpoint JSON read-only untuk dashboard |
| **Dashboard** | Frontend statis; turunan langsung dari `preview/bcg_v2_preview.html` dengan data dari API |
| **PostgreSQL** | Core database |

**Usulan teknologi** (bukan keputusan final; sesuaikan dengan stack server internal): PostgreSQL, API dengan Python (FastAPI) atau Node, deployment Docker Compose, reverse proxy yang sudah ada di server untuk TLS dan login.

## 4. Skema database (usulan)

### 4.1 Master

```sql
CREATE TABLE client (
  client_id   serial PRIMARY KEY,
  name        text NOT NULL UNIQUE
);

CREATE TABLE shop (
  shop_id     bigint PRIMARY KEY,           -- ID Toko Shopee
  client_id   int NOT NULL REFERENCES client,
  name        text NOT NULL
);

CREATE TABLE product (
  shop_id     bigint NOT NULL REFERENCES shop,
  product_id  bigint NOT NULL,              -- Kode Produk Shopee
  name        text NOT NULL,
  category    text,
  link        text,
  PRIMARY KEY (shop_id, product_id)
);
```

### 4.2 Upload dan data mentah (immutable)

```sql
CREATE TABLE upload (
  upload_id    serial PRIMARY KEY,
  shop_id      bigint NOT NULL REFERENCES shop,
  kind         text NOT NULL CHECK (kind IN ('product_performance','ads')),
  period       char(7) NOT NULL,            -- 'YYYY-MM'
  file_name    text NOT NULL,
  file_sha256  text NOT NULL,
  row_count    int,
  status       text NOT NULL,               -- uploaded | validated | loaded | rejected
  uploaded_by  text,
  uploaded_at  timestamptz DEFAULT now(),
  UNIQUE (shop_id, kind, period, file_sha256)   -- cegah upload ganda file yang sama
);

CREATE TABLE raw_product_performance (
  upload_id   int NOT NULL REFERENCES upload,
  product_id  bigint NOT NULL,
  visitors    int,
  atc_pct     numeric,
  buyers      int,
  qty_sold    int,
  sales       numeric,
  stock       int,
  price_range text,                         -- string asli, mis. '75,000 - 100,000'
  extra       jsonb,                        -- kolom lain dari export, tidak dibuang
  PRIMARY KEY (upload_id, product_id)
);

CREATE TABLE raw_ads_product (
  upload_id   int NOT NULL REFERENCES upload,
  product_id  bigint,                       -- NULL = iklan level toko/tidak ter-match
  ad_date     date,                         -- NULL jika export bulanan
  spend       numeric NOT NULL,
  ad_revenue  numeric,
  clicks      int,
  impressions int,
  extra       jsonb
);
```

Upload ulang untuk `(shop, kind, period)` yang sama dengan file berbeda: upload lama berstatus `superseded`, data baru jadi aktif. File asli selalu disimpan.

### 4.3 Konfigurasi benchmark (berversi)

```sql
CREATE TABLE config_version (
  version_id      serial PRIMARY KEY,
  client_id       int NOT NULL REFERENCES client,
  effective_from  char(7) NOT NULL,         -- berlaku mulai periode ini
  traffic_threshold int NOT NULL,           -- pengunjung/bulan; ≥ ini = High Traffic
  price_basis     text NOT NULL DEFAULT 'price_range'
                  CHECK (price_basis IN ('price_range','unit_value')),
  roas_target     numeric,
  note            text,
  created_by      text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE config_price_band (
  version_id        int NOT NULL REFERENCES config_version,
  band_order        int NOT NULL,
  label             text NOT NULL,          -- '< 25,000'
  min_price         numeric NOT NULL,       -- inklusif
  max_price         numeric,                -- eksklusif; NULL = tanpa batas
  cr_benchmark_pct  numeric NOT NULL,
  PRIMARY KEY (version_id, band_order)
);
```

**Aturan validasi saat menyimpan config:**
- Band tidak boleh tumpang tindih dan harus menutup seluruh rentang harga mulai 0.
- **`cr_benchmark_pct` tidak boleh naik** ketika `min_price` naik (harga lebih murah, benchmark CR lebih tinggi). Pelanggaran ditolak.
- Config tidak pernah di-UPDATE; perubahan = baris `config_version` baru.

**Nilai awal** (hasil reverse-engineering Mei 2026, **harus dikonfirmasi** dengan formula `RUMUS`; detail di [`V1_SPEC.md` §4](V1_SPEC.md#4-definisi-kuadran)):

| Band | CR benchmark |
|---|---|
| < 25,000 | 5.0% |
| 25,000 – 50,000 | 4.5% |
| 50,000 – 75,000 | 4.5% |
| 75,000 – 100,000 | 4.5% *(belum bisa dipersempit)* |
| ≥ 100,000 | *(isi)* |

`traffic_threshold` awal: **100**.

**Keputusan terbuka: dasar harga band.** v1 memakai string `Range Price` (harga listing). Alternatif: `Unit Value` (harga jual rata-rata = Sales ÷ Qty), yang lebih mencerminkan harga yang benar-benar dibayar pembeli (diskon, varian). Kolom `price_basis` memungkinkan keduanya; pilih satu per klien dan uji dampaknya ke distribusi kuadran sebelum cutover.

### 4.4 Tabel hasil (turunan, bisa dibangun ulang)

```sql
CREATE TABLE fact_product_monthly (
  shop_id        bigint NOT NULL,
  product_id     bigint NOT NULL,
  period         char(7) NOT NULL,
  visitors       int,
  buyers         int,
  cr_pct         numeric,                   -- buyers / visitors * 100
  sales          numeric,
  ad_spend       numeric DEFAULT 0,
  ad_revenue     numeric DEFAULT 0,
  roas           numeric,                   -- ad_revenue / ad_spend
  price_band     text,
  cr_benchmark   numeric,                   -- nilai yang dipakai
  traffic_threshold int,                    -- nilai yang dipakai
  quadrant       smallint CHECK (quadrant BETWEEN 1 AND 4),
  config_version int NOT NULL REFERENCES config_version,
  computed_at    timestamptz DEFAULT now(),
  PRIMARY KEY (shop_id, product_id, period)
);
```

Karena config tersimpan per versi dan hasil menyimpan `config_version`, **kuadran selalu bisa ditelusuri** ke aturan yang membentuknya. Mengubah config dan menekan "hitung ulang" membuat `fact_*` baru untuk periode terpilih tanpa menyentuh `raw_*`.

## 5. Alur ingestion

1. **Upload** file performa produk dan file iklan untuk satu periode, satu toko.
2. **Validasi** (gagal = status `rejected` + pesan jelas, tidak ada data masuk):
   - header sesuai kontrak per jenis file (pemetaan kolom exact-match, belajar dari bug fuzzy match v1)
   - tipe angka valid, tidak ada `product_id` ganda di satu file
   - periode di nama file/isi sesuai periode yang dipilih
3. **Load** ke `raw_*`; produk baru otomatis masuk `product`.
4. **Rekonsiliasi iklan:** total `spend` file iklan vs total spend ter-match ke produk. Tampilkan selisih (iklan level toko atau ID tak dikenal).
5. **Transform** untuk `(shop, period)`: hitung CR, tentukan band, terapkan config versi yang berlaku untuk periode itu, tentukan kuadran, tulis `fact_product_monthly`.
6. Tampilkan ringkasan: jumlah produk, distribusi K1–K4, selisih spend.

Opsi otomatisasi nanti: menggantikan upload manual dengan penarikan Shopee Open API v2 (butuh blocker `error_sign` di integrasi yang sedang berjalan terselesaikan); skema `raw_*` tidak berubah.

## 6. Read API (usulan)

| Endpoint | Isi |
|---|---|
| `GET /api/shops` | toko yang boleh diakses pengguna |
| `GET /api/periods?shop=` | periode yang tersedia |
| `GET /api/products?shop=&period=` | produk + riwayat kuadran N bulan + spend + flag |
| `GET /api/categories?shop=&period=` | komposisi kuadran, spend, revenue, rasio, health per kategori |
| `GET /api/config?shop=&period=` | config versi yang berlaku (untuk ditampilkan di dashboard) |
| `POST /api/uploads` | upload file (peran admin) |
| `POST /api/recompute` | hitung ulang periode setelah config berubah (peran admin) |

Perhitungan flag (naik/turun, over/underspend, health) dilakukan di server agar dashboard tipis dan konsisten; aturannya sama dengan [`MIGRATION_TAHAP_1.md` §7](MIGRATION_TAHAP_1.md#7-aturan-keputusan-default-bisa-diatur-di-config).

## 7. Keamanan dan operasional

- Login di reverse proxy (SSO/basic auth) minimal; peran: `admin` (upload, ubah config) dan `viewer` (baca per toko).
- Backup Postgres harian (`pg_dump`) + file upload asli; uji restore sekali sebelum cutover.
- Tidak ada kredensial di repo; gunakan environment variable.
- Log upload dan perubahan config (siapa, kapan).

## 8. Migrasi dari Tahap 1

1. Ekspor tab `HISTORY` ke CSV.
2. Impor ke `fact_product_monthly` sebagai data historis dengan `config_version` = versi awal yang dibuat dari `CONFIG` Tahap 1.
3. Bila file mentah bulan lalu masih ada, upload ke `raw_*` agar bisa dihitung ulang; bila tidak, data `HISTORY` tetap berstatus snapshot saja.
4. **Parity test:** dashboard Tahap 2 vs dashboard Tahap 1 untuk 2 bulan terakhir; kuadran, spend, dan flag harus identik.
5. **Paralel 1 bulan:** upload bulan berjalan ke sistem baru sambil snapshot Sheets tetap jalan. Cutover bila hasil sama.
6. Sheets dipensiunkan sebagai sumber; `RUMUS` dan `HISTORY` diarsipkan, tidak dihapus.

## 9. Langkah kerja

1. [ ] Putuskan stack API dan lokasi deploy di server internal
2. [ ] Putuskan `price_basis` (Range Price vs Unit Value) lewat uji dampak ke distribusi kuadran
3. [ ] Buat skema DB + migrasi (versioned migration)
4. [ ] Upload service + validator untuk 2 jenis file Shopee
5. [ ] Transform job + unit test (ambil kasus nyata: produk `29915304617` → CR 9.81%, K1)
6. [ ] Read API + adaptasi dashboard dari preview
7. [ ] Halaman admin: upload, riwayat upload, edit config (dengan validasi monoton)
8. [ ] Impor `HISTORY`, parity test, paralel 1 bulan
9. [ ] Cutover, backup terjadwal, update README dan dokumentasi

## 10. Kriteria selesai

- [ ] Upload file Shopee (produk + iklan) menghasilkan dashboard tanpa menyentuh Google Sheets
- [ ] Mengubah benchmark membuat versi config baru, hasil bisa dihitung ulang, dan periode lama tetap bisa ditelusuri ke config aslinya
- [ ] Config dengan benchmark yang naik seiring harga ditolak
- [ ] Parity test lulus untuk 2 bulan
- [ ] Restore backup teruji
- [ ] Menambah toko/klien baru cukup dengan data master + config, tanpa mengubah kode

## 11. Risiko

| Risiko | Mitigasi |
|---|---|
| Format export Shopee berubah | Pemetaan kolom per jenis file dalam config; validator menolak dengan pesan jelas; kolom tak dikenal disimpan di `extra` |
| Iklan tidak ter-match ke produk | Baris `product_id = NULL` disimpan; rekonsiliasi menampilkan selisih |
| Benchmark salah diturunkan dari data | Konfirmasi dengan formula `RUMUS` sebelum seed; parity test |
| Over-engineering untuk 1–2 toko | Jangan mulai sebelum pemicu di §2 terpenuhi |
