# V1 Spec — BCG Matrix Dashboard (versi yang berjalan)

Dokumen ini mencatat **apa yang sebenarnya dilakukan** v1, sebagai baseline untuk migrasi Tahap 1 dan 2.
Sumber: `src/Code.gs`, `src/BCG.html`, dan analisis export `RHA_GALLERY_BCG_MATRIX_1-31_Mei_2026.csv` (473 produk valid).

## 1. Komponen

| File | Peran |
|---|---|
| `Code.gs` | `doGet()` menyajikan `BCG.html`; `getSheetData()` membaca tab `RUMUS` dan mengembalikan JSON |
| `BCG.html` | Frontend. Memanggil `google.script.run.getSheetData()` saat load dan saat klik Refresh |
| Tab `RUMUS` | Sumber data. Berisi formula yang menggabungkan data produk Shopee, iklan, dan kuadran |

## 2. Alur data

1. Browser membuka Web App, `BCG.html` memanggil `getSheetData()`.
2. Backend membaca seluruh tab `RUMUS`, memetakan kolom dari baris header.
3. Setiap baris dengan `Kuadran Number` 1–4 dan nama produk tidak kosong menjadi satu objek produk.
4. Backend mengembalikan `{ ok, rows[], sheetTitle, sheetName, readAt }`.
5. Frontend menghitung semua agregat (KPI, kategori, insight) di browser.

## 3. Objek produk (output backend)

| Field | Sumber | Catatan |
|---|---|---|
| `name` | `Nama Produk` | dipotong 65 karakter |
| `category` | `Category` | kosong atau `#N/A` menjadi `Uncategorized` |
| `k` | `Kuadran Number` | integer 1–4 |
| `traffic` | `Pengunjung` | angka, karakter non-digit dibuang |
| `cr` | **dihitung** | `Pembeli ÷ Pengunjung × 100`, 2 desimal; 0 jika salah satu 0 |
| `sales` | `Sales` | |
| `biaya` | `Biaya` | |
| `roas` | `ROAS` | `-`/kosong menjadi 0 (dianggap tidak beriklan) |
| `bench_cr` | **dihitung** dari `Range Price` | hanya untuk pewarnaan, lihat bagian 5 |
| `link` | `Link` | |

**Pencarian kolom:** exact match setelah normalisasi (lowercase, spasi/underscore dibuang). Fuzzy match sengaja dihapus (lihat bagian 9).

## 4. Definisi kuadran

Kuadran **tidak dihitung di kode**. Kode hanya membaca `Kuadran Number` dari Sheet.

| Number | Kuadran Traffic | Kuadran Conversion |
|---|---|---|
| 1 | High Traffic | High Conversion |
| 2 | Low Traffic | High Conversion |
| 3 | High Traffic | Low Conversion |
| 4 | Low Traffic | Low Conversion |

### Aturan yang terindikasi dari data Mei 2026

> ⚠️ Hasil **reverse-engineering** dari CSV, bukan dibaca dari formula. **Wajib dicocokkan dengan formula di tab `RUMUS`** sebelum dijadikan config Tahap 2.

**Threshold traffic:** `High Traffic` jika `Pengunjung ≥ 100`. Batas data: nilai High terendah 101, nilai Low tertinggi 99, jadi threshold = 100 pengunjung per bulan.

**Benchmark CR per range harga:** `High Conversion` jika CR ≥ benchmark range harganya. Harga lebih murah, benchmark lebih tinggi.

| Range Price | Jumlah SKU | CR tertinggi yang masih *Low* | CR terendah yang sudah *High* | Benchmark terindikasi |
|---|---|---|---|---|
| `< 25,000` | 386 | 4.84% | 5.01% | **≈ 5.0%** |
| `25,000 - 50,000` | 45 | 4.35% | 4.65% | **≈ 4.5%** |
| `50,000 - 75,000` | 26 | 4.44% | 4.55% | **≈ 4.5%** |
| `75,000 - 100,000` | 16 | 4.00% | 4.76% | antara 4.0% dan 4.76% (belum bisa dipersempit) |
| `≥ 100,000` | 0 | n/a | n/a | tidak ada data di Mei 2026 |

Distribusi Mei 2026: K1 = 16, K2 = 46, K3 = 69, K4 = 342 SKU.

## 5. Benchmark CR di kode (hanya untuk pewarnaan)

`bench()` di `Code.gs` memakai **batas atas** dari string `Range Price`:

| Batas atas range | `bench_cr` |
|---|---|
| ≥ 150.000 | 1.2% |
| ≥ 100.000 | 1.8% |
| ≥ 50.000 | 2.6% |
| lainnya / tidak terbaca | 3.9% |

Dipakai di tabel Produk: CR ≥ `bench_cr` berwarna hijau, di bawahnya oranye. **Tidak** memengaruhi kuadran.

## 6. Perhitungan di frontend

| Elemen | Rumus |
|---|---|
| KPI Total Revenue per kuadran | Σ `sales` produk di kuadran |
| Avg Traffic | rata-rata `traffic` semua SKU di kuadran |
| Avg CR | rata-rata sederhana `cr` semua SKU di kuadran (bukan tertimbang) |
| Avg ROAS | rata-rata `roas` hanya SKU dengan `roas > 0`; `—` jika tidak ada |
| Health kategori | `(K1 + K2) ÷ total SKU × 100`; hijau ≥ 60%, oranye ≥ 35%, merah di bawahnya |
| Ukuran titik matrix | `sqrt(sales ÷ max sales) × 40`, dibatasi 6–20 px |

Posisi titik di tab BCG Matrix **acak** (bukan koordinat traffic/CR). Matrix hanya menunjukkan keanggotaan kuadran.

Aksi default per kuadran: K1 Scale Ads, K2 Boost Budget, K3 Fix PDP, K4 Depriority.

## 7. Keterbatasan v1

- Hanya **satu periode** (apa isi `RUMUS` saat ini). Tidak ada riwayat.
- Tidak ada ad spend per kategori dan tidak ada penilaian over/underspend.
- Tabel Produk menampilkan 25 baris per halaman.
- Semua agregat dihitung di browser dari seluruh baris; aman untuk ratusan SKU, belum diuji untuk puluhan ribu.
- Satu spreadsheet = satu toko.

## 8. Known issues

1. **Warna CR tidak sinkron dengan kuadran di Sheet.** Benchmark di `bench()` (1.2–3.9%) jauh lebih rendah dari benchmark Sheet (≈ 4.5–5.0%). Pada data Mei 2026, **56 dari 473 produk** berwarna hijau di tabel padahal Sheet menandainya *Low Conversion*. Perlu diseragamkan: ambil benchmark dari sumber yang sama dengan penentu kuadran (lihat Tahap 1).
2. **Batas atas range ambigu.** Range `75,000 - 100,000` punya batas atas 100.000, sehingga jatuh ke tier `≥ 100.000` di `bench()`. Tier seharusnya didefinisikan eksplisit di config.
3. **Insight statis.** Teks insight (mis. "Proyeksi ROAS 6–7x") adalah hardcode, bukan hasil hitung dari data.
4. **KPI K2 menampilkan "0 budget ads" sebagai teks tetap** walau sebagian SKU K2 sebenarnya beriklan.

## 9. Riwayat bug yang sudah diperbaiki

| Bug | Penyebab | Perbaikan |
|---|---|---|
| CR dashboard `0.90%` padahal Sheet `9.8%` | `col()` punya fuzzy match (`indexOf`); kata `cr` cocok dengan header `Kuadran Conversion` sehingga kolom salah terbaca | Fuzzy match dihapus, exact match saja |
| CR masih meleset setelah perbaikan 1 | Bergantung pada format kolom `CR` (string berisi `%`) | CR dihitung langsung: `Pembeli ÷ Pengunjung × 100` |

Verifikasi sampel: produk ID `29915304617`, Pembeli 56, Pengunjung 571, CR 9.81%, sesuai Sheet.

## 10. Checklist uji manual

- [ ] Header `RUMUS` lengkap, dashboard memuat tanpa error
- [ ] Jumlah SKU di header = jumlah baris ber-`Kuadran Number` 1–4
- [ ] Hitung manual CR 3 produk, cocok dengan dashboard
- [ ] Total Revenue per kuadran cocok dengan SUMIF di Sheet
- [ ] Kategori kosong atau `#N/A` muncul sebagai *Uncategorized*
- [ ] Tombol Refresh mengambil data terbaru setelah Sheet diubah
