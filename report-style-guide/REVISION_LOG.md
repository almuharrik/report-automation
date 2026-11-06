# Revision Log — SOP Reporting Style Haydecor

> **Tanggal:** 2026-11-06  
> **Status:** Feedback user terkonfirmasi — **wajib dijadikan acuan** untuk revisi SOP berikutnya dan penulisan report Haydecor oleh model/agent mana pun.  
> **Konteks:** Review narasi `Haydecor Ads Performance Report — Oktober 2026`, dibandingkan dengan report final pada `Report-Archieve-MD/`.  
> **Cakupan perubahan GitHub ini:** Hanya menambahkan revision log. File `SOP.md` dan `clean.txt` **belum diubah**.

## Urutan acuan penulisan

Saat menyusun/revisi report Haydecor:
1. **Feedback user terbaru dan log revisi ini** untuk keputusan gaya bahasa yang sudah dikoreksi secara eksplisit.
2. **Report archive yang sudah final** (`Report-Archieve-MD/`) sebagai referensi utama *voice*, kedalaman analisis, struktur kalimat, dan kepadatan narasi.
3. **SOP reporting style** (`report-style-guide/SOP.md` dan `clean.txt`) sebagai pedoman tertulis, selama tidak bertentangan dengan feedback user yang lebih baru.
4. **Draft report dan grafik/tabel sumber** sebagai dasar materi dan angka yang harus divalidasi.

Revision log ini merupakan **tambahan pedoman**, bukan pengganti SOP atau izin untuk mengubah data. Jangan menganggap model/agent otomatis membacanya. **Selalu sertakan file ini dalam konteks ketika memberi tugas reporting** sampai ketentuannya diintegrasikan ke SOP/skill.

---

## RL-2026-11-06 — Delapan aturan revisi wajib

### 1. Bahasa Indonesia harus natural, bukan hasil terjemahan literal

- Susun ulang penalaran dan kalimat dalam gaya laporan bisnis Indonesia yang langsung, faktual, dan enak dibaca.
- Jangan sekadar menerjemahkan kalimat bahasa Inggris secara kata per kata atau memakai struktur bahasa Inggris yang terasa dipaksakan.
- Dahulukan kesimpulan, diikuti bukti, implikasi, lalu tindakan jika relevan.
- Hindari narasi generik, jargon tanpa makna, dan konstruksi yang hanya terdengar formal.

**Uji praktis:** Kalimat harus terdengar wajar saat dibacakan dalam monthly performance review.

### 2. Pertahankan istilah marketing dalam bahasa Inggris

- **Jangan menerjemahkan** istilah yang memang dipakai dalam praktik/report, misalnya: `New Customer`, `Existing Customer`, `Repeat Order`, `Revenue`, `Non-Ads Revenue`, `Ad Spending`, `ROAS`, `ACR`, `Traffic`, `CVR`, `Conversion Rate`, `Purchase`, `Add to Cart`, `AOV`, `channel`, `creative`, `landing page`, `PDP`, `SKU`, `campaign`, `Ad Group`, `Meta Reguler`, dan `Meta CPAS`.
- Bahasa penghubung tetap Bahasa Indonesia yang natural. Tidak perlu memaksakan seluruh kalimat dalam English.
- Contoh koreksi: **`New Customer` jangan diganti `pembeli baru`** dan **`Repeat Order` jangan diganti `pembelian ulang`**.
- Pertahankan istilah produk/kategori sesuai label data dan slide.

### 3. Conclusion pada Executive Summary harus berupa dua paragraf yang komprehensif

- **Dua paragraf**, mengikuti pola report final yang ada pada archive, bukan satu-dua kalimat singkat.
- **Paragraf 1** merangkum performa bisnis secara menyeluruh: pertumbuhan/penurunan Revenue, efisiensi Ad Spending/ACR, kontribusi Ads vs Non-Ads, dan pola funnel yang paling memengaruhi hasil.
- **Paragraf 2** merangkum kategori/product, perubahan Conversion Rate, dinamika channel (Shopee Ads, Meta Reguler, Meta CPAS), serta implikasi dan fokus periode berikutnya.
- Jangan hanya merangkum Revenue dan ACR. Jangan juga mengulang daftar angka dari semua grafik; pilih angka material untuk membangun argumen.

### 4. Supporting details **harus tetap ada** dan tidak boleh dipangkas berlebihan

- Headline yang kuat **bukan pengganti** supporting details.
- Pertahankan detail substantif dari draft yang diperlukan untuk menjelaskan *mengapa* performa terjadi, produk/campaign apa yang berpengaruh, dan tindakan apa yang masuk akal.
- Jika draft memiliki informasi penting tentang produk, funnel, content, atau arah perubahan performa, jangan menghilangkannya hanya demi membuat slide lebih pendek.
- Ringkas repetisi dan kalimat yang tidak perlu, **bukan** analisis penting.
- Jangan mengarang angka atau penyebab. Jika data belum cukup, tandai sebagai keterbatasan/hipotesis untuk divalidasi.

### 5. Supporting details menjawab **so-what**, bukan membacakan ulang tabel/grafik

- Jika persentase, nominal, ROAS, atau tren **sudah jelas terlihat di visual yang sama**, jangan menyalin ulang semuanya dalam supporting details.
- Gunakan ruang narasi untuk menghubungkan antar-metrik, menjelaskan bottleneck, membedakan kondisi channel/category, dan membantu audience menentukan prioritas.
- **Contoh kasus Shopee Ads Performance Details:**

  **Hindari:** “Spend naik 17.68%, Revenue naik 10.60%, Click naik 14.11%, Order naik 3.90%, CVR turun dari 3.11% ke 2.83%, dan ROAS turun dari 9.26x ke 8.71x.” (semua sudah tampil di tabel)

  **Lebih tepat:** “Tambahan Click belum menghasilkan pertumbuhan Order yang sebanding. Revenue masih terbantu kenaikan AOV, sehingga prioritas optimasi perlu beralih ke SKU dan Ad Group dengan conversion melemah, terutama Mirror Series.”

- Tetap boleh menggunakan **angka tertentu** yang penting dan tidak tersedia pada visual, atau yang diperlukan untuk menegaskan insight yang tidak terbaca langsung. Hindari larangan angka secara mutlak.

### 6. Interpretasi performa harus proporsional, sesuai tren, dan objektif

- Jangan memberi sentimen negatif hanya karena kontribusi suatu segmen lebih kecil dari segmen lain.
- Bedakan **porsi kontribusi**, **perubahan MoM**, dan **kualitas performa**. Segmen dengan share kecil tidak otomatis underperform.
- **Contoh kasus Buyer Composition:** `Existing Customer` tidak tepat dinarasikan negatif. **Jumlah Existing Customer meningkat dan Revenue-nya relatif stabil**, sementara `New Customer` juga bertumbuh.
- **Hindari:** “Pertumbuhan akuisisi belum diimbangi kontribusi Existing Customer” atau “Repeat Order masih lemah” bila tidak ditopang definisi/analisis retensi yang benar.
- **Lebih tepat:** “New Customer tetap menjadi kontributor utama Revenue, sementara jumlah Existing Customer turut meningkat dengan Revenue yang relatif stabil. Kedua segmen menunjukkan progress yang terjaga.”
- Jangan menyamakan share `Existing Customer` dengan `retention rate` tanpa metodologi yang jelas.
- Jangan menyatakan sebab-akibat bila data hanya menunjukkan korelasi atau pergerakan bersama.

### 7. Action Plan & Recommendation harus tajam, actionable, dan dibedakan menurut pemilik eksekusi

- Setiap tindakan harus menjawab **apa yang akan dilakukan**, **di mana fokusnya**, **dasar prioritasnya**, dan **target/evaluasinya** jika tersedia.
- Hindari kalimat terlalu umum seperti “Optimalkan Shopee Ads” atau “Perbaiki konversi”.
- Pisahkan:
  - **Advertiser Plan (FYI):** keputusan/tindakan yang akan dieksekusi advertiser. Tulis secara profesional tanpa `saya` pada slide.
  - **Recommendation / Co-Action:** hal yang memerlukan keputusan, aset, atau eksekusi dari tim bisnis Haydecor.
- Jangan menggabungkan dua workstream yang tidak sejenis hanya supaya jumlah bullet lebih sedikit, misalnya **recovery Mirror** dan **New Product Push Canvas–Digicam**. Bila diperlukan, buat poin terpisah.
- Contoh struktur yang lebih spesifik, **berdasarkan konteks report Oktober 2026**:
  1. **Shopee Ads — Recovery ROAS 9–10x.** Evaluasi bid/Ad Group dan prioritas spend berdasarkan Revenue, CVR, dan ROAS. Tinjau khusus Mirror Series; pertahankan SKU Custom/Cheetah yang lebih efisien.
  2. **Meta Ads — Realokasi budget.** Targetkan komposisi 25% Meta Reguler dan 75% Meta CPAS, dengan evaluasi Purchase dan ROAS sesuai masing-masing basis atribusi.
  3. **Mirror — Recovery conversion (co-action).** Evaluasi PDP, review, harga, voucher, ongkir, dan stok pada SKU dengan traffic tinggi tetapi conversion rendah.
  4. **Canvas & Digicam — New Product Push.** Definisikan success metrics Traffic, ATC, Purchase, dan ROAS serta creative/product showcase yang akan diuji sebelum memutuskan scale.
- **Jangan mengada-adakan target baru** seolah telah disetujui. Bedakan target yang sudah diberikan user dari usulan yang perlu disepakati.

### 8. Hindari tanda titik koma (`;`) sebagai gaya penulisan report

- **Tidak ada instruksi user maupun SOP** yang meminta penggunaan titik koma untuk merangkum dua aksi dalam satu bullet.
- Titik koma berulang membuat Action Plan terasa kaku dan seperti terjemahan teks bisnis Inggris.
- Gunakan **kalimat pendek dengan titik**, atau tulis ulang menjadi satu kalimat yang natural.
- Jangan meletakkan `;` di akhir poin.
- **Hindari:** “Realokasi budget menjadi 25% Reguler : 75% CPAS; prioritaskan Catalog creative berdasarkan Purchase dan ROAS.”
- **Lebih tepat:** “Realokasi budget Meta dengan komposisi 25% Meta Reguler dan 75% Meta CPAS, dengan prioritas pada Catalog creative yang menghasilkan Purchase dan ROAS terbaik.”

---

## Checklist wajib untuk setiap model/agent sebelum menyerahkan revisi

- [ ] Narasi terdengar seperti laporan bisnis Indonesia, **bukan terjemahan literal**.
- [ ] Istilah marketing dalam English tetap konsisten dan tidak berubah menjadi padanan Indonesia.
- [ ] Executive Summary — Conclusion terdiri dari **dua paragraf** yang mewakili keseluruhan report.
- [ ] Headline menyampaikan **main point**, sementara supporting details tetap mengandung bukti dan analisis yang cukup.
- [ ] Supporting details **tidak mengulang** deretan angka yang sudah terbaca jelas pada visual yang sama.
- [ ] Kesimpulan sesuai tren nyata, termasuk **Existing Customer yang stabil/naik** pada kasus Oktober 2026.
- [ ] Action Plan spesifik, memiliki fokus dan target evaluasi, serta memisahkan Advertiser Plan dari Recommendation/Co-Action.
- [ ] Workstream berbeda tidak digabung hanya demi keringkasan.
- [ ] Tidak ada titik koma yang dipakai sebagai kebiasaan formatting.
- [ ] Angka dan istilah diverifikasi terhadap data serta visual sumber; tidak ada klaim kausal tanpa dukungan.
- [ ] Layout masih terbaca setelah revisi. Jangan memangkas supporting details untuk menutupi problem layout.

## Catatan untuk integrasi SOP berikutnya

Log ini **mencatat koreksi user**, bukan menyatakan SOP utama sudah diperbaiki. Saat SOP direvisi nanti, integrasikan setiap butir di atas beserta contoh benar/salah, lalu uji kembali pada report final dari archive. Pertahankan jejak revisi ini agar agent berikutnya memahami **mengapa** aturan tersebut muncul.

**Referensi:** `report-style-guide/SOP.md`, `report-style-guide/clean.txt`, `Report-Archieve-MD/`, dan pembahasan review report Haydecor Oktober 2026.
