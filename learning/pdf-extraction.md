# Referensi Ekstraksi: PDF → MD

## Alat

- Python3 + `pdfplumber` (di venv: `/home/hawasy/copyparty-venv/bin/python`)
- Script ekstrak: `/home/hawasy/.hermes/cache/scratch/extract_pdf.py`

## Satatu-linier

```bash
/home/hawasy/copyparty-venv/bin/python /home/hawasy/.hermes/cache/scratch/extract_pdf.py <input.pdf> <output.txt>
```

## Format output

- Setiap halaman diberi header `--- PAGE N ---` diikuti isi teks.
- Hasil mentah masih perlu dibersihkan (tabel, header, footer).

## Catatan

- PDF berisi teks; jangan pakai pdftotext jika hasilnya parsial.
- Untuk dokumen dengan banyak halaman, jalankan satu per satu dan push hasil ke `learning/deck-reference/<client-name>/`.
