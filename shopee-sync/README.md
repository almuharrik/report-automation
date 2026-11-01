# Shopee Seller Centre → Google Sheet Sync

Ekstensi Chrome (MV3) yang **menangkap secara pasif** response API Seller Centre (Iklan Shopee,
Performa Toko, Off-platform) lalu mengirimnya ke Google Sheet lewat Apps Script web app.
Ekstensi tidak pernah membuat request sendiri ke Shopee. Penggunaan internal.

## Struktur

```
extension/                 ekstensi Chrome v2 (sama untuk semua klien)
apps-script/
  core.gs                  mesin penerima v2.1 (sama untuk semua klien, jangan diubah per klien)
  clients/haydecor.gs      konfigurasi klien Haydecor (konstanta CLIENT)
docs/CONTEXT.md            konteks project: keputusan, temuan API, skema, ceklis uji
```

## Satu klien = satu project Apps Script + satu profil Chrome

| Lokasi | Isi |
|---|---|
| Project Apps Script standalone | `core.gs` + `client.gs` (salinan `clients/<klien>.gs`) |
| Script Properties project itu | `SPREADSHEET_ID` = ID spreadsheet klien |
| Profil Chrome klien | ekstensi + URL `/exec` milik project klien |

ID spreadsheet dan URL `/exec` **tidak disimpan di repo**.

## Pasang klien baru

1. Salin `apps-script/clients/haydecor.gs` menjadi `clients/<klien>.gs`; ubah `name`, nama tab,
   pemetaan kolom, dan `enabled` per dataset. Commit.
2. script.google.com → New project. Buat file `core.gs` dan `client.gs`, tempel isinya.
3. Project Settings → Script Properties → tambah `SPREADSHEET_ID`.
4. Jalankan `doGet` sekali dari editor untuk otorisasi.
5. Deploy → New deployment → Web app; Execute as: Me; Who has access: Anyone. Salin URL `/exec`.
6. Buka URL itu di browser: harus `"ok":true,"version":"2.1"` dan tab/kolom yang benar.
7. Di profil Chrome klien: isi URL di popup → Tes koneksi → uji pertama dengan Cek saja.

## Mengubah kode

- Ubah di repo dulu, commit, lalu tempel ke project Apps Script yang terdampak
  (`core.gs` → semua klien; `clients/<klien>.gs` → klien itu saja).
- Deploy → Manage deployments → Edit → Version: **New version**. Jangan "New deployment"
  (membuat URL baru).
- Naikkan versi: `VERSION` di `core.gs` (ekstensi menerima 2.x), `version` di `manifest.json`.
- Kontrak ekstensi ↔ Apps Script ada di konstanta `EXT` di `core.gs` dan `datasets.js`.
  Mengubah salah satu tanpa yang lain akan membuat popup salah mencocokkan hasil cek.

## Keamanan

- Tidak ada token. **URL `/exec` berfungsi sebagai kunci**: siapa pun yang tahu URL bisa menulis
  ke sheet. Jangan taruh di repo, issue, PR, atau screenshot. Kalau bocor: archive deployment
  itu, buat deployment baru, ganti URL di popup.
- File HAR berisi token sesi Seller Centre. Jangan disimpan di folder repo.
- Sisakan satu deployment aktif per project (Manage deployments → Archive sisanya).
