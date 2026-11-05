# Report Style Toolkit

Repo general untuk mencerna gaya penulisan laporan performa (ads / pendapatan)
supaya tetap natural, konsisten, dan tidak terasa seperti output AI default.
Repo ini **bukan client-specific** — bisa dipakai berbagai client dengan konfigurasi
hanya di `style/SOP.md`.

## 3 Komponen (saling melengkapi)

| Komponen | Path | Peran |
|---|---|---|
| **Not-AI Skill** | `SKILL.md` | Guardrails: apa yang DILARANG saat draft & scoring. Baca otak agent sebelum kirim. |
| **SOP / Style** | `style/SOP.md` | Aturan apa yang ditulis: template, kosakata, pola kalimat, aturan angka, daftar terlarang. |
| **Learning** | `learning/` | Referensi & penjelasan: ekspor deck reference, pola kalimat, voice notes, template kosong. |

## Alur pakai

1. Agent mulai → baca `SKILL.md` sebagai filter (tidak ada AI tint).
2. Agent menulis draft → ikuti `style/SOP.md` (stuktur, gaya, angka).
3. Agent cek akhir → final checklist berdasar `SKILL.md`.
4. Manusia review → rujukan `learning/` kalau ragu kenapa tertentu.

## Konfigurasi per client (hanya isi yang berubah)

- `style/SOP.md` → ganti `[CHANNEL]`, `[PRODUCT]`, `[CLIENT]` dengan data asli client.
- `learning/deck-reference/<client-name>/` → copy deck referensi + catatan sendiri.
- `learning/templates.md` → template sesuai tipe laporan client.

## Sumber

- Deck referensi untuk learning: `/home/hawasy/Data-Archieve/Deck Reference/`
- Note "tidak AI" pendukung: `/home/hawasy/Data-Archieve/not-ai-decks-guide.md`
- Ekstraksi PDF → MD: `learning/pdf-extraction.md`
