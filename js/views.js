/* views.js : produk, inventori, riwayat, laporan penjualan, laporan keuangan, pengaturan */
(function (root) {
  'use strict';
  var S = root.Store, C = root.Charts, A = root.App;
  var h = A.h, $ = A.$, $$ = A.$$, rp = A.rp, num = A.num, icon = A.icon, toast = A.toast,
    openModal = A.openModal, confirmDialog = A.confirmDialog, bindMoney = A.bindMoney, parseMoney = A.parseMoney,
    fmtMoneyInput = A.fmtMoneyInput, fmtDay = A.fmtDay, fmtShortDay = A.fmtShortDay, fmtDateTime = A.fmtDateTime,
    todayKey = A.todayKey, addDays = A.addDays;

  function badge(cls, text) { return '<span class="badge badge-' + cls + '">' + text + '</span>'; }
  function stockBadge(g) {
    var st = S.stockStatus(g);
    return st === 'habis' ? badge('danger', 'Habis') : (st === 'menipis' ? badge('warn', 'Menipis') : badge('ok', 'Aman'));
  }
  function statCard(label, value, foot, ic, accent) {
    return '<div class="card stat' + (accent ? ' accent' : '') + '"><div class="label"><span>' + label + '</span><span class="stat-ic">' + icon(ic, 18) + '</span></div><div class="value">' + value + '</div><div class="foot">' + foot + '</div></div>';
  }
  function guardAdmin() {
    if (A.isAdmin()) return true;
    $('#view').innerHTML = '<div class="card empty">Halaman ini hanya untuk Admin.</div>';
    return false;
  }

  /* =====================================================
     PRODUK & RESEP
     ===================================================== */
  var prodUI = { q: '', cat: 'Semua' };

  A.views.produk = function () {
    if (!guardAdmin()) return;
    var cats = ['Semua'].concat(S.get().products.map(function (p) { return p.category; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    $('#view').innerHTML =
      '<div class="page-head"><div><h2>Produk &amp; Resep</h2><p>Atur menu, harga jual, dan resep untuk pengurangan stok otomatis.</p></div><button class="btn btn-primary" id="pr-add">' + icon('plus', 18) + 'Tambah Produk</button></div>' +
      '<div class="toolbar"><div class="search grow">' + icon('search', 18) + '<input class="input" id="pr-q" type="search" placeholder="Cari produk…" value="' + h(prodUI.q) + '"></div>' +
      '<select class="select" id="pr-cat">' + cats.map(function (c) { return '<option' + (c === prodUI.cat ? ' selected' : '') + '>' + h(c) + '</option>'; }).join('') + '</select></div>' +
      '<section class="card flush"><div class="table-wrap"><table class="table"><thead><tr><th>Produk</th><th>Kategori</th><th class="num">Harga</th><th class="num">HPP</th><th class="num">Margin</th><th>Resep</th><th>Status</th><th></th></tr></thead><tbody id="pr-body"></tbody></table></div></section>';
    $('#pr-add').addEventListener('click', function () { productForm(null); });
    $('#pr-q').addEventListener('input', function (e) { prodUI.q = e.target.value; renderProdRows(); });
    $('#pr-cat').addEventListener('change', function (e) { prodUI.cat = e.target.value; renderProdRows(); });
    $('#pr-body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var p = S.product(b.dataset.id); if (!p) return;
      if (b.dataset.act === 'edit') productForm(p);
      else confirmDialog({ title: 'Hapus produk?', message: 'Produk <b>' + h(p.name) + '</b> akan dihapus dari daftar menu. Riwayat transaksi lama tidak berubah.', okLabel: 'Hapus' }, function () {
        S.deleteProduct(p.id); toast('Produk dihapus.'); renderProdRows();
      });
    });
    renderProdRows();
  };

  function renderProdRows() {
    var q = prodUI.q.trim().toLowerCase();
    var list = S.get().products.filter(function (p) {
      return (prodUI.cat === 'Semua' || p.category === prodUI.cat) && (!q || p.name.toLowerCase().indexOf(q) >= 0);
    });
    $('#pr-body').innerHTML = list.length ? list.map(function (p) {
      var cost = S.productCost(p), margin = p.price ? Math.round((p.price - cost) / p.price * 100) : 0;
      return '<tr><td class="cell-main">' + h(p.name) + '</td><td>' + h(p.category) + '</td><td class="num nowrap">' + rp(p.price) + '</td><td class="num nowrap">' + rp(cost) + '</td>' +
        '<td class="num">' + margin + '%</td><td>' + (p.recipe.length ? p.recipe.length + ' bahan' : '<span class="muted">Tanpa resep</span>') + '</td>' +
        '<td>' + (p.active ? badge('ok', 'Aktif') : badge('muted', 'Nonaktif')) + '</td>' +
        '<td class="actions"><button class="icon-btn" data-act="edit" data-id="' + h(p.id) + '" aria-label="Ubah ' + h(p.name) + '">' + icon('edit', 18) + '</button>' +
        '<button class="icon-btn danger" data-act="del" data-id="' + h(p.id) + '" aria-label="Hapus ' + h(p.name) + '">' + icon('trash', 18) + '</button></td></tr>';
    }).join('') : '<tr><td colspan="8" class="empty">Produk tidak ditemukan.</td></tr>';
  }

  function productForm(p) {
    var ings = S.get().ingredients;
    var cats = S.get().products.map(function (x) { return x.category; }).filter(function (c, i, a) { return a.indexOf(c) === i; });
    var rows = p ? p.recipe.map(function (r) { return { iid: r.iid, qty: r.qty }; }) : [];
    var m = openModal({
      title: p ? 'Ubah Produk' : 'Tambah Produk', size: 'lg',
      body: '<form class="form" id="pf" novalidate>' +
        '<div class="form-grid"><label class="field span2"><span>Nama produk</span><input class="input" name="name" maxlength="60" required value="' + h(p ? p.name : '') + '"></label>' +
        '<label class="field"><span>Kategori</span><input class="input" name="category" list="cat-list" maxlength="30" required value="' + h(p ? p.category : '') + '"><datalist id="cat-list">' + cats.map(function (c) { return '<option value="' + h(c) + '">'; }).join('') + '</datalist></label>' +
        '<label class="field"><span>Harga jual (Rp)</span><input class="input" name="price" inputmode="numeric" required value="' + fmtMoneyInput(p ? p.price : 0) + '"></label></div>' +
        '<div class="field"><span>Resep per porsi</span><div id="recipe-rows"></div><div><button type="button" class="btn btn-sm" id="add-ing">' + icon('plus', 16) + 'Tambah bahan</button></div>' +
        '<p class="hint">Stok bahan berkurang otomatis setiap produk ini terjual.</p></div>' +
        '<label class="field" id="mc-field"><span>HPP manual (Rp) — dipakai bila tanpa resep</span><input class="input" name="manualCost" inputmode="numeric" value="' + fmtMoneyInput(p ? p.manualCost : 0) + '"></label>' +
        '<label class="switch"><input type="checkbox" name="active"' + (!p || p.active ? ' checked' : '') + '><span>Produk aktif (tampil di kasir)</span></label>' +
        '<div class="hpp-box" id="hpp-box"></div><div class="error-text" id="pf-err" role="alert"></div></form>',
      footer: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" type="submit" form="pf">Simpan</button>',
      onMount: function (el) {
        var f = $('#pf', el);
        bindMoney(f.price, calc); bindMoney(f.manualCost, calc);
        function drawRows() {
          $('#recipe-rows', el).innerHTML = rows.length ? rows.map(function (r, i) {
            var g = S.ingredient(r.iid);
            return '<div class="recipe-row"><select class="select" data-i="' + i + '" data-f="iid">' +
              '<option value="">Pilih bahan…</option>' + ings.map(function (x) { return '<option value="' + h(x.id) + '"' + (x.id === r.iid ? ' selected' : '') + '>' + h(x.name) + '</option>'; }).join('') + '</select>' +
              '<div class="qty-wrap"><input class="input" type="number" min="0" step="any" inputmode="decimal" data-i="' + i + '" data-f="qty" value="' + (r.qty || '') + '" placeholder="Jumlah"><span class="unit">' + (g ? h(g.unit) : '') + '</span></div>' +
              '<button type="button" class="icon-btn danger" data-rm="' + i + '" aria-label="Hapus bahan">' + icon('trash', 18) + '</button></div>';
          }).join('') : '<p class="hint" style="margin-bottom:8px">Belum ada bahan. Tambahkan bahan agar stok berkurang otomatis.</p>';
          $('#mc-field', el).style.display = rows.length ? 'none' : 'flex';
          calc();
        }
        function calc() {
          var cost = rows.length ? rows.reduce(function (s, r) { var g = S.ingredient(r.iid); return s + (g ? g.cost * (Number(r.qty) || 0) : 0); }, 0) : parseMoney(f.manualCost.value);
          var price = parseMoney(f.price.value), margin = price ? Math.round((price - cost) / price * 100) : 0;
          $('#hpp-box', el).innerHTML = '<span>HPP per porsi: <strong>' + rp(cost) + '</strong></span><span>Laba kotor: <strong>' + rp(price - cost) + '</strong></span><span>Margin: <strong>' + margin + '%</strong></span>';
        }
        $('#recipe-rows', el).addEventListener('change', function (e) {
          var t = e.target, i = t.dataset.i; if (i === undefined) return;
          if (t.dataset.f === 'iid') { rows[i].iid = t.value; drawRows(); }
        });
        $('#recipe-rows', el).addEventListener('input', function (e) {
          var t = e.target; if (t.dataset.f === 'qty') { rows[t.dataset.i].qty = t.value; calc(); }
        });
        $('#recipe-rows', el).addEventListener('click', function (e) {
          var b = e.target.closest('[data-rm]'); if (!b) return;
          rows.splice(Number(b.dataset.rm), 1); drawRows();
        });
        $('#add-ing', el).addEventListener('click', function () {
          if (!ings.length) { toast('Tambahkan bahan di menu Inventori terlebih dahulu.', 'err'); return; }
          rows.push({ iid: '', qty: '' }); drawRows();
        });
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var r = S.saveProduct({
            id: p ? p.id : null, name: f.name.value, category: f.category.value, price: parseMoney(f.price.value),
            manualCost: parseMoney(f.manualCost.value), active: f.active.checked,
            recipe: rows.filter(function (x) { return x.iid; }).map(function (x) { return { iid: x.iid, qty: Number(x.qty) }; })
          });
          if (!r.ok) { $('#pf-err', el).textContent = r.error; return; }
          m.close(); toast('Produk disimpan.'); A.refresh();
        });
        drawRows();
      }
    });
  }

  /* =====================================================
     INVENTORI
     ===================================================== */
  var invUI = { q: '', f: 'Semua' };
  var MOVE_LABEL = { masuk: ['ok', 'Masuk'], penjualan: ['muted', 'Penjualan'], penyesuaian: ['warn', 'Penyesuaian'], pembatalan: ['ok', 'Pembatalan'] };

  A.views.inventori = function () {
    var admin = A.isAdmin(), list = S.get().ingredients;
    var low = list.filter(function (g) { return g.stock > 0 && g.stock <= g.min; }).length;
    var out = list.filter(function (g) { return g.stock <= 0; }).length;
    var value = list.reduce(function (s, g) { return s + g.stock * g.cost; }, 0);
    $('#view').innerHTML =
      '<div class="page-head"><div><h2>Inventori Bahan</h2><p>Pantau stok bahan baku yang berkurang otomatis dari penjualan.</p></div>' + (admin ? '<button class="btn btn-primary" id="iv-add">' + icon('plus', 18) + 'Tambah Bahan</button>' : '') + '</div>' +
      '<div class="stats" style="margin-bottom:16px">' + statCard('Jenis Bahan', num(list.length), 'Terdaftar', 'pkg') + statCard('Stok Menipis', num(low), 'Di bawah batas minimum', 'alert') +
      statCard('Stok Habis', num(out), 'Perlu restock', 'box') + statCard('Nilai Persediaan', rp(value), 'Berdasarkan harga beli', 'coins') + '</div>' +
      '<div class="toolbar"><div class="search grow">' + icon('search', 18) + '<input class="input" id="iv-q" type="search" placeholder="Cari bahan…" value="' + h(invUI.q) + '"></div>' +
      '<select class="select" id="iv-f">' + ['Semua', 'Menipis', 'Habis'].map(function (c) { return '<option' + (c === invUI.f ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
      '<section class="card flush"><div class="table-wrap"><table class="table"><thead><tr><th>Bahan</th><th>Stok</th><th class="num">Min.</th><th class="num">Harga/satuan</th><th class="num">Nilai</th><th>Status</th>' + (admin ? '<th></th>' : '') + '</tr></thead><tbody id="iv-body"></tbody></table></div></section>' +
      '<section class="card flush mt"><div class="card-head"><h3>Pergerakan Stok Terakhir</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Waktu</th><th>Bahan</th><th>Jenis</th><th class="num">Jumlah</th><th>Keterangan</th></tr></thead><tbody id="mv-body"></tbody></table></div></section>';
    if (admin) $('#iv-add').addEventListener('click', function () { ingredientForm(null); });
    $('#iv-q').addEventListener('input', function (e) { invUI.q = e.target.value; renderInvRows(); });
    $('#iv-f').addEventListener('change', function (e) { invUI.f = e.target.value; renderInvRows(); });
    $('#iv-body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var g = S.ingredient(b.dataset.id); if (!g) return;
      var a = b.dataset.act;
      if (a === 'restock') restockForm(g);
      else if (a === 'adjust') adjustForm(g);
      else if (a === 'edit') ingredientForm(g);
      else confirmDialog({ title: 'Hapus bahan?', message: 'Bahan <b>' + h(g.name) + '</b> akan dihapus.', okLabel: 'Hapus' }, function () {
        var r = S.deleteIngredient(g.id);
        if (!r.ok) { toast(r.error, 'err'); return; }
        toast('Bahan dihapus.'); A.refresh();
      });
    });
    renderInvRows();
    var mv = S.get().movements.slice(0, 15);
    $('#mv-body').innerHTML = mv.length ? mv.map(function (m) {
      var g = S.ingredient(m.iid), lb = MOVE_LABEL[m.type] || ['muted', m.type];
      return '<tr><td class="nowrap">' + fmtDateTime(m.ts) + '</td><td class="cell-main">' + h(g ? g.name : '(dihapus)') + '</td><td>' + badge(lb[0], lb[1]) + '</td><td class="num nowrap">' + (m.qty > 0 ? '+' : '') + num(m.qty) + ' ' + h(g ? g.unit : '') + '</td><td>' + h(m.note || '') + '</td></tr>';
    }).join('') : '<tr><td colspan="5" class="empty">Belum ada pergerakan stok. Pergerakan akan tercatat saat ada penjualan atau restock.</td></tr>';
  };

  function renderInvRows() {
    var admin = A.isAdmin(), q = invUI.q.trim().toLowerCase();
    var list = S.get().ingredients.filter(function (g) {
      var st = S.stockStatus(g);
      var okF = invUI.f === 'Semua' || (invUI.f === 'Habis' ? st === 'habis' : st !== 'aman');
      return okF && (!q || g.name.toLowerCase().indexOf(q) >= 0);
    });
    $('#iv-body').innerHTML = list.length ? list.map(function (g) {
      var st = S.stockStatus(g), pct = Math.min(100, g.min ? g.stock / (g.min * 3) * 100 : 100);
      return '<tr><td class="cell-main">' + h(g.name) + '</td><td style="min-width:170px"><div class="cell-main nowrap">' + num(g.stock) + ' ' + h(g.unit) + '</div><div class="bar ' + (st === 'habis' ? 'danger' : st === 'menipis' ? 'warn' : '') + '" style="margin-top:6px"><i style="width:' + Math.max(st === 'habis' ? 0 : 3, pct) + '%"></i></div></td>' +
        '<td class="num nowrap">' + num(g.min) + ' ' + h(g.unit) + '</td><td class="num nowrap">' + rp(g.cost) + '</td><td class="num nowrap">' + rp(g.stock * g.cost) + '</td><td>' + stockBadge(g) + '</td>' +
        (admin ? '<td class="actions"><button class="btn btn-sm" data-act="restock" data-id="' + h(g.id) + '">' + icon('plus', 14) + 'Restock</button> ' +
          '<button class="btn btn-sm" data-act="adjust" data-id="' + h(g.id) + '">Sesuaikan</button> ' +
          '<button class="icon-btn" data-act="edit" data-id="' + h(g.id) + '" aria-label="Ubah ' + h(g.name) + '">' + icon('edit', 18) + '</button>' +
          '<button class="icon-btn danger" data-act="del" data-id="' + h(g.id) + '" aria-label="Hapus ' + h(g.name) + '">' + icon('trash', 18) + '</button></td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="7" class="empty">Bahan tidak ditemukan.</td></tr>';
  }

  function ingredientForm(g) {
    var m = openModal({
      title: g ? 'Ubah Bahan' : 'Tambah Bahan',
      body: '<form class="form" id="gf" novalidate><div class="form-grid"><label class="field span2"><span>Nama bahan</span><input class="input" name="name" maxlength="50" required value="' + h(g ? g.name : '') + '"></label>' +
        '<label class="field"><span>Satuan</span><input class="input" name="unit" list="unit-list" maxlength="12" required placeholder="gram, ml, pcs" value="' + h(g ? g.unit : '') + '"><datalist id="unit-list"><option value="gram"><option value="kg"><option value="ml"><option value="liter"><option value="pcs"><option value="butir"><option value="bungkus"></datalist></label>' +
        (g ? '' : '<label class="field"><span>Stok awal</span><input class="input" name="stock" type="number" min="0" step="any" inputmode="decimal" value="0"></label>') +
        '<label class="field"><span>Batas minimum stok</span><input class="input" name="min" type="number" min="0" step="any" inputmode="decimal" value="' + (g ? g.min : 0) + '"></label>' +
        '<label class="field"><span>Harga beli per satuan (Rp)</span><input class="input" name="cost" type="number" min="0" step="any" inputmode="decimal" value="' + (g ? g.cost : 0) + '"></label></div>' +
        '<div class="error-text" id="gf-err" role="alert"></div></form>',
      footer: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" type="submit" form="gf">Simpan</button>',
      onMount: function (el) {
        var f = $('#gf', el);
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var r = S.saveIngredient({ id: g ? g.id : null, name: f.name.value, unit: f.unit.value, stock: f.stock ? f.stock.value : 0, min: f.min.value, cost: f.cost.value, user: A.user().name });
          if (!r.ok) { $('#gf-err', el).textContent = r.error; return; }
          m.close(); toast('Bahan disimpan.'); A.refresh();
        });
      }
    });
  }
  function restockForm(g) {
    var m = openModal({
      title: 'Restock ' + g.name, size: 'sm',
      body: '<form class="form" id="rf" novalidate><p class="muted">Stok saat ini: <b>' + num(g.stock) + ' ' + h(g.unit) + '</b></p>' +
        '<label class="field"><span>Jumlah masuk (' + h(g.unit) + ')</span><input class="input" name="qty" type="number" min="0" step="any" inputmode="decimal" required></label>' +
        '<label class="field"><span>Harga beli per ' + h(g.unit) + ' (Rp, opsional)</span><input class="input" name="price" type="number" min="0" step="any" inputmode="decimal" placeholder="' + g.cost + '"></label>' +
        '<label class="field"><span>Catatan</span><input class="input" name="note" maxlength="80" placeholder="Contoh: Belanja pasar"></label>' +
        '<p class="hint">Bila harga beli diisi, harga rata-rata bahan diperbarui otomatis.</p><div class="error-text" id="rf-err" role="alert"></div></form>',
      footer: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" type="submit" form="rf">Tambah Stok</button>',
      onMount: function (el) {
        var f = $('#rf', el);
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var r = S.addStock(g.id, f.qty.value, f.price.value, f.note.value, A.user().name);
          if (!r.ok) { $('#rf-err', el).textContent = r.error; return; }
          m.close(); toast('Stok ' + g.name + ' bertambah.'); A.refresh();
        });
      }
    });
  }
  function adjustForm(g) {
    var m = openModal({
      title: 'Sesuaikan Stok ' + g.name, size: 'sm',
      body: '<form class="form" id="af" novalidate><p class="muted">Stok sistem: <b>' + num(g.stock) + ' ' + h(g.unit) + '</b></p>' +
        '<label class="field"><span>Stok aktual hasil hitung (' + h(g.unit) + ')</span><input class="input" name="actual" type="number" min="0" step="any" inputmode="decimal" required value="' + g.stock + '"></label>' +
        '<label class="field"><span>Alasan</span><input class="input" name="note" maxlength="80" placeholder="Contoh: Stok opname"></label><div class="error-text" id="af-err" role="alert"></div></form>',
      footer: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" type="submit" form="af">Simpan</button>',
      onMount: function (el) {
        var f = $('#af', el);
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var r = S.adjustStock(g.id, f.actual.value, f.note.value, A.user().name);
          if (!r.ok) { $('#af-err', el).textContent = r.error; return; }
          m.close(); toast('Stok disesuaikan.'); A.refresh();
        });
      }
    });
  }

  /* =====================================================
     RIWAYAT TRANSAKSI
     ===================================================== */
  var hist = { from: null, to: null, q: '', method: 'Semua', status: 'Semua', limit: 25 };

  A.views.riwayat = function () {
    if (!hist.from) { hist.to = todayKey(); hist.from = addDays(hist.to, -6); }
    $('#view').innerHTML =
      '<div class="page-head"><div><h2>Riwayat Transaksi</h2><p>Semua transaksi penjualan beserta rincian dan statusnya.</p></div></div>' +
      '<div class="toolbar"><label class="field"><span>Dari</span><input class="input" type="date" id="h-from" value="' + hist.from + '"></label>' +
      '<label class="field"><span>Sampai</span><input class="input" type="date" id="h-to" value="' + hist.to + '"></label>' +
      '<div class="search grow">' + icon('search', 18) + '<input class="input" id="h-q" type="search" placeholder="Cari no. transaksi / kasir…" value="' + h(hist.q) + '"></div>' +
      '<select class="select" id="h-m">' + ['Semua', 'Tunai', 'QRIS', 'Transfer'].map(function (c) { return '<option value="' + c + '"' + (c === hist.method ? ' selected' : '') + '>' + (c === 'Semua' ? 'Semua metode' : c) + '</option>'; }).join('') + '</select>' +
      '<select class="select" id="h-s">' + [['Semua', 'Semua status'], ['selesai', 'Selesai'], ['batal', 'Dibatalkan']].map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === hist.status ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></div>' +
      '<div id="h-sum" class="muted" style="margin:-4px 0 12px"></div>' +
      '<section class="card flush"><div class="table-wrap"><table class="table"><thead><tr><th>No. Transaksi</th><th>Waktu</th><th>Kasir</th><th class="num">Item</th><th>Metode</th><th class="num">Total</th><th>Status</th></tr></thead><tbody id="h-body"></tbody></table></div><div id="h-more" style="padding:12px;text-align:center"></div></section>';
    function sync() {
      var f = $('#h-from').value, t = $('#h-to').value;
      if (f && t) { if (f > t) { var x = f; f = t; t = x; } hist.from = f; hist.to = t; }
      hist.q = $('#h-q').value; hist.method = $('#h-m').value; hist.status = $('#h-s').value; hist.limit = 25;
      renderHist();
    }
    ['h-from', 'h-to', 'h-m', 'h-s'].forEach(function (id) { $('#' + id).addEventListener('change', sync); });
    $('#h-q').addEventListener('input', sync);
    $('#h-body').addEventListener('click', function (e) {
      var r = e.target.closest('[data-tx]'); if (r) A.showTx(r.dataset.tx);
    });
    $('#h-more').addEventListener('click', function (e) { if (e.target.closest('button')) { hist.limit += 25; renderHist(); } });
    renderHist();
  };

  function renderHist() {
    var q = hist.q.trim().toLowerCase();
    var list = S.txRange(hist.from, hist.to, true).filter(function (t) {
      return (hist.method === 'Semua' || t.method === hist.method) && (hist.status === 'Semua' || t.status === hist.status) &&
        (!q || t.no.toLowerCase().indexOf(q) >= 0 || t.cashier.toLowerCase().indexOf(q) >= 0);
    });
    var done = list.filter(function (t) { return t.status === 'selesai'; });
    $('#h-sum').innerHTML = num(list.length) + ' transaksi · Total penjualan selesai <b>' + rp(done.reduce(function (s, t) { return s + t.total; }, 0)) + '</b>';
    $('#h-body').innerHTML = list.length ? list.slice(0, hist.limit).map(function (t) {
      return '<tr class="clickable" data-tx="' + h(t.id) + '"><td class="cell-main nowrap">' + h(t.no) + '</td><td class="nowrap">' + fmtDateTime(t.ts) + '</td><td>' + h(t.cashier) + '</td>' +
        '<td class="num">' + t.items.reduce(function (s, i) { return s + i.qty; }, 0) + '</td><td>' + h(t.method) + '</td><td class="num nowrap">' + rp(t.total) + '</td>' +
        '<td>' + (t.status === 'batal' ? badge('danger', 'Batal') : badge('ok', 'Selesai')) + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="empty">Tidak ada transaksi pada filter ini.</td></tr>';
    $('#h-more').innerHTML = list.length > hist.limit ? '<button class="btn">Tampilkan lebih banyak (' + (list.length - hist.limit) + ')</button>' : '';
  }

  /* =====================================================
     PERIODE (dipakai laporan)
     ===================================================== */
  function presetRange(p) {
    var t = todayKey();
    if (p === 'today') return { from: t, to: t };
    if (p === '7') return { from: addDays(t, -6), to: t };
    if (p === '30') return { from: addDays(t, -29), to: t };
    return { from: t.slice(0, 8) + '01', to: t };
  }
  function periodBar(st, extra) {
    var presets = [['today', 'Hari ini'], ['7', '7 Hari'], ['30', '30 Hari'], ['month', 'Bulan ini']];
    return '<div class="toolbar no-print"><div class="seg" id="pd-seg">' + presets.map(function (p) { return '<button data-p="' + p[0] + '"' + (st.preset === p[0] ? ' class="active"' : '') + '>' + p[1] + '</button>'; }).join('') + '</div>' +
      '<label class="field"><span>Dari</span><input class="input" type="date" id="pd-from" value="' + st.from + '"></label>' +
      '<label class="field"><span>Sampai</span><input class="input" type="date" id="pd-to" value="' + st.to + '"></label>' + (extra || '') + '</div>';
  }
  function bindPeriod(st, rerender) {
    $$('#pd-seg button').forEach(function (b) {
      b.addEventListener('click', function () { var r = presetRange(b.dataset.p); st.preset = b.dataset.p; st.from = r.from; st.to = r.to; rerender(); });
    });
    function onDate() {
      var f = $('#pd-from').value, t = $('#pd-to').value;
      if (!f || !t) return;
      if (f > t) { var x = f; f = t; t = x; }
      if (S.dayRange(f, t).length >= 800) { toast('Rentang maksimal sekitar 2 tahun.', 'err'); return; }
      st.preset = 'custom'; st.from = f; st.to = t; rerender();
    }
    $('#pd-from').addEventListener('change', onDate); $('#pd-to').addEventListener('change', onDate);
  }
  function grouping(from, to) {
    var days = S.dayRange(from, to);
    if (days.length <= 45) return { keys: days, labels: days.map(fmtShortDay), keyOf: function (d) { return d; } };
    var keys = [], seen = {};
    days.forEach(function (d) { var k = d.slice(0, 7); if (!seen[k]) { seen[k] = 1; keys.push(k); } });
    return { keys: keys, labels: keys.map(function (k) { return A.MONTHS[+k.slice(5, 7) - 1] + ' ' + k.slice(2, 4); }), keyOf: function (d) { return d.slice(0, 7); } };
  }
  function rangeLabel(st) { return st.from === st.to ? fmtDay(st.from) : fmtDay(st.from) + ' – ' + fmtDay(st.to); }
  function shareBar(rows, total, warn) {
    return '<div class="rank">' + rows.map(function (r) {
      var pct = total ? r.value / total * 100 : 0;
      return '<div class="rank-row"><strong>' + h(r.label) + '</strong><span class="muted">' + rp(r.value) + ' · ' + Math.round(pct) + '%</span><div class="bar"><i style="width:' + Math.max(pct ? 3 : 0, pct) + '%"></i></div></div>';
    }).join('') + '</div>';
  }

  /* =====================================================
     LAPORAN PENJUALAN
     ===================================================== */
  var rep = { preset: '7', from: null, to: null };
  A.views.laporan = function () {
    if (!guardAdmin()) return;
    if (!rep.from) { var r0 = presetRange('7'); rep.from = r0.from; rep.to = r0.to; }
    var txs = S.txRange(rep.from, rep.to), sum = S.summarize(txs), prods = S.byProduct(txs);
    var g = grouping(rep.from, rep.to), idx = {}, vals = g.keys.map(function () { return 0; });
    g.keys.forEach(function (k, i) { idx[k] = i; });
    txs.forEach(function (t) { vals[idx[g.keyOf(t.day)]] += t.total; });
    var cats = {}, methods = {};
    prods.forEach(function (p) { cats[p.category] = (cats[p.category] || 0) + p.revenue; });
    txs.forEach(function (t) { methods[t.method] = (methods[t.method] || 0) + t.total; });
    var catRows = Object.keys(cats).map(function (k) { return { label: k, value: cats[k] }; }).sort(function (a, b) { return b.value - a.value; });
    var metRows = Object.keys(methods).map(function (k) { return { label: k, value: methods[k] }; }).sort(function (a, b) { return b.value - a.value; });
    var catTotal = catRows.reduce(function (s, r) { return s + r.value; }, 0), metTotal = metRows.reduce(function (s, r) { return s + r.value; }, 0);

    $('#view').innerHTML =
      '<div class="page-head"><div><h2>Laporan Penjualan</h2><p>' + rangeLabel(rep) + '</p></div><div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="lp-csv">' + icon('download', 16) + 'Ekspor CSV</button><button class="btn" id="lp-print">' + icon('print', 16) + 'Cetak</button></div></div>' +
      periodBar(rep) +
      '<div class="stack"><div class="stats">' + statCard('Penjualan Bersih', rp(sum.net), 'Kotor ' + rp(sum.gross), 'coins', true) + statCard('Transaksi', num(sum.count), 'Diskon ' + rp(sum.disc), 'receipt') +
      statCard('Item Terjual', num(sum.items), 'Seluruh menu', 'pkg') + statCard('Rata-rata Transaksi', rp(sum.avg), 'Per transaksi', 'trend') + '</div>' +
      '<section class="card"><div class="card-head"><h3>Penjualan ' + (g.keys.length > 0 && g.keyOf('2000-01-01') === '2000-01' ? 'per Bulan' : 'per Hari') + '</h3></div><div class="chart" id="lp-chart"></div></section>' +
      '<section class="card flush"><div class="card-head"><h3>Penjualan per Produk</h3><span class="sub">Omzet sebelum diskon</span></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Produk</th><th>Kategori</th><th class="num">Terjual</th><th class="num">Omzet</th><th class="num">HPP</th><th class="num">Laba</th></tr></thead><tbody>' +
      (prods.length ? prods.map(function (p, i) {
        return '<tr><td>' + (i + 1) + '</td><td class="cell-main">' + h(p.name) + '</td><td>' + h(p.category) + '</td><td class="num">' + num(p.qty) + '</td><td class="num nowrap">' + rp(p.revenue) + '</td><td class="num nowrap">' + rp(p.cogs) + '</td><td class="num nowrap">' + rp(p.profit) + '</td></tr>';
      }).join('') : '<tr><td colspan="7" class="empty">Belum ada penjualan pada periode ini.</td></tr>') +
      '</tbody>' + (prods.length ? '<tfoot><tr><td colspan="3">Total</td><td class="num">' + num(sum.items) + '</td><td class="num nowrap">' + rp(sum.gross) + '</td><td class="num nowrap">' + rp(sum.cogs) + '</td><td class="num nowrap">' + rp(sum.gross - sum.cogs) + '</td></tr></tfoot>' : '') + '</table></div></section>' +
      '<div class="grid-eq"><section class="card"><div class="card-head"><h3>Per Kategori</h3></div>' + (catRows.length ? shareBar(catRows, catTotal) : '<div class="empty">Tidak ada data.</div>') + '</section>' +
      '<section class="card"><div class="card-head"><h3>Metode Pembayaran</h3></div>' + (metRows.length ? shareBar(metRows, metTotal) : '<div class="empty">Tidak ada data.</div>') + '</section></div></div>';

    C.render($('#lp-chart'), { type: g.keys.length > 20 ? 'line' : 'bar', labels: g.labels, title: 'Penjualan', series: [{ name: 'Penjualan', color: '#7C9070', values: vals }] });
    bindPeriod(rep, A.refresh);
    $('#lp-print').addEventListener('click', function () { window.print(); });
    $('#lp-csv').addEventListener('click', function () {
      var rows = [['Laporan Penjualan Kedai Rasa Kita'], ['Periode', rep.from + ' s/d ' + rep.to], [], ['Produk', 'Kategori', 'Terjual', 'Omzet', 'HPP', 'Laba']];
      prods.forEach(function (p) { rows.push([p.name, p.category, p.qty, p.revenue, p.cogs, p.profit]); });
      rows.push([], ['Penjualan kotor', sum.gross], ['Diskon', sum.disc], ['Penjualan bersih', sum.net], ['Jumlah transaksi', sum.count]);
      A.downloadCSV('laporan-penjualan_' + rep.from + '_' + rep.to + '.csv', rows);
    });
  };

  /* =====================================================
     LAPORAN KEUANGAN
     ===================================================== */
  var fin = { preset: 'month', from: null, to: null };
  var EXP_CATS = ['Operasional', 'Sewa', 'Gaji', 'Listrik & Air', 'Pemasaran', 'Lainnya'];

  A.views.keuangan = function () {
    if (!guardAdmin()) return;
    if (!fin.from) { var r0 = presetRange('month'); fin.from = r0.from; fin.to = r0.to; }
    var txs = S.txRange(fin.from, fin.to), sum = S.summarize(txs), exps = S.expRange(fin.from, fin.to);
    var totalExp = exps.reduce(function (s, e) { return s + e.amount; }, 0);
    var gross = sum.net - sum.cogs, net = gross - totalExp;
    var g = grouping(fin.from, fin.to), idx = {};
    g.keys.forEach(function (k, i) { idx[k] = i; });
    var rev = g.keys.map(function () { return 0; }), out = g.keys.map(function () { return 0; });
    txs.forEach(function (t) {
      var i = idx[g.keyOf(t.day)]; rev[i] += t.total;
      t.items.forEach(function (it) { out[i] += it.cost * it.qty; });
    });
    exps.forEach(function (e) { out[idx[g.keyOf(e.date)]] += e.amount; });
    var byCat = {};
    exps.forEach(function (e) { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    var admin = A.isAdmin();

    $('#view').innerHTML =
      '<div class="page-head"><div><h2>Laporan Keuangan</h2><p>' + rangeLabel(fin) + '</p></div><div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="fn-add">' + icon('plus', 16) + 'Catat Biaya</button><button class="btn" id="fn-csv">' + icon('download', 16) + 'Ekspor CSV</button><button class="btn" id="fn-print">' + icon('print', 16) + 'Cetak</button></div></div>' +
      periodBar(fin) +
      '<div class="stack"><div class="stats">' + statCard('Pendapatan Bersih', rp(sum.net), num(sum.count) + ' transaksi', 'coins') + statCard('Laba Kotor', rp(gross), 'Margin ' + (sum.net ? Math.round(gross / sum.net * 100) : 0) + '%', 'trend') +
      statCard('Biaya Operasional', rp(totalExp), num(exps.length) + ' pencatatan', 'wallet') + statCard('Laba Bersih', rp(net), net >= 0 ? 'Untung' : 'Rugi', 'check', true) + '</div>' +
      '<div class="grid-2"><section class="card"><div class="card-head"><div><h3>Pendapatan vs Pengeluaran</h3><div class="sub">Pengeluaran = HPP + biaya operasional</div></div>' +
      '<div class="legend"><span><i style="background:#7C9070"></i>Pendapatan</span><span><i style="background:#B7BFB4"></i>Pengeluaran</span></div></div><div class="chart" id="fn-chart"></div></section>' +
      '<section class="card"><div class="card-head"><h3>Laba Rugi</h3></div><div class="list">' +
      plRow('Pendapatan bersih', sum.net, true) + plRow('HPP (harga pokok)', -sum.cogs) + plRow('Laba kotor', gross, true) +
      Object.keys(byCat).map(function (k) { return plRow(k, -byCat[k]); }).join('') + plRow('Total biaya operasional', -totalExp, true) + plRow('Laba bersih', net, true, true) + '</div></section></div>' +
      '<section class="card flush"><div class="card-head"><h3>Biaya Operasional</h3><span class="sub">' + exps.length + ' catatan</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th class="num">Jumlah</th><th></th></tr></thead><tbody id="fn-body">' +
      (exps.length ? exps.map(function (e) {
        return '<tr><td class="nowrap">' + fmtDay(e.date) + '</td><td>' + badge('muted', h(e.category)) + '</td><td>' + h(e.desc || '-') + '</td><td class="num nowrap">' + rp(e.amount) + '</td><td class="actions no-print"><button class="icon-btn danger" data-del="' + h(e.id) + '" aria-label="Hapus biaya">' + icon('trash', 18) + '</button></td></tr>';
      }).join('') : '<tr><td colspan="5" class="empty">Belum ada biaya pada periode ini.</td></tr>') + '</tbody></table></div></section></div>';

    C.render($('#fn-chart'), { type: 'bar', labels: g.labels, title: 'Pendapatan dan pengeluaran', series: [{ name: 'Pendapatan', color: '#7C9070', values: rev }, { name: 'Pengeluaran', color: '#B7BFB4', values: out }] });
    bindPeriod(fin, A.refresh);
    $('#fn-print').addEventListener('click', function () { window.print(); });
    $('#fn-add').addEventListener('click', expenseForm);
    $('#fn-body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]'); if (!b) return;
      confirmDialog({ title: 'Hapus catatan biaya?', message: 'Catatan biaya ini akan dihapus dari laporan.', okLabel: 'Hapus' }, function () {
        S.deleteExpense(b.dataset.del); toast('Catatan biaya dihapus.'); A.refresh();
      });
    });
    $('#fn-csv').addEventListener('click', function () {
      var rows = [['Laporan Keuangan Kedai Rasa Kita'], ['Periode', fin.from + ' s/d ' + fin.to], [],
        ['Pendapatan bersih', sum.net], ['HPP', sum.cogs], ['Laba kotor', gross], ['Biaya operasional', totalExp], ['Laba bersih', net], [],
        ['Tanggal', 'Kategori', 'Keterangan', 'Jumlah']];
      exps.forEach(function (e) { rows.push([e.date, e.category, e.desc, e.amount]); });
      A.downloadCSV('laporan-keuangan_' + fin.from + '_' + fin.to + '.csv', rows);
    });
    void admin;
  };
  function plRow(label, val, bold, big) {
    return '<div class="list-row"><span' + (bold ? ' class="cell-main"' : ' class="muted"') + '>' + h(label) + '</span><span class="nowrap' + (bold ? ' cell-main' : '') + '"' + (big ? ' style="font-size:16px"' : '') + '>' + rp(val) + '</span></div>';
  }
  function expenseForm() {
    var m = openModal({
      title: 'Catat Biaya Operasional', size: 'sm',
      body: '<form class="form" id="ef" novalidate><label class="field"><span>Tanggal</span><input class="input" type="date" name="date" required value="' + todayKey() + '"></label>' +
        '<label class="field"><span>Kategori</span><select class="select" name="category">' + EXP_CATS.map(function (c) { return '<option>' + h(c) + '</option>'; }).join('') + '</select></label>' +
        '<label class="field"><span>Keterangan</span><input class="input" name="desc" maxlength="80" placeholder="Contoh: Tagihan listrik"></label>' +
        '<label class="field"><span>Jumlah (Rp)</span><input class="input" name="amount" inputmode="numeric" required placeholder="0"></label><div class="error-text" id="ef-err" role="alert"></div></form>',
      footer: '<button class="btn" data-close>Batal</button><button class="btn btn-primary" type="submit" form="ef">Simpan</button>',
      onMount: function (el) {
        var f = $('#ef', el); bindMoney(f.amount);
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var r = S.addExpense({ date: f.date.value, category: f.category.value, desc: f.desc.value, amount: parseMoney(f.amount.value), user: A.user().name });
          if (!r.ok) { $('#ef-err', el).textContent = r.error; return; }
          m.close(); toast('Biaya dicatat.'); A.refresh();
        });
      }
    });
  }

  /* =====================================================
     PENGATURAN
     ===================================================== */
  A.openSettings = function () {
    var admin = A.isAdmin();
    var m = openModal({
      title: 'Pengaturan',
      body: '<div class="settings-block"><h4>Akun</h4><p class="muted">' + h(A.user().name) + ' · ' + (admin ? 'Admin' : 'Kasir') + '</p>' +
        '<form class="form" id="pwf" style="margin-top:12px" novalidate><label class="field"><span>Password lama</span><input class="input" type="password" name="old" autocomplete="current-password"></label>' +
        '<label class="field"><span>Password baru (min. 6 karakter)</span><input class="input" type="password" name="neu" autocomplete="new-password"></label>' +
        '<div class="error-text" id="pw-err" role="alert"></div><div><button class="btn btn-primary" type="submit">Ubah Password</button></div></form></div>' +
        (admin ? '<div class="settings-block"><h4>Data</h4><p class="muted">Data tersimpan di browser ini. Buat cadangan secara berkala.</p><div class="row">' +
          '<button class="btn" id="st-backup">' + icon('download', 16) + 'Cadangkan (JSON)</button><label class="btn" style="cursor:pointer">Pulihkan<input type="file" id="st-restore" accept="application/json,.json" hidden></label>' +
          '<button class="btn btn-soft-danger" id="st-reset">Reset ke data contoh</button></div></div>' : ''),
      onMount: function (el) {
        $('#pwf', el).addEventListener('submit', function (e) {
          e.preventDefault();
          var f = e.target, r = S.changePassword(A.user().id, f.old.value, f.neu.value);
          if (!r.ok) { $('#pw-err', el).textContent = r.error; return; }
          m.close(); toast('Password berhasil diubah.');
        });
        if (!admin) return;
        $('#st-backup', el).addEventListener('click', function () {
          A.downloadFile('kedai-rasa-kita-backup-' + todayKey() + '.json', S.exportJSON(), 'application/json');
        });
        $('#st-restore', el).addEventListener('change', function (e) {
          var file = e.target.files[0]; if (!file) return;
          var rd = new FileReader();
          rd.onload = function () {
            confirmDialog({ title: 'Pulihkan data?', message: 'Seluruh data saat ini akan diganti dengan isi file cadangan.', okLabel: 'Pulihkan' }, function () {
              var r = S.importJSON(String(rd.result));
              if (!r.ok) { toast(r.error, 'err'); return; }
              m.close(); toast('Data berhasil dipulihkan.');
              var u = S.get().users.filter(function (x) { return x.id === A.user().id; })[0];
              if (!u) A.showLogin(); else A.refresh();
            });
          };
          rd.readAsText(file);
        });
        $('#st-reset', el).addEventListener('click', function () {
          confirmDialog({ title: 'Reset data?', message: 'Semua data (produk, stok, transaksi, biaya) akan dikembalikan ke data contoh. Tindakan ini tidak bisa dibatalkan.', okLabel: 'Reset' }, function () {
            S.reset(); m.close(); toast('Data direset ke data contoh.'); A.showLogin();
          });
        });
      }
    });
  };

  A.start();
})(window);
