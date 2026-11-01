Report Automation
Semi-automated ads reporting on Google Apps Script + Google Sheets.
Data layer, logic layer, and delivery layer are kept separate.
```text
RAW DATA (Sheets)  →  Summary Tables  →  Apps Script Parser  →  Narrative  →  Delivery (Gmail / dll.)
```
Struktur repo
```text
weekly-report-automation-haydecor/
├── README.md
├── .gitignore
└── projects/
    ├── haydecor-weekly-report/     # Weekly HTML email ke client
    │   ├── README.md
    │   ├── .clasp.json.example
    │   └── src/
    │       ├── appsscript.json
    │       └── WeeklyReport.gs
    ├── meta-ads-importer/          # Tarik data harian Meta Ads (CPAS + Reguler) via API
    │   ├── README.md
    │   ├── .clasp.json.example
    │   └── src/
    │       ├── appsscript.json
    │       └── MetaAdsImporter.gs
    └── daily-report-core/          # Parser Daily_Overview → object siap pakai
        ├── README.md
        ├── .clasp.json.example
        └── src/
            ├── appsscript.json
            └── DailyReport.gs
```
Satu folder di `projects/` = satu Apps Script project (satu `scriptId`).
Project	Entry point	Trigger	Sheet utama
`haydecor-weekly-report`	`sendWeeklyReport()`	Senin 08.00–09.00	`KPI_PROGRESS`, `Weekly_Overview`, `Channel_Weekly`
`meta-ads-importer`	`importAllMeta()`	Harian 06.00–07.00	`RAW_META_CPAS`, `RAW_META_REG`
`daily-report-core`	`getDailyOverview()`	— (dipanggil modul delivery)	`Daily_Overview`
> Kalau `daily-report-core` dan weekly report ada di spreadsheet yang sama, file `.gs`-nya boleh
> digabung ke satu Apps Script project. Tidak ada nama fungsi/konstanta yang bentrok antar ketiga file.
Setup (sekali)
```bash
npm install -g @google/clasp
clasp login
```
Aktifkan Google Apps Script API: https://script.google.com/home/usersettings
Per project:
```bash
cd projects/<nama-project>
cp .clasp.json.example .clasp.json     # isi scriptId (Apps Script → Project Settings → IDs)
clasp pull                             # opsional: cek isi remote dulu
clasp push
```
Setelah push pertama, cek di editor Apps Script bahwa tidak ada file lama tersisa
(misalnya `Code.gs`). File lama dengan nama fungsi yang sama akan meng-override versi baru
karena semua file dalam satu project berbagi global scope.
Aturan secrets
Token / API key / account ID hanya di Script Properties, tidak pernah di kode atau commit.
`.clasp.json` dan `.clasprc.json` sudah di-`.gitignore`.
Repo sebaiknya private.
Git workflow
```bash
git init -b main
git add .
git commit -m "feat: initial import weekly report, meta importer, daily core"
git remote add origin <URL_REPO>
git push -u origin main
```
Konvensi commit: `feat(scope):`, `fix(scope):`, `chore(scope):`
dengan scope `weekly`, `meta`, atau `daily`. Contoh: `fix(weekly): watchlist hanya flag ROAS WoW negatif`.
Alur sehari-hari: edit lokal → `clasp push` → test di editor → commit.
Kalau ada edit langsung di editor Apps Script, jalankan `clasp pull` sebelum commit.
