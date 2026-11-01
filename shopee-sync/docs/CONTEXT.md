# Konteks Project: Shopee Seller Centre → Google Sheet Sync (v2.1, multi-klien)

Dokumen ini merangkum keputusan, temuan, dan status project supaya bisa dilanjutkan tanpa mengulang dari awal. Kode sumber ada di repo ini (`extension/`, `apps-script/`); dokumen ini sengaja tidak menyalin kode agar tidak berbeda dengan repo.

> Dokumen ini tidak memuat ID spreadsheet, URL `/exec`, token, atau isi HAR. Jangan menambahkannya.

## 1. Tujuan

Ekstensi Chrome (MV3) yang **menangkap secara pasif** response API Shopee Seller Centre lalu mengirimnya ke Google Sheet lewat Apps Script web app. Penggunaan internal tim untuk pelaporan harian.

| Dataset | Halaman Seller Centre | Kunci unik (kontrak ekstensi) |
|---|---|---|
| `ads` | Iklan Shopee → Performa (tab Iklan Produk & Iklan Toko+) | Date + Ads Type |
| `overview` | Data Bisnis → Tinjauan (Performa Toko) | Date |
| `offplatform` | Pemasaran → Laporan Pengunjung dari Platform Eksternal | Tanggal + Platform + Channel + Campaign Description |

Nama tab tujuan dan susunan kolom **berbeda per klien** dan diatur di `apps-script/clients/<klien>.gs`.

## 2. Status (per 2026-11-01)

| Komponen | Status |
|---|---|
| Ekstensi v2 | Berjalan di profil Chrome Haydecor; uji end-to-end lolos. |
| Apps Script v2.1 (satu file `Code.gs`) | Ter-deploy di project standalone Haydecor; semua uji lolos (konfirmasi user). |
| Apps Script v2.1 versi pecah (`core.gs` + `client.gs`, ID di Script Properties) | Sudah di repo dan lolos uji simulasi; **perlu dikonfirmasi apakah sudah di-deploy ulang dan dites ulang** di project Haydecor. Sampai itu terjadi, repo dan deployment berbeda. |
| Heiji | Masih memakai Code.gs v2 lama (terikat ke spreadsheet, skema tetap). Belum ada `clients/heiji.gs`. |
| Folder `extension/` di repo | Harus diisi dengan 7 file ekstensi v2 yang lolos uji. |

## 3. Keputusan yang sudah ditetapkan

1. **Sumber data = response API internal yang ditangkap pasif** (membungkus `fetch`/XHR di halaman). Ekstensi tidak pernah membuat request ke Shopee, karena Shopee memakai header anti-bot (`af-ac-enc-*`, `x-sz-sdk-version`, fingerprint perangkat) dan parameter sesi `SPC_CDS`.
2. **Tanpa token.** URL `/exec` berfungsi sebagai kunci. Apps Script memvalidasi bentuk data dan header tab.
3. **Satu tombol Kirim** untuk semua dataset. Popup menampilkan pratinjau baru/berubah/sama/tidak dikirim per dataset sebelum mengirim. Tidak ada pengiriman otomatis.
4. **Hari berjalan tidak pernah diambil** karena datanya belum final.
5. **Sheet adalah satu-satunya sumber kebenaran.** Ekstensi tidak menyimpan riwayat terkirim; buffer tangkapan ada di `chrome.storage.session` dan dikosongkan setelah Kirim berhasil.
6. **Satu klien = satu project Apps Script standalone + satu profil Chrome.** Tidak ada filter `shop_id` di ekstensi; pemisahan klien dijamin oleh profil Chrome yang berbeda (keputusan sadar).
7. **Project Apps Script terpisah dari project lain di spreadsheet yang sama** (mis. `Weekly_Report_Automation`). Semua file `.gs` dalam satu project berbagi ruang nama global; menumpang di project lain berisiko mematikan trigger laporan karena tabrakan nama.
8. **Satu mesin, banyak konfigurasi.** `core.gs` sama untuk semua klien. Yang berbeda per klien hanya konstanta `CLIENT` (`client.gs`) dan Script Property `SPREADSHEET_ID`.
9. Status pesanan Performa Toko = **confirmed** (= "Pesanan Siap Dikirim" di dashboard).
10. Off-platform hanya diambil bila filter **Semua Platform** (`terminal=0`) dan **Semua Channel** (`channel=` kosong). Parameter tak dikenal → ditolak (fail-closed); popup memberi peringatan.

## 4. Arsitektur

```
Halaman Seller Centre (fetch/XHR)
  └─ injected.js   MAIN world; router per path API; hanya membaca response
       │ window.postMessage {dataset, rows | warning}
  └─ content.js    jembatan
background.js      buffer per dataset (storage.session), peringatan, panggil Apps Script
popup              [Cek]   → action "check"  (tidak menulis)
                   [Kirim] → action "upsert" {datasets:{ads, overview, offplatform}}
Apps Script        core.gs + client.gs → openById(SPREADSHEET_ID) → tab per dataset
```

- `datasets.js` dipakai bersama `background.js` (importScripts) dan `popup.js`: kolom, kunci, label.
- Content script cocok dengan `https://seller.shopee.co.id/*` karena Seller Centre berpindah halaman tanpa reload. `injected.js` berjalan `world: "MAIN"`, `run_at: document_start` (butuh Chrome 111+).
- POST ke Apps Script memakai `Content-Type: text/plain;charset=utf-8` untuk menghindari preflight CORS.
- Ekstensi menolak Code.gs selain versi `2.x`; Code.gs v2.1 menolak payload ekstensi 1.x (`{rows}`). **Ekstensi dan Apps Script harus dinaikkan versinya bersamaan.**

## 5. Kontrak ekstensi ↔ Apps Script

Didefinisikan di `datasets.js` (ekstensi) dan konstanta `EXT` (`core.gs`). Keduanya harus diubah bersamaan; kalau tidak, popup salah mencocokkan hasil cek.

**Field yang dikirim ekstensi**

| Dataset | Field |
|---|---|
| ads | `Date`, `Net Cost Spent`, `Impr`, `Click`, `Order`, `Purchase Conversion Value`, `Channel` (= `Shopee Ads`), `Ads Type` (`GMV Max Product` / `Iklan Toko`) |
| overview | `Date`, `Orders (Confirmed)`, `Sales (Confirmed)`, `Visitors` |
| offplatform | `Tanggal`, `Platform` (= `Semua`), `Channel`, `Campaign Description`, 10 angka hitungan, 3 persentase (bisa `null`) |

Semua tanggal dikirim sebagai `yyyy-mm-dd` (GMT+7). Semua angka hitungan bilangan bulat ≥ 0.

**Respons Apps Script**

- `GET /exec` → `{ok, version, client, datasets: {<dataset>: "<tab>: <kolom>" | "nonaktif" | "(akan dibuat)"}}`.
- `check` → `{ok, version, results: {<dataset>: [{key, status, old}]}}`. `status` ∈ `new`, `changed`, `same`, `disabled`. `key` memakai nilai versi **ekstensi** (mis. `2026-10-22|GMV Max Product`), bukan nilai sheet.
- `upsert` → `{ok, version, summary: {<dataset>: {inserted, updated, skipped, formulas?, keptOld?, disabled?}}}`.
- `old` hanya berisi nilai lama untuk angka yang **benar-benar berbeda**; angka lain diisi nilai kiriman supaya popup tidak mencoretnya.

**Tambalan ekstensi untuk status `disabled`** (popup.js dan background.js): label status, tidak dihitung di tombol Kirim maupun badge, dan ringkasan hasil menyebut jumlah yang tidak dikirim. Tanpa tambalan ini Kirim tetap aman, tetapi hitungan di popup menyesatkan.

## 6. Konfigurasi klien (`CLIENT`)

```
CLIENT = { name, datasets: { <dataset>: {
  enabled, sheet, createIfMissing, allowOverwrite,
  date: { realFormat, textPattern, emptyTab },
  numFormat,
  columns: [{ header, field, type: 'date'|'num'|'rate'|'text', key?, optional?, map? }]
}}}
```

- Header dicocokkan **berdasarkan nama** (tidak peka huruf besar/kecil), bukan posisi. Header duplikat → error.
- `type 'num'` dibandingkan untuk status sama/berubah. `type 'rate'` tidak dibandingkan; ditulis ulang hanya bila angka ditimpa; `null` ditulis `-`.
- `map` menerjemahkan nilai ekstensi ke nilai sheet (mis. `GMV Max Product` → `Product`).
- `date.realFormat` / `textPattern` = `null` berarti ikuti gaya baris data terakhir. `emptyTab` berlaku bila tab masih kosong (`'date'` = tanggal asli, atau pola teks seperti `'dd-MM-yyyy'`).
- `enabled: false` → data dataset itu dibalas `disabled` dan tidak ditulis.

## 7. Jaminan penulisan (core.gs)

1. Tidak pernah menghapus baris, mengosongkan sel, atau mengurutkan sheet.
2. **Semua atau tidak sama sekali**: semua dataset direncanakan dan divalidasi dulu. Satu tab/header salah atau satu baris tidak valid → tidak ada yang ditulis ke tab mana pun, dan tab baru tidak dibuat.
3. Baris baru ditambahkan di bawah baris terakhir yang **kolom tanggalnya** terisi (bukan `getLastRow()`, karena rumus yang diisi ke bawah ikut terhitung). Penulisan **per kolom yang dipetakan**, sehingga kolom lain (rumus, isian manual) tidak tertimpa.
4. Rumus di kolom yang tidak dipetakan disalin (R1C1, relatif) dari baris data terakhir **hanya ke sel baru yang masih kosong**.
5. Baris lama: hanya sel angka yang kosong (selalu diisi) atau berbeda (hanya bila `allowOverwrite: true`) yang ditulis. Kolom kunci tidak disentuh. Baris dibaca ulang sebelum ditulis; bila kuncinya sudah bergeser, proses dibatalkan.
6. Teks lama seperti `Rp633,759` dibaca sebagai angka saat membandingkan, sehingga tidak dianggap "berubah".
7. Kunci yang sama dalam satu kiriman → yang terakhir dipakai. Dobel lama di sheet → baris pertama yang jadi acuan (dobel tidak dihapus otomatis).
8. `LockService` 30 detik; bila sibuk, request ditolak dengan pesan coba lagi.

## 8. Klien: Haydecor (Daily Tracking)

| Dataset | Tab | Status | Catatan |
|---|---|---|---|
| ads | `RAW_SHOPEE_ADS` (sudah ada) | aktif, `createIfMissing: false` | Skema lama + `Impr`, `Click`, `Order` di F–H. |
| overview | `Shopee Overview` | aktif, dibuat otomatis | Skema sama dengan v2. |
| offplatform | `RAW_SHOPEE_UTM` | aktif, dibuat otomatis | Header A–Q sama dengan template Heiji; **tanpa** kolom rumus R–W. |

**Pemetaan `RAW_SHOPEE_ADS`**

| Kolom sheet | Field ekstensi | Kartu dashboard |
|---|---|---|
| Date | Date | — |
| Channel | Channel → `Shopee_Ads` | — |
| Spend | Net Cost Spent | Biaya Iklan |
| Revenue | Purchase Conversion Value | Penjualan |
| Ads_Type | Ads Type → `Product` / `Shop` | — |
| Impr / Click / Order (opsional) | Impr / Click / Order | Iklan Dilihat / Jumlah Klik / Pesanan |

Definisi Spend dan Revenue historis sudah dikonfirmasi user sama dengan kartu Biaya Iklan dan Penjualan.

**Format**: tanggal ditulis sebagai tanggal asli dengan tampilan `yyyy-mm-dd` (bila kolom berisi teks, ditulis teks `yyyy-mm-dd`). Angka RAW: format `0`, tanpa Rp dan pemisah ribuan. `allowOverwrite: true` (angka Shopee beberapa hari terakhir bisa direvisi oleh atribusi konversi yang terlambat; asumsi, belum diverifikasi).

**Keputusan untuk `RAW_SHOPEE_UTM` Haydecor**: tanggal asli `yyyy-mm-dd` dan persen sebagai angka `0.00%`, **berbeda** dengan Heiji (teks `dd-mm-yyyy`, persen teks `1,43%`). Alasan: seragam dengan `RAW_SHOPEE_ADS` dan langsung bekerja dengan `SUMIFS`/`QUERY`. Konsekuensi: rumus Heiji berbasis `SPLIT` atas teks tanggal tidak bisa disalin apa adanya. Setelah tab berisi data, script mengikuti gaya baris terakhir.

**Temuan data historis `RAW_SHOPEE_ADS`** (ekspor CSV, 236 baris; bukan karena ekstensi):
- Product: 19/06–22/10/2026 lengkap tanpa tanggal bolong.
- Shop: tidak konsisten. Hari tanpa aktivitas kadang dicatat `0,0` (mis. 01/09, 17–19/10), kadang tidak dicatat (mis. 31/08, 02–08/09, 13/09, 15/09). Ekstensi kini selalu menulis baris 0. Formula yang menghitung jumlah hari aktif atau rata-rata bisa terpengaruh.
- Baris 19–21/06 berformat `Rp633,759` (kemungkinan teks). Fungsi bantu pembersihan format tidak mengubah nilai teks; perlu diketik ulang manual bila ingin seragam.
- Tidak ada kombinasi Date + Ads_Type yang dobel.

## 9. Temuan teknis API (hasil analisis HAR)

**Iklan Shopee** — `POST /api/pas/v1/report/get_time_graph/`
- Dipanggil untuk tab Iklan Produk dan Iklan Toko+; dibedakan oleh `data.key`: `product_homepage_v2` → `GMV Max Product`, `shop_homepage` → `Iklan Toko`.
- `report_by_time` = bucket per jam (`key` = epoch detik); dijumlahkan per hari GMT+7. Jumlah 24 bucket = `report_aggregate`.
- **Uang PAS = Rupiah × 100.000.** Contoh `cost` 168300678963 → Rp1.683.007.
- Kartu "Pesanan" = `checkout` (bukan `broad_order`). "Produk Terjual" = `broad_order_amount`. Penjualan = `broad_gmv`. ROAS = `broad_roi`.

**Performa Toko** — `GET /api/mydata/v3/dashboard/key-metrics/`
- Uang mydata = Rupiah (bukan × 100.000).
- 1 hari → pakai `.value`; >1 hari → `points[].timestamp` per hari.
- **Pengunjung unik tidak boleh dijumlahkan**: "Kemarin" `shop_uv` 1.938 vs jumlah 24 titik per jam 2.256; 7 hari 12.044 vs jumlah harian 13.747. Total mingguan dari menjumlah baris harian di sheet = visitor-days, bukan orang unik.
- Varian placed/paid/confirmed ada sekaligus; dropdown "Status Pesanan" hanya mengubah tampilan.

**Off-platform** — `.../marketing/off-platform/traffic-reporting/channel-metric/`
- Satu response memuat overview, per hari × channel × campaign, dan per campaign; tab "Per Hari" dirender tanpa request baru.
- `-1000000` = tidak tersedia.
- Data tertinggal ≥ 1 hari dan beberapa hari terakhir masih bertambah → popup menandai 3 hari terakhir sebagai "sementara".

**Tidak dipakai**: `report/get_config`, `report/get` (per kampanye), `product/gms/list_item_product_performance`, `product-performance` (berhalaman), `order-performance` dan `traffic-sources` (sempat "data isn't ready").

**Router** di `injected.js` menerima versi path `v\d+`, tetapi perubahan bentuk response akan membuat data diabaikan tanpa error.

## 10. Pasang klien baru / upgrade

1. Salin `apps-script/clients/haydecor.gs` → `clients/<klien>.gs`; ubah `name`, nama tab, pemetaan kolom, `enabled`. Commit.
2. script.google.com → New project (standalone). File `core.gs` + `client.gs`.
3. Project Settings → Script Properties → `SPREADSHEET_ID`.
4. Jalankan `doGet` sekali dari editor (otorisasi).
5. Deploy → New deployment → Web app; Execute as: **Me**; Who has access: **Anyone**. Salin URL `/exec`.
6. Buka URL di browser → `"ok":true,"version":"2.1"`, tab dan kolom benar.
7. Profil Chrome klien: Load unpacked folder `extension/`, isi URL di popup, Tes koneksi.
8. Uji pertama dengan **Cek saja**: tanggal yang sudah ada di sheet harus "Sudah ada" atau "Berubah" tanpa angka dicoret (hanya mengisi kolom kosong). Angka dicoret di Spend/Revenue = definisi atau data lama berbeda → periksa dulu sebelum Kirim.

**Mengubah kode**: ubah di repo → commit → tempel ke project terdampak → Deploy → Manage deployments → Edit → **New version** (bukan New deployment, yang membuat URL baru). Naikkan `VERSION` (core.gs) dan `version` (manifest.json).

## 11. Ceklis pengujian

- [ ] `/exec` menampilkan `version 2.1` dan kolom yang terbaca per dataset; popup "Tersambung".
- [ ] Iklan Shopee: 2 baris per hari; angka = kartu Biaya Iklan, Iklan Dilihat, Jumlah Klik, Pesanan, Penjualan.
- [ ] Performa Toko "Kemarin": 1 baris; rentang 7 hari: 7 baris, baris kemarin sama dengan hasil "Kemarin".
- [ ] Off-platform 7 hari: jumlah baris = tab Per Hari; total = kartu Tinjauan. Filter selain Semua → peringatan, tidak ada baris.
- [ ] Cek tidak menulis apa pun dan tidak membuat tab.
- [ ] Kirim → baris baru di bawah baris data terakhir, format tanggal/angka benar, rumus di kolom tak terpetakan tersalin ke sel kosong.
- [ ] Kirim ulang → semua "sama". Ambil ulang esok hari → baris "sementara" yang berubah menjadi "diperbarui".
- [ ] Ubah satu header di sheet uji → Kirim ditolak dengan nama header yang hilang; tab lain tidak berubah.
- [ ] Hapus Script Property `SPREADSHEET_ID` → pesan error jelas.

## 12. Keamanan

- **URL `/exec` adalah kunci.** Jangan taruh di repo, issue, PR, chat, atau screenshot. Bila bocor: archive deployment, buat deployment baru, ganti URL di popup.
- Sisakan satu deployment aktif per project (Manage deployments → Archive sisanya).
- **File HAR berisi token sesi Seller Centre dan identitas toko.** Jangan disimpan di folder repo; `.gitignore` memblokir `*.har`, tetapi tetap periksa `git status` sebelum commit.
- Ekspor data klien (CSV/XLSX) tidak boleh di-commit.
- Repo harus private.

## 13. Batasan dan risiko

- Data hanya tertangkap saat halaman Seller Centre terbuka dan memuat data; tidak ada pengambilan di latar belakang.
- Shopee tidak menyediakan API resmi untuk ini. Perubahan endpoint, `data.key`, atau bentuk response membuat data tidak tertangkap tanpa error.
- Tanpa token, validasi bentuk data dan header hanya pengaman ringan.
- Kartu Penjualan Performa Toko berlabel "Perubahan Definisi 2026"; data lama di sheet mungkin tidak sebanding.
- `allowOverwrite: true` berarti angka lama yang berbeda ditimpa setelah ditampilkan dicoret di popup. Riwayat nilai lama hanya ada di Version history Google Sheets.

## 14. Hal terbuka / langkah berikutnya

1. Konfirmasi deployment Haydecor sudah memakai versi pecah (`core.gs` + `client.gs` + Script Property) dan dites ulang, supaya repo = deployment.
2. Isi `extension/` dengan file v2 yang lolos uji; pastikan status tambalan `disabled` tercermin.
3. Migrasi Heiji ke v2.1: buat `clients/heiji.gs` yang meniru perilaku v2 (tab `Shopee Ads`, `Shopee Overview`, `RAW_SHOPEE_UTM` dengan teks `dd-mm-yyyy` dan persen teks), project standalone, lalu archive deployment v2 lama.
4. Heiji: backfill 17–22 Agu dan perbaiki rumus R 01–05 Sep (24 baris, termasuk penjualan 838.944 dan 254.150).
5. Haydecor: tentukan perlakuan hari Shop tanpa aktivitas (baris 0 vs tidak ada) di formula laporan.
6. Opsional: tipe iklan lain (Banner, Live) → tambah di `ADS_TYPES` (`injected.js`), `EXT.ads.valid` (`core.gs`), dan `map` Ads_Type di konfigurasi klien setelah `data.key`-nya terlihat di HAR.

## 15. Riwayat versi

| Versi | Ringkasan |
|---|---|
| 1.0 | Ekstensi + Code.gs terikat; ads saja, tab `Shopee Ads`, upsert Date + Ads Type. |
| 1.1 | Aksi `check` (pratinjau tanpa menulis); sheet sebagai sumber kebenaran. |
| 1.2–1.3 | Code.gs standalone untuk Haydecor: tulis ke `RAW_SHOPEE_ADS` dengan pemetaan kolom, tanggal `yyyy-mm-dd`, angka RAW, kolom opsional F–H, `allowOverwrite`. |
| 2.0 | Ekstensi 3 dataset (ads, overview, offplatform), satu tombol Kirim, router per path. Code.gs terikat dengan skema tetap (dipakai Heiji). |
| 2.1 | Code.gs multi-klien: mesin `core.gs` + konfigurasi `CLIENT` per klien, header berdasarkan nama, semua-atau-tidak-sama-sekali, status `disabled`, ID spreadsheet di Script Properties. |
