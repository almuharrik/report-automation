# Migrasi Tahap 1 — Riwayat Kuadran Bulanan di Google Sheets

**Status:** Direncanakan · **Prioritas:** cepat selesai (sedang mengejar report) · **Lanjutan:** [`MIGRATION_TAHAP_2.md`](MIGRATION_TAHAP_2.md)

## 1. Tujuan

Mengubah dashboard dari "snapshot satu periode" menjadi alat keputusan bulanan, **tanpa mengganti infrastruktur**.

| # | Kebutuhan | Keputusan yang didukung |
|---|---|---|
| 1 | Riwayat kuadran per produk per bulan | Produk mana yang naik atau turun kuadran |
| 2 | Riwayat komposisi kuadran per kategori | Kategori mana yang makin sehat atau makin buruk |
| 3 | Ad spend per produk dan per kategori | Produk K3/K4 yang **overspend**; produk K2 yang **underspend** |
| 4 | Benchmark CR sinkron dengan penentu kuadran | Warna CR di dashboard konsisten dengan kuadran |

## 2. Keputusan yang sudah diambil

- Penyimpanan tetap **Google Sheets**, eksekusi tetap **Apps Script**.
- Sumber ad spend per produk: tab **`RAW Shopee Ads`**.
- Tahap 1 dikerjakan lebih dulu; Tahap 2 setelah report selesai.

## 3. Scope

**Masuk:**
- Tab `CONFIG` (threshold dan benchmark), tab `HISTORY` (snapshot bulanan).
- Fungsi snapshot (manual + trigger bulanan), backfill bulan lalu.
- Dashboard v2: tab Produk dan Kategori dengan riwayat + ad spend + flag keputusan (referensi UI: `preview/bcg_v2_preview.html`).

**Tidak masuk (ditunda ke Tahap 2):** database eksternal, upload UI, multi-toko dalam satu sistem, autentikasi sendiri.

## 4. Desain data

### 4.1 Tab `CONFIG` (baru)

Satu-satunya tempat angka benchmark. Dibaca oleh fungsi snapshot **dan** dashboard.

| Parameter | Nilai awal | Keterangan |
|---|---|---|
| `traffic_threshold` | `100` | Pengunjung per bulan; ≥ ini = High Traffic |
| `roas_target` | *(isi)* | Target ROAS acuan untuk flag overspend (Shopee Ads 8x pada konfigurasi klien saat ini) |
| `overspend_spend_percentile` | `50` | Spend ≥ persentil ini (dari produk yang beriklan) dianggap besar |
| `underspend_spend_percentile` | `25` | Spend ≤ persentil ini dianggap kecil |

Tabel **benchmark CR per range harga**:

| price_band | min_price | max_price | cr_benchmark_pct |
|---|---|---|---|
| `< 25,000` | 0 | 24.999 | `5.0` |
| `25,000 - 50,000` | 25.000 | 49.999 | `4.5` |
| `50,000 - 75,000` | 50.000 | 74.999 | `4.5` |
| `75,000 - 100,000` | 75.000 | 99.999 | `4.5` |
| `≥ 100,000` | 100.000 | ∞ | *(isi)* |

> ⚠️ Nilai di atas **terindikasi** dari data Mei 2026 (lihat [`V1_SPEC.md` §4](V1_SPEC.md#4-definisi-kuadran)). **Langkah wajib sebelum dipakai:** cocokkan dengan formula `Kuadran Conversion` di tab `RUMUS` dan koreksi nilainya. Aturan: benchmark harus **tidak naik** seiring harga naik (harga lebih murah, CR benchmark lebih tinggi).

### 4.2 Tab `HISTORY` (baru, append-only)

Satu baris = satu produk × satu bulan. Format long.

| Kolom | Tipe | Sumber |
|---|---|---|
| `period` | `YYYY-MM` | parameter snapshot |
| `product_id` | teks | `Kode Produk` |
| `product_name` | teks | `Nama Produk` |
| `category` | teks | `Category` |
| `price_band` | teks | `Range Price` |
| `visitors` | angka | `Pengunjung` |
| `buyers` | angka | `Pembeli` |
| `cr_pct` | angka | `buyers ÷ visitors × 100` |
| `sales` | angka | `Sales` |
| `ad_spend` | angka | `Biaya` (lihat 4.3) |
| `ad_revenue` | angka | `Revenue Iklan` |
| `roas` | angka | `ad_revenue ÷ ad_spend` (0 jika tanpa iklan) |
| `traffic_threshold_used` | angka | nilai `CONFIG` saat snapshot |
| `cr_benchmark_used` | angka | benchmark band saat snapshot |
| `quadrant` | 1–4 | **dihitung saat snapshot**, lalu dibekukan |
| `snapshot_at` | timestamp | waktu eksekusi |

**Kenapa kuadran dan threshold dibekukan di baris:** kalau benchmark diubah nanti, riwayat lama tidak berubah diam-diam. Perubahan kuadran antar bulan selalu mencerminkan aturan yang berlaku saat itu.

Kunci unik: `period + product_id`.

### 4.3 Sumber ad spend

`RUMUS` sudah memuat `Biaya`, `ROAS`, `Revenue Iklan` per produk, yang bersumber dari `RAW Shopee Ads`. Snapshot **mengambil dari `RUMUS`** (satu sumber, konsisten dengan dashboard v1).

**Rekonsiliasi wajib setiap snapshot:**
`Σ ad_spend (HISTORY periode itu)` vs `Σ biaya periode itu di RAW Shopee Ads`. Selisih = iklan yang tidak ter-match ke produk (iklan toko, ID tidak ditemukan, dll). Selisih dicatat di log snapshot; jika > ambang (mis. 2%) tampilkan peringatan.

## 5. Alur snapshot

```
Data Shopee bulan N lengkap  →  RUMUS terisi  →  jalankan snapshotPeriode("YYYY-MM")
   1. Baca CONFIG
   2. Baca RUMUS (kolom by header, exact match)
   3. Hitung cr_pct, tentukan price_band → cr_benchmark_used
   4. Hitung quadrant dari threshold + benchmark
   5. Rekonsiliasi spend vs RAW Shopee Ads
   6. Hapus baris HISTORY untuk period yang sama, lalu tulis ulang (idempoten)
   7. Tulis log (jumlah baris, selisih spend)
```

**Idempoten:** menjalankan ulang untuk periode yang sama menimpa, bukan menggandakan.

**Pemicu:** menu kustom `BCG → Snapshot bulan ini` (manual) dan time-driven trigger tanggal 2–3 tiap bulan setelah data Shopee bulan sebelumnya lengkap.

**Parity check (sekali, sebelum go-live):** hitung kuadran di script untuk data Mei 2026, bandingkan dengan `Kuadran Number` dari Sheet. Target: **473/473 cocok**. Jika tidak, perbaiki `CONFIG` dulu, bukan kodenya.

## 6. Perubahan kode

| File | Perubahan |
|---|---|
| `Config.gs` (baru) | `readConfig()`: parameter + tabel benchmark |
| `Snapshot.gs` (baru) | `snapshotPeriode(period)`, `backfill(periods[])`, rekonsiliasi spend, menu |
| `Code.gs` | tambah `getHistoryData(periods)` dan `getConfig()`; `getSheetData()` dipertahankan |
| `BCG.html` | tab Produk dan Kategori mengikuti `preview/bcg_v2_preview.html`; **hapus `bench()` hardcode**, pakai `cr_benchmark_used` |

## 7. Aturan keputusan (default, bisa diatur di `CONFIG`)

| Flag | Aturan |
|---|---|
| **Naik / turun kuadran** | Skor K1=4, K2=3, K3=2, K4=1. Bandingkan bulan ini vs bulan lalu |
| **Overspend** | Kuadran 3 atau 4, `ad_spend` ≥ persentil-50 spend, dan `roas < roas_target` |
| **Underspend** | Kuadran 2 dan `ad_spend` ≤ persentil-25 |
| **Kategori overspend** | share spend ÷ share revenue > 1.3 |
| **Kategori underspend** | rasio < 0.7 dan > 30% SKU di K1/K2 |
| **Health kategori** | % SKU di K1+K2 per bulan (sparkline) |

Aturan di atas adalah usulan awal; validasi dengan data nyata sebelum dipakai untuk keputusan budget.

## 8. Langkah kerja

1. [ ] Konfirmasi struktur kolom `RAW Shopee Ads` dan cara `RUMUS` men-join-nya (lihat §10)
2. [ ] Cocokkan formula kuadran di `RUMUS` → isi `CONFIG` (threshold + tabel benchmark)
3. [ ] Buat tab `CONFIG` dan `HISTORY`
4. [ ] Tulis `snapshotPeriode()` + parity check Mei 2026 (target 473/473)
5. [ ] Backfill bulan yang tersedia (lihat §9)
6. [ ] Tambah `getHistoryData()` dan update `BCG.html` ke tampilan v2
7. [ ] Pasang menu + trigger bulanan
8. [ ] Uji acceptance (§11), lalu update `README.md` dan `V1_SPEC.md` menjadi V2_SPEC

## 9. Backfill

- Jalankan `snapshotPeriode` per bulan terhadap `RUMUS` yang sesuai periodenya. Bila `RUMUS` hanya menyimpan periode terakhir, backfill butuh **file export lama** (mis. `RHA_GALLERY_BCG_MATRIX_1-31_Mei_2026.csv`) yang ditempel ke `RUMUS` sementara, atau diimpor langsung ke `HISTORY`.
- Bulan tanpa data: biarkan kosong. Dashboard menampilkan "—" dan tidak menghitung naik/turun untuk bulan pertama.
- Minimal 2 bulan berurutan diperlukan agar fitur naik/turun bermanfaat.

## 10. Pertanyaan terbuka

1. Kolom apa saja di `RAW Shopee Ads` (ID produk, tanggal, biaya, revenue iklan)? Granularitas harian atau agregat?
2. Apakah `RUMUS` menarik `Biaya` dari `RAW Shopee Ads` dengan formula, atau diisi manual?
3. Apakah `RUMUS` menyimpan satu periode saja? Dari mana arsip bulan-bulan sebelumnya?
4. Formula persis `Kuadran Conversion` dan `Kuadran Traffic` di `RUMUS`.
5. Benchmark untuk range `≥ 100,000`, dan apakah `75,000 - 100,000` memang 4.5%.
6. Target ROAS acuan flag overspend: satu angka global atau per kategori?

## 11. Kriteria selesai (acceptance)

- [ ] Parity check 473/473 untuk Mei 2026
- [ ] `HISTORY` terisi ≥ 2 bulan berurutan; snapshot ulang tidak menggandakan baris
- [ ] Rekonsiliasi spend tampil di log, selisih terjelaskan
- [ ] Tab Produk menampilkan riwayat kuadran, pergerakan, ad spend, dan flag overspend/underspend
- [ ] Tab Kategori menampilkan stacked bar komposisi kuadran, ad spend, share spend vs revenue, sparkline health
- [ ] Warna CR di tabel konsisten dengan kuadran (tidak ada lagi 56 produk yang tidak sinkron)
- [ ] Mengubah `CONFIG` tidak mengubah baris `HISTORY` lama

## 12. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Formula `RUMUS` berubah antar bulan | Kuadran tidak sebanding | Bekukan kuadran + threshold di `HISTORY`; catat perubahan di `CONFIG` |
| Spend tidak ter-match ke produk | Spend produk terlalu kecil | Rekonsiliasi per snapshot |
| Eksekusi > 6 menit | Snapshot gagal | Tulis batch dengan `setValues`, bukan per baris |
| `HISTORY` membesar | Dashboard lambat | ±5.600 baris per toko per tahun, masih aman; pemicu pindah ke Tahap 2 ada di dokumen Tahap 2 |
| Data klien ikut ter-commit | Kebocoran data | `.gitignore` untuk CSV/export; repo hanya berisi kode |
