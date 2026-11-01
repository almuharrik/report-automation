// Jembatan: terima data dari injected.js lalu teruskan ke background service worker.
window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data || e.data.source !== 'shopee-ads-sync') return;
  const { dataset, rows, warning } = e.data;
  try {
    if (rows) chrome.runtime.sendMessage({ type: 'CAPTURE', dataset, rows });
    if (warning) chrome.runtime.sendMessage({ type: 'WARN', dataset, warning });
  } catch (err) {} // ekstensi baru di-reload: tab perlu di-refresh
});
