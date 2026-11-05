# Haydecor — Weekly Performance Report

HTML email ke client tiap Senin: Progress to Target → Weekly Review (WoW) → Channel Performance → Watchlist, plus CTA ke Looker Studio.

- **File:** `src/WeeklyReport.gs`
- **Entry point:** `sendWeeklyReport()`
- **Delivery:** `GmailApp` (HTML body)

## Sheet yang dibaca

| Sheet | Kolom (urutan) |
|---|---|
| `KPI_PROGRESS` | Metric · Current · Target/Threshold · Expected Pace · Status · Progress (baris: `Revenue`, `Spend`, `ACR`) |
| `Weekly_Overview` | Weekstart · Spend · Revenue · ACR · WoW Revenue · WoW Spend · WoW ACR |
| `Channel_Weekly` | Weekstart · Channel · Spend · Revenue Ads · ROAS · Spend WoW · Revenue WoW · ROAS WoW |

- Weekend dihitung di script (`Weekstart + 6`), kolom helper `WeekEnd` di sheet tidak dipakai.
- Status di `KPI_PROGRESS` dibaca lewat teks: `Healthy` / `On Track` → hijau, `Watchlist` → kuning, selain itu → merah (Behind).
- Watchlist hanya menandai channel dengan **ROAS WoW negatif**.

## Config

Edit blok `CONFIG` di bagian atas `WeeklyReport.gs` (penerima, CC, nama pengirim, warna).
Link Looker Studio ada di blok `CTA LOOKER STUDIO` di dalam `buildEmailHTML()`.

## Trigger

Apps Script → Triggers → Add Trigger: `sendWeeklyReport` · Time-driven · Week timer · Every Monday · 8am–9am.
(`setupWeeklyTrigger()` adalah alternatif lewat kode, tidak wajib.)

## Anchor bulan di `KPI_PROGRESS`

Formula KPI jangan pakai `TODAY()`, supaya laporan yang dikirim Senin awal bulan tetap membahas bulan yang benar.
Bulan laporan ditentukan dengan majority rule di cell `H3`: `=IF(DAY($H$2)>=4, $H$2, $H$1)`
(`H1` = weekstart, `H2` = weekend pekan yang dilaporkan).

## Testing

`testKPI()` · `testWeekly()` · `testChannel()` · `testPreview()` · `debugWeekend()` — semua log ke Logger, tidak mengirim email.
