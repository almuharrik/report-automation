# Daily Ads Report Automation

Google Apps Script yang mengirim **snapshot performa iklan harian** ke **Telegram** dan **WhatsApp (grup)** untuk beberapa client sekaligus (saat ini: Haydecor & RHA Gallery).

> Laporan ini adalah *operational snapshot* (bukan analisis eksekutif): angka closing kemarin + akumulasi MTD.

---

## Arsitektur

```
Table_Consolidated (Google Sheets, per client)
        │
        ▼
  daily_core.gs ──► getDailyOverview()   closing kemarin
                └─► getDailyMTD()        1st bulan → kemarin
        │
        ▼
  telegram_delivery.gs ──► generateTelegramMessage() ──► Telegram Bot API
  whatsapp_delivery.gs ──► (reuse pesan yang sama)   ──► Fonnte API → grup WA
```

| File | Fungsi |
|---|---|
| `src/Config.gs` | Konstanta channel, client config (dibaca dari Script Properties), helper tanggal & cek hari Minggu |
| `src/daily_core.gs` | `getDailyOverview()`, `getDailyMTD()` — baca `Table_Consolidated`, hitung metrik |
| `src/telegram_delivery.gs` | Format pesan + kirim Telegram + `runDailyTelegramReportAll()` |
| `src/whatsapp_delivery.gs` | Kirim pesan yang sama ke grup WA via Fonnte + `runDailyWhatsAppReportAll()` |
| `src/daily_testing.gs` | Test function per layer + `debugTodayRows()` untuk investigasi data |
| `src/appsscript.json` | Manifest (timezone `Asia/Jakarta`, runtime V8) |

---

## Aturan bisnis (penting)

1. **Daily Report Date = kemarin.** Script jalan tanggal X → data yang dilaporkan tanggal X−1.
2. **MTD mengikuti bulan dari Daily Report Date**, bukan tanggal script jalan. Jalan 1 Jun → data 31 Mei → MTD 1–31 Mei.
3. **Satu sumber data:** `Table_Consolidated` untuk daily maupun MTD.
4. **Row `Shopee`** = total revenue marketplace (bukan channel iklan). Hanya dipakai untuk Total Revenue, Revenue MTD, dan Non Ads Revenue.
5. **Channel iklan** (dihitung sebagai channel performance): `Meta_Reguler`, `Meta_CPAS`, `Shopee_Ads`, `TikTok_Ads`.
6. Channel yang **belum pernah punya aktivitas** (cost/revenue ads = 0 di seluruh histori) otomatis **disembunyikan** dari pesan, dan muncul sendiri begitu ada datanya (contoh: TikTok Ads).
7. Spend channel = 0 → ROAS ditampilkan `-`.
8. **Trigger skip hari Minggu** (dicek berdasarkan hari script dijalankan).

### Rumus

| Metrik | Rumus |
|---|---|
| Revenue | `Revenue` dari row `Shopee` |
| Spend | Σ `Cost` semua channel iklan |
| ACR | Spend ÷ Revenue |
| ROAS | Σ `Revenue Ads` ÷ Spend |
| Non Ads Revenue | Revenue − Σ `Revenue Ads` |
| Non Ads Contribution | Non Ads Revenue ÷ Revenue |

### Struktur `Table_Consolidated`

Header yang dibaca script (nama harus persis):

`Tanggal | Channel | Cost | Revenue Ads | Revenue | ...`

Grain: 1 baris = 1 tanggal × 1 channel. Isi kolom `Channel` harus **persis** sama dengan `sheetName` di `AD_CHANNELS` (`Config.gs`), termasuk kapitalisasi dan underscore.

---

## Setup

### 1. Script Properties

Apps Script editor → **Project Settings (⚙️) → Script Properties**. Isi key berikut (nilai **jangan** di-commit ke repo):

| Key | Isi |
|---|---|
| `HAYDECOR_SHEET_ID` | Spreadsheet ID `Table_Consolidated` Haydecor |
| `RHA_SHEET_ID` | Spreadsheet ID `Table_Consolidated` RHA Gallery |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram (1 bot untuk semua client) |
| `HAYDECOR_CHAT_ID` | Chat ID Telegram tujuan Haydecor |
| `RHA_CHAT_ID` | Chat ID Telegram tujuan RHA Gallery |
| `FONNTE_TOKEN` | Token device Fonnte (1 device untuk semua client) |
| `HAYDECOR_WA_GROUP_ID` | Group ID WhatsApp Haydecor (format `xxxx@g.us`, ambil dari dashboard Fonnte) |
| `RHA_WA_GROUP_ID` | Group ID WhatsApp RHA Gallery (format `xxxx@g.us`) |

> Device Fonnte harus sudah menjadi member grup tujuan.

### 2. Deploy kode

**Opsi A — clasp (disarankan):**

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json     # isi scriptId project Apps Script
clasp push
```

**Opsi B — manual:** copy isi tiap file di `src/` ke Apps Script editor dengan nama file yang sama.

### 3. Testing (urut, jangan skip)

Pilih function di dropdown editor, lalu klik **Run**:

1. `testDailyOverview` — cek angka Revenue / Spend / channel di Logger
2. `testDailyMTD` — cocokkan dengan MTD yang kamu tahu benar
3. `testTelegramMessage` — preview pesan di Logger (belum kirim)
4. `testSendTelegram` — kirim betulan ke Telegram
5. `testSendWhatsApp` — kirim betulan ke grup WhatsApp

> **Jangan run** `sendTelegramReport` / `sendWhatsAppReport` langsung dari dropdown. Function ini butuh parameter `clientKey`; tombol Run memanggilnya tanpa argumen sehingga error `Client key tidak dikenal: undefined`. Pakai wrapper: `testSend*`, `sendWhatsAppReport_Haydecor`, `sendWhatsAppReport_RHA`.

### 4. Trigger harian

Triggers (⏰) → **Add Trigger**, time-driven, day timer, pagi hari. Dua trigger **terpisah**:

| Function | Kirim ke |
|---|---|
| `runDailyTelegramReportAll` | Telegram (semua client) |
| `runDailyWhatsAppReportAll` | Grup WhatsApp (semua client) |

Kedua function otomatis **skip di hari Minggu**. Error di satu client tidak menghentikan pengiriman ke client lain.

---

## Menambah client baru

1. Tambah entry baru di `getClientConfigs_()` (`Config.gs`) + Script Properties-nya.
2. Tambahkan key client di `daily_testing.gs` dan `testSendWhatsApp()` (array `['HAYDECOR', 'RHA']`).

## Menambah / mengganti channel

Edit array `AD_CHANNELS` di `Config.gs`:

```javascript
{ sheetName: 'Nama_Persis_Di_Sheet', label: 'Nama Tampil di Pesan' }
```

---

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Revenue masuk, Spend = 0 | Nama channel di sheet tidak persis sama dengan `sheetName` (kapital, spasi, underscore) | Jalankan `debugTodayRows('HAYDECOR')`, cek kolom `MatchAdChannels` |
| Spend terbaca 0 padahal ada isi | Kolom `Cost` berupa teks (mis. `Rp150.000`) sehingga `Number()` jadi `NaN` | Pastikan kolom `Cost` bernilai angka murni |
| `Client key tidak dikenal: undefined` | Function berparameter di-run langsung dari editor | Pakai wrapper / `testSend*` |
| `... belum diisi di Script Properties` | Key Script Properties belum diisi / salah ketik | Cek tabel Script Properties di atas |
| Pesan WA ditolak Fonnte (HTTP 200, `status: false`) | Device Fonnte disconnect, atau bukan member grup / Group ID salah | Cek dashboard Fonnte |

---

## Keamanan

- Semua kredensial & ID ada di **Script Properties**, tidak ada secret di kode.
- Gunakan repo **private**; README ini menggambarkan struktur setup client.
- `.clasp.json` dan `.clasprc.json` sudah masuk `.gitignore`.
