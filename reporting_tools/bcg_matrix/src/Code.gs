// ─────────────────────────────────────────────────────────────
//  BCG MATRIX DASHBOARD — Google Apps Script Backend
//  Sheet yang dibaca: "RUMUS"
//  Deploy sebagai: Web App → Execute as Me → Anyone can access
// ─────────────────────────────────────────────────────────────

function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('BCG')
    .setTitle('BCG Matrix Dashboard — RHA Gallery')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Dipanggil dari client-side via google.script.run
 * Membaca sheet RUMUS dan mengembalikan array produk + metadata
 */
function getSheetData() {
  try {
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var sh   = ss.getSheetByName('RUMUS');
    if (!sh) throw new Error('Sheet "RUMUS" tidak ditemukan. Pastikan nama sheet sudah benar.');

    var lastRow = sh.getLastRow();
    if (lastRow < 2) return { ok: true, rows: [], sheetTitle: ss.getName() };

    var data  = sh.getRange(1, 1, lastRow, sh.getLastColumn()).getValues();
    var hdrs  = data[0].map(function(h){ return String(h).trim(); });

    // ── Column finder (case-insensitive, ignores spaces/underscore)
    // Exact-match only — fuzzy dihapus karena rawan false positive
    // (contoh: fuzzy 'cr' bisa match 'Kuadran Conversion')
    function col(keys) {
      for (var ki = 0; ki < keys.length; ki++) {
        var kn = keys[ki].toLowerCase().replace(/[\s_]/g, '');
        for (var i = 0; i < hdrs.length; i++) {
          var hn = hdrs[i].toLowerCase().replace(/[\s_]/g, '');
          if (hn === kn) return i;
        }
      }
      return -1;
    }

    var iName   = col(['Nama Produk','NamaProduk','Product Name','name']);
    var iLink   = col(['Link','link','url','URL']);
    var iVisit  = col(['Pengunjung','Pengunjung Produk','Traffic','Visitor','traffic','visitor']);
    var iCR     = col(['CR','Conversion Rate','ConversionRate','cr']);
    var iSales  = col(['Sales','Revenue Produk','Pendapatan','sales','revenue','pendapatan']);
    var iRoas   = col(['ROAS','Roas','roas']);
    var iBiaya   = col(['Biaya','Biaya Iklan','Cost','Spend','biaya','cost','spend']);
    var iK       = col(['Kuadran Number','KuadranNumber','Quadrant Number','quadrant number']);
    var iRP      = col(['Range Price','RangePrice','range_price','Harga','harga']);
    var iCat     = col(['Category','Kategori','category','kategori']);
    var iPembeli = col(['Pembeli','pembeli','Buyer','buyer','buyers']);

    if (iK === -1) throw new Error('Kolom "Kuadran Number" tidak ditemukan. Periksa header sheet RUMUS.');

    function pn(v) {
      if (v === null || v === undefined || v === '') return 0;
      var s = String(v).replace(/[^0-9.\-]/g, '');
      return parseFloat(s) || 0;
    }
    function bench(rp) {
      var s  = String(rp || '').replace(/[,\.]/g, '');
      var ns = s.match(/\d+/g);
      if (!ns) return 3.9;
      var mx = Math.max.apply(null, ns.map(Number));
      if (mx >= 150000) return 1.2;
      if (mx >= 100000) return 1.8;
      if (mx >= 50000)  return 2.6;
      return 3.9;
    }

    var rows = [];
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var kv  = parseInt(iK >= 0 ? row[iK] : '');
      if (!kv || kv < 1 || kv > 4) continue;

      var catRaw = iCat >= 0 ? String(row[iCat]).trim() : '';
      var cat    = (catRaw && catRaw !== '#N/A') ? catRaw : 'Uncategorized';

      var nm = iName >= 0 ? String(row[iName]).slice(0, 65) : '';
      if (!nm) continue;

      // CR dihitung dari Pembeli / Pengunjung × 100
      var traffic  = pn(iVisit   >= 0 ? row[iVisit]   : 0);
      var pembeli  = pn(iPembeli >= 0 ? row[iPembeli] : 0);
      var cr       = (traffic > 0 && pembeli > 0) ? (pembeli / traffic * 100) : 0;

      rows.push({
        name    : nm,
        category: cat,
        k       : kv,
        traffic : traffic,
        cr      : Math.round(cr * 100) / 100,   // 2 desimal
        sales   : pn(iSales >= 0 ? row[iSales]  : 0),
        biaya   : pn(iBiaya >= 0 ? row[iBiaya]  : 0),
        roas    : pn(iRoas  >= 0 ? row[iRoas]   : 0),
        bench_cr: bench(iRP >= 0 ? row[iRP] : ''),
        link    : iLink >= 0 ? String(row[iLink]).trim() : ''
      });
    }

    return {
      ok        : true,
      rows      : rows,
      sheetTitle: ss.getName(),
      sheetName : sh.getName(),
      readAt    : new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    };

  } catch(err) {
    return { ok: false, error: err.message };
  }
}
