/* app.js : inti aplikasi (helper, login, kerangka, dashboard, kasir/POS) */
(function (root) {
  'use strict';
  var S = root.Store, C = root.Charts;

  /* ---------- helper ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function h(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var NF = new Intl.NumberFormat('id-ID');
  function rp(n) { n = Math.round(n || 0); return (n < 0 ? '-' : '') + 'Rp ' + NF.format(Math.abs(n)); }
  function num(n) { return NF.format(Math.round((n || 0) * 100) / 100); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function parseMoney(v) { return Number(String(v == null ? '' : v).replace(/\D/g, '')) || 0; }
  function fmtMoneyInput(n) { return n ? NF.format(n) : ''; }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  function fmtDay(k) { var p = k.split('-').map(Number); return p[2] + ' ' + MONTHS[p[1] - 1] + ' ' + p[0]; }
  function fmtShortDay(k) { var p = k.split('-').map(Number); return p[2] + ' ' + MONTHS[p[1] - 1]; }
  function fmtTime(ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fmtDateTime(ts) { return fmtDay(S.dateKey(ts)) + ', ' + fmtTime(ts); }
  function todayKey() { return S.dateKey(new Date()); }
  function addDays(k, n) { var d = S.parseKey(k); return S.dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
  function initials(name) { return String(name || '?').split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }

  var ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.8"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1.2"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    leaf: '<path d="M5 20c0-9 6-15 16-15 0 10-5 16-13 16"/><path d="M5 20c2-5 5-8 9-10"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    coins: '<circle cx="9" cy="9" r="6"/><path d="M18.1 10.4a6 6 0 1 1-7.7 7.7"/>',
    pkg: '<path d="M16.5 9.4 7.5 4.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>'
  };
  function icon(name, size) {
    size = size || 20;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function brandMark(size) { return '<div class="brand-mark m-brand-inner">' + icon('leaf', size || 22) + '</div>'; }

  /* ---------- toast, modal, konfirmasi ---------- */
  function toast(msg, type) {
    var t = document.createElement('div');
    t.className = 'toast' + (type === 'err' ? ' err' : '');
    t.textContent = msg;
    $('#toast-root').appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, type === 'err' ? 3600 : 2400);
  }

  function openModal(o) {
    var rootEl = $('#modal-root');
    var back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-label="' + h(o.title) + '">' +
      '<div class="modal-head"><h3>' + h(o.title) + '</h3><button class="icon-btn" data-close aria-label="Tutup">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + o.body + '</div>' +
      (o.footer ? '<div class="modal-foot">' + o.footer + '</div>' : '') + '</div>';
    rootEl.appendChild(back);
    document.body.classList.add('modal-open');
    var api = {
      el: back,
      close: function () {
        if (!back.parentNode) return;
        back.remove();
        document.removeEventListener('keydown', onKey);
        if (!rootEl.children.length) document.body.classList.remove('modal-open');
        if (o.onClose) o.onClose();
      }
    };
    function onKey(e) { if (e.key === 'Escape' && rootEl.lastElementChild === back) api.close(); }
    document.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', function (e) { if (e.target === back) api.close(); });
    $$('[data-close]', back).forEach(function (b) { b.addEventListener('click', api.close); });
    if (o.onMount) o.onMount(back, api);
    var first = $('input:not([type=hidden]):not([type=checkbox]), select', back.querySelector('.modal-body'));
    if (first && window.innerWidth > 899) first.focus();
    return api;
  }
  function confirmDialog(o, onOk) {
    var m = openModal({
      title: o.title, size: 'sm',
      body: '<p>' + o.message + '</p>',
      footer: '<button class="btn" data-close>Batal</button><button class="btn ' + (o.danger === false ? 'btn-primary' : 'btn-danger') + '" id="cf-ok">' + h(o.okLabel || 'Ya, lanjutkan') + '</button>',
      onMount: function (el) { $('#cf-ok', el).addEventListener('click', function () { m.close(); onOk(); }); }
    });
  }

  // input uang dengan pemisah ribuan
  function bindMoney(input, onChange) {
    input.addEventListener('input', function () {
      var v = parseMoney(input.value);
      input.value = fmtMoneyInput(v);
      if (onChange) onChange(v);
    });
  }

  function downloadFile(name, text, mime) {
    var blob = new Blob([text], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function downloadCSV(name, rows) {
    var csv = '﻿' + rows.map(function (r) {
      return r.map(function (c) {
        c = String(c == null ? '' : c);
        return /[";,\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(';');
    }).join('\r\n');
    downloadFile(name, csv, 'text/csv;charset=utf-8');
  }

  /* ---------- state & navigasi ---------- */
  var user = null, route = 'dashboard';
  var NAV = [
    { id: 'dashboard', label: 'Dashboard', short: 'Beranda', icon: 'grid', roles: ['admin', 'kasir'] },
    { id: 'pos', label: 'Kasir', short: 'Kasir', icon: 'cart', roles: ['admin', 'kasir'] },
    { id: 'riwayat', label: 'Riwayat Transaksi', short: 'Riwayat', icon: 'receipt', roles: ['admin', 'kasir'] },
    { id: 'produk', label: 'Produk & Resep', short: 'Produk', icon: 'tag', roles: ['admin'] },
    { id: 'inventori', label: 'Inventori', short: 'Inventori', icon: 'box', roles: ['admin', 'kasir'] },
    { id: 'laporan', label: 'Laporan Penjualan', short: 'Penjualan', icon: 'chart', roles: ['admin'] },
    { id: 'keuangan', label: 'Laporan Keuangan', short: 'Keuangan', icon: 'wallet', roles: ['admin'] }
  ];
  function allowed() { return NAV.filter(function (n) { return n.roles.indexOf(user.role) >= 0; }); }
  function isAdmin() { return user && user.role === 'admin'; }
  var App = { views: {}, h: h, $: $, $$: $$, rp: rp, num: num, icon: icon, toast: toast, openModal: openModal, confirmDialog: confirmDialog,
    bindMoney: bindMoney, parseMoney: parseMoney, fmtMoneyInput: fmtMoneyInput, fmtDay: fmtDay, fmtShortDay: fmtShortDay, fmtTime: fmtTime,
    fmtDateTime: fmtDateTime, todayKey: todayKey, addDays: addDays, downloadCSV: downloadCSV, downloadFile: downloadFile, MONTHS: MONTHS,
    user: function () { return user; }, isAdmin: isAdmin, go: go, refresh: renderRoute, showLogin: showLogin, initials: initials };
  root.App = App;

  function go(id) {
    if (location.hash === '#/' + id) renderRoute(); else location.hash = '#/' + id;
  }

  /* ---------- login ---------- */
  function showLogin() {
    user = null;
    $('#app').classList.add('hidden');
    var el = $('#login-screen');
    el.classList.remove('hidden');
    var role = 'admin';
    el.innerHTML =
      '<section class="login-art"><div class="brand" style="padding:0;position:relative;z-index:1"><div class="brand-mark">' + icon('leaf', 22) + '</div><div><strong style="font-size:16px">Kedai Rasa Kita</strong></div></div>' +
      '<div style="position:relative;z-index:1"><h2>Penjualan dan persediaan, satu sistem yang rapi.</h2><p>Kelola kasir, menu, stok bahan, hingga laporan keuangan dalam satu tempat. Stok bahan berkurang otomatis setiap ada penjualan.</p>' +
      '<ul class="login-points"><li>' + icon('check', 16) + 'Kasir (POS) cepat dengan struk</li><li>' + icon('check', 16) + 'Stok berkurang otomatis sesuai resep</li><li>' + icon('check', 16) + 'Laporan penjualan &amp; keuangan real-time</li></ul></div>' +
      '<small style="opacity:.7;position:relative;z-index:1">Sistem Informasi Manajemen Penjualan dan Persediaan Terintegrasi</small></section>' +
      '<section class="login-form-wrap"><form class="login-box" id="login-form" autocomplete="on" novalidate>' +
      '<div class="login-mbrand"><div class="brand-mark">' + icon('leaf', 22) + '</div><strong style="font-size:17px">Kedai Rasa Kita</strong></div>' +
      '<div><h1>Masuk</h1><p class="muted" style="margin-top:4px">Silakan masuk untuk melanjutkan.</p></div>' +
      '<div class="field"><span class="label">Masuk sebagai</span><div class="seg full" id="role-seg"><button type="button" class="active" data-role="admin">Admin</button><button type="button" data-role="kasir">Kasir</button></div></div>' +
      '<label class="field"><span>Username</span><input class="input" id="lg-user" name="username" autocomplete="username" autocapitalize="none" placeholder="admin" required></label>' +
      '<label class="field"><span>Password</span><div class="pw-wrap"><input class="input" id="lg-pass" name="password" type="password" autocomplete="current-password" placeholder="Password" required><button type="button" id="pw-toggle">Tampilkan</button></div></label>' +
      '<div class="error-text" id="lg-err" role="alert"></div>' +
      '<button class="btn btn-primary btn-lg btn-block" type="submit">Masuk</button>' +
      '<div class="demo-box" id="demo-box"></div></form></section>';

    function demo() {
      $('#demo-box').innerHTML = role === 'admin' ? 'Akun demo Admin: <b>admin</b> / <b>admin123</b>' : 'Akun demo Kasir: <b>kasir</b> / <b>kasir123</b>';
      $('#lg-user').placeholder = role;
    }
    demo();
    $$('#role-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        role = b.dataset.role;
        $$('#role-seg button').forEach(function (x) { x.classList.toggle('active', x === b); });
        $('#lg-err').textContent = ''; demo();
      });
    });
    $('#pw-toggle').addEventListener('click', function () {
      var i = $('#lg-pass'), show = i.type === 'password';
      i.type = show ? 'text' : 'password'; this.textContent = show ? 'Sembunyikan' : 'Tampilkan';
    });
    $('#login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = $('#lg-user').value, p = $('#lg-pass').value;
      if (!u.trim() || !p) { $('#lg-err').textContent = 'Username dan password wajib diisi.'; return; }
      var r = S.login(u, p, role);
      if (!r.ok) { $('#lg-err').textContent = r.error; return; }
      user = r.user;
      location.hash = '#/dashboard';
      showApp();
    });
  }

  function logout() {
    S.logout(); user = null;
    posState.cart = {}; posState.discount = 0; posState.paid = 0; posState.method = 'Tunai';
    $$('.modal-backdrop').forEach(function (m) { m.remove(); });
    document.body.classList.remove('modal-open');
    history.replaceState(null, '', location.pathname);
    showLogin();
  }

  /* ---------- kerangka aplikasi ---------- */
  function showApp() {
    $('#login-screen').classList.add('hidden');
    $('#login-screen').innerHTML = '';
    $('#app').classList.remove('hidden');
    renderShell();
    renderRoute();
  }

  function renderShell() {
    var items = allowed();
    var groups = [['Operasional', ['dashboard', 'pos', 'riwayat']], ['Manajemen', ['produk', 'inventori']], ['Laporan', ['laporan', 'keuangan']]];
    var roleLabel = isAdmin() ? 'Admin' : 'Kasir';
    $('#sidebar').innerHTML =
      '<div class="brand">' + brandMark(22) + '<div><strong>Kedai Rasa Kita</strong><small>SIM Penjualan &amp; Persediaan</small></div></div>' +
      '<nav class="side-nav" aria-label="Menu utama">' + groups.map(function (g) {
        var its = items.filter(function (i) { return g[1].indexOf(i.id) >= 0; });
        if (!its.length) return '';
        return '<div class="nav-group"><span class="nav-label">' + g[0] + '</span>' + its.map(function (i) {
          return '<a href="#/' + i.id + '" class="nav-item" data-nav="' + i.id + '">' + icon(i.icon, 20) + '<span>' + i.label + '</span></a>';
        }).join('') + '</div>';
      }).join('') + '</nav>' +
      '<div class="side-foot"><div class="user-card"><div class="avatar">' + h(initials(user.name)) + '</div><div><strong>' + h(user.name) + '</strong><small>' + roleLabel + '</small></div></div>' +
      '<div class="side-actions"><button class="btn btn-sm" id="btn-settings">' + icon('settings', 16) + 'Pengaturan</button><button class="btn btn-sm" id="btn-logout">' + icon('logout', 16) + 'Keluar</button></div></div>';

    $('#topbar').innerHTML =
      '<div class="topbar-left">' + brandMark(18).replace('brand-mark m-brand-inner', 'brand-mark m-brand') + '<div><h1 id="page-title"></h1><p class="topbar-sub" id="page-sub"></p></div></div>' +
      '<div class="topbar-right"><div class="role-chip"><div class="avatar">' + h(initials(user.name)) + '</div><span>' + h(user.name) + ' · ' + roleLabel + '</span></div></div>';

    var okIds = items.map(function (i) { return i.id; });
    var primaryIds = ['dashboard', 'pos', 'produk', 'inventori', 'riwayat'].filter(function (id) { return okIds.indexOf(id) >= 0; }).slice(0, 4);
    $('#bottomnav').innerHTML = primaryIds.map(function (id) {
      var n = NAV.filter(function (x) { return x.id === id; })[0];
      return '<a class="bn-item" href="#/' + n.id + '" data-nav="' + n.id + '">' + icon(n.icon, 22) + '<span>' + n.short + '</span></a>';
    }).join('') + '<button class="bn-item" id="bn-more" aria-haspopup="dialog">' + icon('more', 22) + '<span>Lainnya</span></button>';
    $('#bottomnav').dataset.primary = primaryIds.join(',');

    $('#btn-logout').addEventListener('click', logout);
    $('#btn-settings').addEventListener('click', function () { App.openSettings(); });
    $('#bn-more').addEventListener('click', openMoreSheet);
  }

  function openMoreSheet() {
    var primary = ($('#bottomnav').dataset.primary || '').split(',');
    var rest = allowed().filter(function (i) { return primary.indexOf(i.id) < 0; });
    var m = openModal({
      title: 'Menu lainnya',
      body: '<div class="sheet-user"><div class="avatar">' + h(initials(user.name)) + '</div><div><strong>' + h(user.name) + '</strong><div class="muted" style="font-size:13px">' + (isAdmin() ? 'Admin' : 'Kasir') + '</div></div></div>' +
        '<div class="sheet-list">' + rest.map(function (i) {
          return '<button class="sheet-item' + (route === i.id ? ' active' : '') + '" data-go="' + i.id + '">' + icon(i.icon, 22) + h(i.label) + '</button>';
        }).join('') +
        '<button class="sheet-item" id="sh-settings">' + icon('settings', 22) + 'Pengaturan</button>' +
        '<button class="sheet-item danger" id="sh-logout">' + icon('logout', 22) + 'Keluar</button></div>',
      onMount: function (el) {
        $$('[data-go]', el).forEach(function (b) { b.addEventListener('click', function () { m.close(); go(b.dataset.go); }); });
        $('#sh-settings', el).addEventListener('click', function () { m.close(); App.openSettings(); });
        $('#sh-logout', el).addEventListener('click', function () { m.close(); logout(); });
      }
    });
  }

  function renderRoute() {
    if (!user) return;
    var id = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0];
    var item = allowed().filter(function (n) { return n.id === id; })[0];
    if (!item) { id = 'dashboard'; item = allowed()[0]; if (location.hash !== '#/dashboard') history.replaceState(null, '', '#/dashboard'); }
    route = id;
    var primary = ($('#bottomnav').dataset.primary || '').split(',');
    $$('[data-nav]').forEach(function (a) { a.classList.toggle('active', a.dataset.nav === id); });
    $('#bn-more').classList.toggle('active', primary.indexOf(id) < 0);
    $('#page-title').textContent = item.label;
    var d = new Date();
    $('#page-sub').textContent = DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    var view = $('#view');
    view.className = 'view' + (id === 'pos' ? ' view-pos' : '');
    view.innerHTML = '';
    (App.views[id] || function () {})();
    window.scrollTo(0, 0);
  }

  /* ---------- dashboard ---------- */
  var dashRange = 7;
  function lowStock() {
    return S.get().ingredients.filter(function (g) { return g.stock <= g.min; })
      .sort(function (a, b) { return (a.stock / (a.min || 1)) - (b.stock / (b.min || 1)); });
  }
  function statCard(label, value, foot, ic, accent) {
    return '<div class="card stat' + (accent ? ' accent' : '') + '"><div class="label"><span>' + label + '</span><span class="stat-ic">' + icon(ic, 18) + '</span></div><div class="value">' + value + '</div><div class="foot">' + foot + '</div></div>';
  }
  function statusBadge(g) {
    var st = S.stockStatus(g);
    return st === 'habis' ? '<span class="badge badge-danger">Habis</span>' : (st === 'menipis' ? '<span class="badge badge-warn">Menipis</span>' : '<span class="badge badge-ok">Aman</span>');
  }
  function txStatusBadge(t) { return t.status === 'batal' ? '<span class="badge badge-danger">Batal</span>' : '<span class="badge badge-ok">Selesai</span>'; }

  App.views.dashboard = function () {
    var today = todayKey(), yest = addDays(today, -1);
    var sT = S.summarize(S.txRange(today, today)), sY = S.summarize(S.txRange(yest, yest));
    var delta = sY.net ? ((sT.net - sY.net) / sY.net) * 100 : null;
    var deltaHtml = delta === null ? 'Belum ada data kemarin' : '<span class="delta ' + (delta >= 0 ? 'up' : 'down') + '">' + (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta).toFixed(0) + '%</span> vs kemarin';
    var low = lowStock(), empty = low.filter(function (g) { return g.stock <= 0; }).length;
    var third = isAdmin() ? statCard('Laba Kotor', rp(sT.profit), 'Margin ' + (sT.net ? Math.round(sT.profit / sT.net * 100) : 0) + '%', 'trend')
      : statCard('Rata-rata Transaksi', rp(sT.avg), 'Per transaksi hari ini', 'trend');
    var recent = S.get().transactions.slice(0, 7);
    var week = S.byProduct(S.txRange(addDays(today, -6), today)).slice(0, 5);
    var maxQty = week.length ? week[0].qty : 1;
    var wk = S.byProduct(S.txRange(addDays(today, -6), today)).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);
    maxQty = wk.length ? wk[0].qty : 1;

    $('#view').innerHTML =
      '<div class="stack">' +
      '<div class="stats">' +
      statCard('Penjualan Hari Ini', rp(sT.net), deltaHtml, 'coins', true) +
      statCard('Transaksi', num(sT.count), num(sT.items) + ' item terjual', 'receipt') +
      third +
      statCard('Stok Menipis', num(low.length), empty ? empty + ' bahan habis' : 'Perlu restock segera', 'alert') +
      '</div>' +
      '<div class="grid-2">' +
      '<section class="card"><div class="card-head"><div><h3>Grafik Penjualan</h3><div class="sub" id="dash-sub"></div></div>' +
      '<div class="seg" id="dash-seg"><button data-r="7">7 Hari</button><button data-r="14">14 Hari</button><button data-r="30">30 Hari</button></div></div>' +
      '<div class="chart" id="dash-chart"></div></section>' +
      '<section class="card"><div class="card-head"><h3>Menu Terlaris</h3><span class="sub">7 hari terakhir</span></div>' +
      (wk.length ? '<div class="rank">' + wk.map(function (p) {
        return '<div class="rank-row"><strong>' + h(p.name) + '</strong><span class="muted">' + num(p.qty) + ' terjual</span><div class="bar"><i style="width:' + Math.max(4, p.qty / maxQty * 100) + '%"></i></div></div>';
      }).join('') + '</div>' : '<div class="empty">Belum ada penjualan.</div>') + '</section>' +
      '</div>' +
      '<div class="grid-recent">' +
      '<section class="card flush"><div class="card-head"><h3>Transaksi Terbaru</h3><button class="btn btn-ghost btn-sm" data-go="riwayat">Lihat semua</button></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>No. Transaksi</th><th>Waktu</th><th>Metode</th><th class="num">Total</th><th>Status</th></tr></thead><tbody>' +
      (recent.length ? recent.map(function (t) {
        return '<tr class="clickable" data-tx="' + h(t.id) + '"><td class="cell-main nowrap">' + h(t.no) + '</td><td class="nowrap">' + fmtDateTime(t.ts) + '</td><td>' + h(t.method) + '</td><td class="num nowrap">' + rp(t.total) + '</td><td>' + txStatusBadge(t) + '</td></tr>';
      }).join('') : '<tr><td colspan="5" class="empty">Belum ada transaksi.</td></tr>') +
      '</tbody></table></div></section>' +
      '<section class="card"><div class="card-head"><h3>Peringatan Stok</h3>' + (isAdmin() ? '<button class="btn btn-ghost btn-sm" data-go="inventori">Kelola</button>' : '') + '</div>' +
      (low.length ? '<div class="list">' + low.slice(0, 6).map(function (g) {
        return '<div class="list-row"><div><div class="cell-main">' + h(g.name) + '</div><div class="cell-sub">Sisa ' + num(g.stock) + ' ' + h(g.unit) + ' · min ' + num(g.min) + '</div></div>' + statusBadge(g) + '</div>';
      }).join('') + '</div>' : '<div class="empty">Semua stok bahan dalam kondisi aman.</div>') + '</section>' +
      '</div></div>';

    function drawChart() {
      var days = S.dayRange(addDays(today, -(dashRange - 1)), today);
      var byDay = {};
      S.txRange(days[0], today).forEach(function (t) { byDay[t.day] = (byDay[t.day] || 0) + t.total; });
      var vals = days.map(function (d) { return byDay[d] || 0; });
      var total = vals.reduce(function (a, b) { return a + b; }, 0);
      $('#dash-sub').textContent = 'Total ' + rp(total) + ' dalam ' + dashRange + ' hari';
      $$('#dash-seg button').forEach(function (b) { b.classList.toggle('active', Number(b.dataset.r) === dashRange); });
      C.render($('#dash-chart'), {
        type: dashRange > 14 ? 'line' : 'bar', labels: days.map(fmtShortDay), title: 'Grafik penjualan harian',
        series: [{ name: 'Penjualan', color: '#7C9070', values: vals }]
      });
    }
    drawChart();
    $$('#dash-seg button').forEach(function (b) { b.addEventListener('click', function () { dashRange = Number(b.dataset.r); drawChart(); }); });
    $$('[data-go]', $('#view')).forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.go); }); });
    $$('[data-tx]', $('#view')).forEach(function (r) { r.addEventListener('click', function () { App.showTx(r.dataset.tx); }); });
  };

  /* ---------- struk / detail transaksi ---------- */
  function receiptHTML(t) {
    return '<div class="receipt"><div class="rc-head"><strong>Kedai Rasa Kita</strong><span class="muted">Struk Pembayaran</span></div>' +
      '<div class="rc-meta"><span>No.</span><b>' + h(t.no) + '</b><span>Waktu</span><b>' + fmtDateTime(t.ts) + '</b><span>Kasir</span><b>' + h(t.cashier) + '</b><span>Status</span><b>' + (t.status === 'batal' ? 'DIBATALKAN' : 'Selesai') + '</b></div>' +
      '<div class="rc-items">' + t.items.map(function (i) {
        return '<div class="rc-line"><span>' + h(i.name) + '<br><small class="muted">' + i.qty + ' × ' + rp(i.price) + '</small></span><span>' + rp(i.price * i.qty) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="rc-line"><span>Subtotal</span><span>' + rp(t.subtotal) + '</span></div>' +
      (t.discount ? '<div class="rc-line"><span>Diskon</span><span>-' + rp(t.discount) + '</span></div>' : '') +
      '<div class="rc-line rc-total"><span>Total</span><span>' + rp(t.total) + '</span></div>' +
      '<div class="rc-line"><span>Bayar (' + h(t.method) + ')</span><span>' + rp(t.paid) + '</span></div>' +
      '<div class="rc-line"><span>Kembali</span><span>' + rp(t.change) + '</span></div>' +
      '<div class="rc-foot">Terima kasih, selamat menikmati!</div></div>';
  }
  function printReceipt() {
    document.body.classList.add('print-receipt');
    var done = function () { document.body.classList.remove('print-receipt'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  }
  App.showTx = function (id, opts) {
    opts = opts || {};
    var t = S.get().transactions.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var canVoid = isAdmin() && t.status === 'selesai' && !opts.justPaid;
    var m = openModal({
      title: opts.justPaid ? 'Pembayaran Berhasil' : 'Detail Transaksi', size: 'sm', body: receiptHTML(t),
      footer: (canVoid ? '<button class="btn btn-soft-danger" id="tx-void">Batalkan Transaksi</button>' : '') +
        '<button class="btn" id="tx-print">' + icon('print', 16) + 'Cetak</button><button class="btn btn-primary" data-close>' + (opts.justPaid ? 'Transaksi Baru' : 'Tutup') + '</button>',
      onMount: function (el) {
        $('#tx-print', el).addEventListener('click', printReceipt);
        var v = $('#tx-void', el);
        if (v) v.addEventListener('click', function () {
          confirmDialog({ title: 'Batalkan transaksi?', message: 'Transaksi <b>' + h(t.no) + '</b> akan dibatalkan' + (t.stockDeducted ? ' dan stok bahan dikembalikan.' : '.'), okLabel: 'Ya, batalkan' }, function () {
            var r = S.voidTx(t.id, user.name);
            if (!r.ok) { toast(r.error, 'err'); return; }
            m.close(); toast('Transaksi dibatalkan.'); renderRoute();
          });
        });
      }
    });
  };

  /* ---------- kasir (POS) ---------- */
  var posState = { cart: {}, q: '', cat: 'Semua', discount: 0, method: 'Tunai', paid: 0, open: false };

  function cartLines() {
    return Object.keys(posState.cart).map(function (pid) { return { p: S.product(pid), qty: posState.cart[pid] }; })
      .filter(function (l) { return l.p && l.p.active; });
  }
  function cartItems() { return cartLines().map(function (l) { return { pid: l.p.id, qty: l.qty }; }); }
  function cartTotals() {
    var sub = cartLines().reduce(function (s, l) { return s + l.p.price * l.qty; }, 0);
    var disc = Math.min(posState.discount, sub);
    return { sub: sub, disc: disc, total: sub - disc, count: cartLines().reduce(function (s, l) { return s + l.qty; }, 0) };
  }

  App.views.pos = function () {
    posState.open = false;
    var prods = S.get().products.filter(function (p) { return p.active; });
    var cats = ['Semua'].concat(prods.map(function (p) { return p.category; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    if (cats.indexOf(posState.cat) < 0) posState.cat = 'Semua';
    $('#view').innerHTML =
      '<div class="pos"><section><div class="pos-tools"><div class="search">' + icon('search', 18) + '<input class="input" id="pos-q" type="search" placeholder="Cari menu…" value="' + h(posState.q) + '" autocomplete="off"></div><div class="chips" id="pos-cats"></div></div>' +
      '<div class="product-grid" id="pos-grid"></div></section>' +
      '<aside class="card pos-cart" id="pos-cart" aria-label="Pesanan"><div class="cart-head"><h3>Pesanan</h3><div style="display:flex;gap:4px;align-items:center"><button class="btn btn-ghost btn-sm" id="cart-clear">Kosongkan</button><button class="icon-btn sheet-close" id="cart-close" aria-label="Tutup pesanan">' + icon('x') + '</button></div></div>' +
      '<div class="cart-items" id="cart-items"></div>' +
      '<div class="cart-foot"><div class="totals" id="cart-totals"></div>' +
      '<label class="field-row"><span>Diskon (Rp)</span><input class="input" id="pos-discount" inputmode="numeric" placeholder="0" autocomplete="off" value="' + fmtMoneyInput(posState.discount) + '"></label>' +
      '<div class="seg full" id="pos-method"><button data-m="Tunai">Tunai</button><button data-m="QRIS">QRIS</button><button data-m="Transfer">Transfer</button></div>' +
      '<div id="cash-box" style="display:flex;flex-direction:column;gap:10px"><label class="field-row"><span>Uang diterima</span><input class="input" id="pos-paid" inputmode="numeric" placeholder="0" autocomplete="off" value="' + fmtMoneyInput(posState.paid) + '"></label><div class="quick" id="quick-cash"></div><div class="change-row" id="change-row"></div></div>' +
      '<button class="btn btn-primary btn-lg btn-block" id="pos-pay">Bayar</button></div></aside></div>' +
      '<div class="cart-backdrop" id="cart-backdrop"></div><button class="cart-bar hidden" id="cart-bar"></button>';

    $('#pos-q').addEventListener('input', function (e) { posState.q = e.target.value; renderGrid(); });
    bindMoney($('#pos-discount'), function (v) { posState.discount = v; renderCartSummary(); });
    bindMoney($('#pos-paid'), function (v) { posState.paid = v; renderCartSummary(); });
    $('#pos-method').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      posState.method = b.dataset.m; renderCartSummary();
    });
    $('#cart-clear').addEventListener('click', function () { posState.cart = {}; posState.paid = 0; $('#pos-paid').value = ''; renderAll(); });
    $('#pos-pay').addEventListener('click', pay);
    $('#cart-bar').addEventListener('click', function () { setSheet(true); });
    $('#cart-close').addEventListener('click', function () { setSheet(false); });
    $('#cart-backdrop').addEventListener('click', function () { setSheet(false); });
    $('#pos-cats').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      posState.cat = b.dataset.c; renderCats(cats); renderGrid();
    });
    $('#pos-grid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]'); if (!b || b.disabled) return;
      addToCart(b.dataset.add);
    });
    $('#cart-items').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var pid = b.dataset.pid, act = b.dataset.act;
      if (act === 'plus') addToCart(pid);
      else { posState.cart[pid] = (posState.cart[pid] || 0) - 1; if (posState.cart[pid] <= 0) delete posState.cart[pid]; renderAll(); }
    });
    renderCats(cats); renderAll();
  };

  function setSheet(open) {
    posState.open = open;
    var c = $('#pos-cart'), b = $('#cart-backdrop');
    if (c) c.classList.toggle('open', open);
    if (b) b.classList.toggle('show', open);
  }
  function renderAll() { renderGrid(); renderCart(); }
  function renderCats(cats) {
    $('#pos-cats').innerHTML = cats.map(function (c) { return '<button class="chip' + (c === posState.cat ? ' active' : '') + '" data-c="' + h(c) + '">' + h(c) + '</button>'; }).join('');
  }
  function renderGrid() {
    if (!$('#pos-grid')) return;
    var q = posState.q.trim().toLowerCase();
    var list = S.get().products.filter(function (p) {
      return p.active && (posState.cat === 'Semua' || p.category === posState.cat) && (!q || p.name.toLowerCase().indexOf(q) >= 0);
    });
    $('#pos-grid').innerHTML = list.length ? list.map(function (p) {
      var av = S.available(p), inCart = posState.cart[p.id] || 0, out = av <= 0;
      var stock = av === Infinity ? '' : (out ? '<span class="pstock out">Stok habis</span>' : '<span class="pstock' + (av <= 5 ? ' low' : '') + '">Sisa ' + av + ' porsi</span>');
      return '<button class="pcard" data-add="' + h(p.id) + '"' + (out ? ' disabled' : '') + '>' + (inCart ? '<span class="qty-dot">' + inCart + '</span>' : '') +
        '<span class="pname">' + h(p.name) + '</span>' + stock + '<span class="pprice">' + rp(p.price) + '</span></button>';
    }).join('') : '<div class="empty" style="grid-column:1/-1">Menu tidak ditemukan.</div>';
  }
  function addToCart(pid) {
    var p = S.product(pid); if (!p) return;
    var items = cartItems().filter(function (i) { return i.pid !== pid; });
    items.push({ pid: pid, qty: (posState.cart[pid] || 0) + 1 });
    var lack = S.shortages(items);
    if (lack.length) { toast('Stok ' + lack.join(', ') + ' tidak cukup untuk menambah pesanan.', 'err'); return; }
    posState.cart[pid] = (posState.cart[pid] || 0) + 1;
    renderAll();
  }
  function renderCart() {
    var lines = cartLines();
    $('#cart-items').innerHTML = lines.length ? lines.map(function (l) {
      return '<div class="cart-line"><div><div class="nm">' + h(l.p.name) + '</div><div class="pr">' + rp(l.p.price) + '</div></div><div class="sub">' + rp(l.p.price * l.qty) + '</div>' +
        '<div class="qty"><button data-act="minus" data-pid="' + h(l.p.id) + '" aria-label="Kurangi">' + icon('minus', 16) + '</button><span>' + l.qty + '</span><button data-act="plus" data-pid="' + h(l.p.id) + '" aria-label="Tambah">' + icon('plus', 16) + '</button></div></div>';
    }).join('') : '<div class="empty">Belum ada pesanan.<br>Pilih menu untuk menambahkan.</div>';
    renderCartSummary();
  }
  function renderCartSummary() {
    var t = cartTotals();
    $('#cart-totals').innerHTML = '<div><span>Subtotal</span><span>' + rp(t.sub) + '</span></div>' + (t.disc ? '<div><span>Diskon</span><span>-' + rp(t.disc) + '</span></div>' : '') +
      '<div class="grand"><span>Total</span><span>' + rp(t.total) + '</span></div>';
    $$('#pos-method button').forEach(function (b) { b.classList.toggle('active', b.dataset.m === posState.method); });
    var cash = posState.method === 'Tunai';
    $('#cash-box').style.display = cash ? 'flex' : 'none';
    if (cash) {
      var opts = [t.total];
      [5000, 10000, 20000, 50000, 100000].forEach(function (s) { opts.push(Math.ceil(t.total / s) * s); });
      opts = opts.filter(function (v, i, a) { return v > 0 && a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }).slice(0, 4);
      $('#quick-cash').innerHTML = opts.map(function (v, i) { return '<button type="button" data-v="' + v + '">' + (i === 0 && v === t.total ? 'Uang pas' : rp(v)) + '</button>'; }).join('');
      $$('#quick-cash button').forEach(function (b) {
        b.addEventListener('click', function () { posState.paid = Number(b.dataset.v); $('#pos-paid').value = fmtMoneyInput(posState.paid); renderCartSummary(); });
      });
      var ch = posState.paid - t.total;
      $('#change-row').className = 'change-row' + (posState.paid && ch < 0 ? ' bad' : '');
      $('#change-row').innerHTML = '<span>' + (posState.paid && ch < 0 ? 'Kurang' : 'Kembalian') + '</span><span>' + rp(posState.paid ? Math.abs(ch) : 0) + '</span>';
    }
    $('#pos-pay').disabled = t.count === 0;
    $('#pos-pay').textContent = t.count ? 'Bayar ' + rp(t.total) : 'Bayar';
    var bar = $('#cart-bar');
    bar.classList.toggle('hidden', t.count === 0);
    bar.innerHTML = '<span>' + icon('cart', 20).replace('class="ic"', 'class="ic" style="display:inline-block;vertical-align:-4px;margin-right:8px"') + t.count + ' item</span><span>' + rp(t.total) + ' · Lihat</span>';
    if (t.count === 0 && posState.open) setSheet(false);
  }
  function pay() {
    var t = cartTotals();
    var r = S.checkout({ items: cartItems(), discount: posState.discount, method: posState.method, paid: posState.paid, user: user.name });
    if (!r.ok) { toast(r.error, 'err'); return; }
    posState.cart = {}; posState.discount = 0; posState.paid = 0;
    $('#pos-discount').value = ''; $('#pos-paid').value = '';
    setSheet(false);
    renderAll();
    toast('Transaksi ' + r.tx.no + ' berhasil. Total ' + rp(t.total));
    App.showTx(r.tx.id, { justPaid: true });
  }

  /* ---------- mulai ---------- */
  App.start = function () {
    S.load();
    window.addEventListener('hashchange', function () { if (user) renderRoute(); });
    var u = S.currentUser();
    if (u) { user = u; showApp(); } else showLogin();
  };
})(window);
