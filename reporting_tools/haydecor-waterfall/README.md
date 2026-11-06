# Haydecor – Incremental Revenue by Category

Dashboard waterfall chart perubahan GMV per New Category. Semua proses berjalan di browser; tidak ada data yang dikirim ke server.

## Cara pakai
1. Buka `index.html` di browser (atau lewat GitHub Pages).
2. Upload database histori (Consolidated Table bulan lalu atau Looker Treemap, .csv).
3. Upload RAW Performa Produk dari Shopee (`parentskudetail_...csv`).
4. (Opsional) Upload Product Category List jika ada update kategori.
5. Pilih bulan data RAW dan pasangan bulan yang dibandingkan.

## Aturan perhitungan
- GMV = `Penjualan (Pesanan Siap Dikirim) (IDR)`, hanya baris dengan Kode Variasi `-` (SKU induk).
- Kategori Additional / Accesories dan produk tanpa kategori dikeluarkan dari waterfall.

## Hosting di GitHub Pages
Settings → Pages → Deploy from a branch → pilih branch dan folder `/ (root)`.
