# Meta Ads Importer — Haydecor

Tarik data harian (kemarin) dari Meta Marketing API ke Google Sheets, untuk dua account: **Meta CPAS** dan **Meta Reguler**.

- **File:** `src/MetaAdsImporter.gs`
- **Entry point:** `importAllMeta()` (atau `importMetaCPAS()` / `importMetaREG()` untuk test)
- **Idempotent:** upsert berdasarkan tanggal, aman dijalankan ulang.

## Script Properties (wajib, jangan di-commit)

| Key | Isi |
|---|---|
| `META_ACCESS_TOKEN` | Token dari Meta Business Manager |
| `META_CPAS_ACCOUNT_ID` | `act_xxxxxxxxx` |
| `META_REG_ACCOUNT_ID` | `act_xxxxxxxxx` |

Verifikasi dulu dengan `checkConfig()`.

## Output sheet

| Sheet | Header |
|---|---|
| `RAW_META_CPAS` | Date · Channel · Spend · Purchase · Purchase Value |
| `RAW_META_REG` | Date · Channel · Spend · Action · Action Type |

Posisi kolom sama di kedua sheet, hanya label yang berbeda (goal campaign berbeda).
Header sheet yang sudah ada tidak diubah oleh script.

## Trigger

`importAllMeta` · Day timer · 6am–7am.

## Troubleshooting

- Nilai metric selalu 0 → jalankan `debugRawActionsREG()` / `debugRawActionsCPAS()` dan cek `action_type` yang dikembalikan Meta.
- Baris dobel → `deduplicateCPAS()` / `deduplicateREG()`.
- Versi API ada di konstanta `META_API_VERSION`.
