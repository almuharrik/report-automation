// DATASETS, DATASET_ORDER, pickCols berasal dari datasets.js
const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString('id-ID');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Mendukung link akun pribadi (/macros/s/…) dan Google Workspace (/a/macros/<domain>/s/…)
const URL_RE = /^https:\/\/script\.google\.com\/(a\/macros\/[^/]+|macros)\/s\/[\w-]+\/exec$/;
const STATUS_LABEL = { new: 'Baru', changed: 'Berubah', same: 'Sudah ada' };
const TZ = 7 * 3600 * 1000;
const dayStr = (ms) => new Date(ms + TZ).toISOString().slice(0, 10);

const state = {
  cfg: {}, rows: {}, warnings: {}, lastResult: null,
  check: null,        // { dataset: { key: {status, old} } } hasil cek terakhir ke sheet
  checkError: null, checking: false, sending: false,
  editingUrl: false, conn: null, // null | 'ok' | 'err'
  open: {},           // dataset yang sedang dibuka di popup
};

const totalRows = () => DATASET_ORDER.reduce((n, d) => n + state.rows[d].length, 0);

async function load() {
  state.cfg = (await chrome.storage.local.get('cfg')).cfg || {};
  const { buffer = {}, warnings = {}, lastResult = null } = await chrome.storage.session.get(['buffer', 'warnings', 'lastResult']);
  state.lastResult = lastResult;
  state.warnings = warnings;
  DATASET_ORDER.forEach((d) => {
    const dc = DATASETS[d].dateCol;
    state.rows[d] = Object.values(buffer[d] || {}).sort((a, b) =>
      a[dc] === b[dc] ? DATASETS[d].sub(a).localeCompare(DATASETS[d].sub(b)) : a[dc].localeCompare(b[dc]));
  });
}

function setStatus(msg, kind) {
  const el = $('status');
  el.textContent = msg || '';
  el.className = 'status' + (msg ? ' show ' + kind : '');
}

async function runCheck() {
  if (!state.cfg.url || !totalRows()) { state.check = null; render(); return; }
  state.checking = true; state.checkError = null; render();
  const res = await chrome.runtime.sendMessage({ type: 'CHECK' });
  state.checking = false;
  if (res && res.ok) {
    state.check = {};
    Object.entries(res.results || {}).forEach(([d, list]) => {
      state.check[d] = {};
      list.forEach((x) => (state.check[d][x.key] = x));
    });
    state.conn = 'ok';
  } else {
    state.check = null;
    state.checkError = (res && res.error) || 'Gagal memeriksa sheet.';
    state.conn = 'err';
  }
  render();
}

function statusOf(d, r) {
  if (state.checking) return { cls: '', label: 'Mengecek…' };
  const x = state.check && state.check[d] && state.check[d][DATASETS[d].key(r)];
  if (!x) return { cls: '', label: 'Belum dicek' };
  return { cls: x.status, label: STATUS_LABEL[x.status], old: x.old };
}

function renderConnection() {
  const hasUrl = !!state.cfg.url;
  $('settings').classList.toggle('hidden', hasUrl && !state.editingUrl);
  $('gearBtn').classList.toggle('hidden', !hasUrl);
  $('testBtn').disabled = !hasUrl;
  if (document.activeElement !== $('url')) $('url').value = state.cfg.url || '';

  const chip = $('connChip');
  if (!hasUrl) { chip.className = 'pill'; chip.textContent = 'Belum disambungkan'; }
  else if (state.conn === 'ok') { chip.className = 'pill ok'; chip.textContent = 'Tersambung'; }
  else if (state.conn === 'err') { chip.className = 'pill err'; chip.textContent = 'Gagal tersambung'; }
  else { chip.className = 'pill'; chip.textContent = 'Link tersimpan'; }
}

// Satu blok <details> per dataset: ringkasan di baris judul, tabel di dalamnya.
function renderDataset(d, counts) {
  const cfg = DATASETS[d];
  const rows = state.rows[d];
  const warn = state.warnings[d];
  if (!rows.length && !warn) return '';

  const local = { new: 0, changed: 0, same: 0 };
  const cutoff = cfg.provisionalDays ? dayStr(Date.now() - cfg.provisionalDays * 86400000) : null;
  const body = rows.map((r) => {
    const s = statusOf(d, r);
    if (local[s.cls] !== undefined) { local[s.cls]++; counts[s.cls]++; }
    const cells = cfg.show.map(([c]) => {
      const was = s.cls === 'changed' && s.old && Number(s.old[c]) !== Number(r[c])
        ? `<s title="Nilai di sheet saat ini">${fmt(s.old[c])}</s>` : '';
      return `<td>${fmt(r[c])}${was}</td>`;
    }).join('');
    const prov = cutoff && r[cfg.dateCol] >= cutoff
      ? '<span class="tag" title="Data atribusi beberapa hari terakhir biasanya masih bertambah. Ambil ulang nanti; baris akan diperbarui.">sementara</span>' : '';
    const sub = cfg.sub(r);
    return `<tr class="${s.cls}" title="${esc(s.label)}">
      <td><b>${esc(r[cfg.dateCol])}</b>${prov}${sub ? `<span class="type">${esc(sub)}</span>` : ''}</td>${cells}</tr>`;
  }).join('');

  const dates = rows.map((r) => r[cfg.dateCol]);
  const short = (x) => `${x.slice(8, 10)}/${x.slice(5, 7)}`; // yyyy-mm-dd → dd/mm
  const range = !rows.length ? '' : dates[0] === dates[dates.length - 1] ? short(dates[0]) : `${short(dates[0])}–${short(dates[dates.length - 1])}`;
  const foot = cfg.show.map(([c, , sum]) => sum
    ? `<td>${fmt(rows.reduce((t, r) => t + Number(r[c] || 0), 0))}</td>`
    : '<td title="Pengunjung unik per hari tidak bisa dijumlahkan antarhari">–</td>').join('');
  const mini = state.check && rows.length
    ? ['new', 'changed', 'same'].filter((k) => local[k]).map((k) => `<span class="chip ${k}">${local[k]} ${k === 'new' ? 'baru' : k === 'changed' ? 'berubah' : 'sama'}</span>`).join('')
    : '';

  return `<details class="ds" data-ds="${d}"${state.open[d] ? ' open' : ''}>
    <summary><span class="name">${esc(cfg.label)}</span>
      <span class="meta">${rows.length ? `${rows.length} baris, ${esc(range)}` : 'tidak ada data'}</span>
      <span class="mini">${mini}</span></summary>
    ${warn ? `<p class="warn">${esc(warn.msg)}</p>` : ''}
    ${rows.length ? `<div class="body"><div class="table-wrap"><table>
      <thead><tr><th>Tanggal</th>${cfg.show.map(([, label]) => `<th>${esc(label)}</th>`).join('')}</tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td>Total</td>${foot}</tr></tfoot>
    </table></div></div>` : ''}
  </details>`;
}

function renderData() {
  const n = totalRows();
  const anyWarn = DATASET_ORDER.some((d) => state.warnings[d]);
  const has = n > 0 || anyWarn;
  $('empty').classList.toggle('hidden', has);
  $('bar').classList.toggle('hidden', !n);
  $('actions').classList.toggle('hidden', !has);
  $('recheckBtn').disabled = !n || !state.cfg.url || state.checking;
  $('clearBtn').disabled = !has;

  const counts = { new: 0, changed: 0, same: 0 };
  // Satu dataset saja → langsung dibuka.
  const present = DATASET_ORDER.filter((d) => state.rows[d].length || state.warnings[d]);
  if (present.length === 1 && state.open[present[0]] === undefined) state.open[present[0]] = true;
  $('datasets').innerHTML = DATASET_ORDER.map((d) => renderDataset(d, counts)).join('');
  $('datasets').querySelectorAll('details.ds').forEach((el) =>
    el.addEventListener('toggle', () => (state.open[el.dataset.ds] = el.open)));

  const c = (k) => (state.check ? counts[k] : '–');
  $('nNew').textContent = `${c('new')} baru`;
  $('nChanged').textContent = `${c('changed')} berubah`;
  $('nSame').textContent = `${c('same')} sama`;

  $('checkNote').textContent = state.checkError
    ? `Tidak bisa mengecek sheet: ${state.checkError}`
    : (counts.changed ? 'Angka dicoret = nilai di sheet saat ini, akan ditimpa.' : '');
}

function renderSend() {
  const btn = $('sendBtn');
  const n = totalRows();
  const actionable = state.check
    ? DATASET_ORDER.reduce((t, d) => t + state.rows[d].filter((r) => {
      const x = state.check[d] && state.check[d][DATASETS[d].key(r)];
      return !x || x.status !== 'same';
    }).length, 0)
    : n;
  btn.disabled = !state.cfg.url || !n || state.sending || state.checking || (state.check && actionable === 0);

  if (state.sending) btn.textContent = 'Mengirim…';
  else if (!state.cfg.url) btn.textContent = 'Isi link Apps Script dulu';
  else if (!n) btn.textContent = 'Belum ada data untuk dikirim';
  else if (state.checking) btn.textContent = 'Menunggu hasil cek…';
  else if (state.check && actionable === 0) btn.textContent = 'Semua data sudah ada di sheet';
  else if (state.check) btn.textContent = `Kirim ${actionable} baris ke sheet`;
  else btn.textContent = `Kirim ${n} baris (belum dicek)`;
}

function render() { renderConnection(); renderData(); renderSend(); }

function resultMessage(res) {
  if (!res.ok) return [res.error || 'Ditolak Apps Script.', 'err'];
  const parts = DATASET_ORDER.filter((d) => res.summary && res.summary[d]).map((d) => {
    const s = res.summary[d], bits = [];
    if (s.inserted) bits.push(`${s.inserted} baru`);
    if (s.updated) bits.push(`${s.updated} diperbarui`);
    if (s.skipped) bits.push(`${s.skipped} sudah ada`);
    return `${DATASETS[d].label}: ${bits.join(', ') || 'tidak ada perubahan'}`;
  });
  return [`Terkirim. ${parts.join('; ') || 'Tidak ada perubahan'}.`, 'ok'];
}

// --- Aksi ---
$('saveBtn').onclick = async () => {
  const url = $('url').value.trim();
  if (!URL_RE.test(url)) {
    setStatus('Link tidak dikenali. Gunakan link Web app dari Apps Script yang berakhiran /exec, bukan link editor.', 'err');
    return;
  }
  await chrome.storage.local.set({ cfg: { url } });
  state.cfg = { url }; state.editingUrl = false; state.conn = null;
  setStatus('Link disimpan. Mengetes koneksi…', 'info');
  render();
  await testConnection();
  runCheck();
};
$('gearBtn').onclick = () => { state.editingUrl = !state.editingUrl; render(); if (state.editingUrl) $('url').focus(); };
$('testBtn').onclick = () => testConnection();

async function testConnection() {
  const res = await chrome.runtime.sendMessage({ type: 'PING' });
  state.conn = res && res.ok ? 'ok' : 'err';
  setStatus(res && res.ok ? 'Koneksi ke Apps Script berhasil.' : (res && res.error) || 'Koneksi gagal.', res && res.ok ? 'ok' : 'err');
  render();
}

$('recheckBtn').onclick = () => runCheck();
$('clearBtn').onclick = async () => {
  await chrome.runtime.sendMessage({ type: 'CLEAR' });
  await load(); state.check = null; setStatus('', 'info'); render();
};
$('sendBtn').onclick = async () => {
  state.sending = true; render();
  setStatus('Mengirim ke sheet…', 'info');
  const res = await chrome.runtime.sendMessage({ type: 'SEND' });
  state.sending = false;
  const [msg, kind] = resultMessage(res || { ok: false });
  setStatus(msg, kind);
  if (res && res.ok) state.conn = 'ok';
  await load(); state.check = null; render();
};

// Kalau data baru tertangkap saat popup terbuka, perbarui dan cek ulang.
let debounce;
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'session' || state.sending) return;
  if (changes.warnings && !changes.buffer) { load().then(render); return; }
  if (!changes.buffer) return;
  clearTimeout(debounce);
  debounce = setTimeout(async () => { await load(); runCheck(); }, 400);
});

(async () => {
  await load();
  if (!totalRows() && state.lastResult) {
    const [msg, kind] = resultMessage(state.lastResult);
    setStatus('Pengiriman terakhir. ' + msg, kind);
  }
  render();
  runCheck();
})();
