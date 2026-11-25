/* Kedai Rasa Kita - SIM Penjualan & Persediaan
 * store.js : data, autentikasi, dan seluruh logika bisnis.
 * Data tersimpan di localStorage browser (tanpa server).
 */
(function (root) {
  'use strict';

  var KEY = 'krk_sim_v2';
  var SESSION_KEY = 'krk_session_v2';
  var data = null;

  /* ---------- utilitas ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(d) {
    d = d instanceof Date ? d : new Date(d);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseKey(k) {
    var p = k.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function r3(v) { return Math.round(v * 1000) / 1000; }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dayRange(from, to) {
    var out = [], d = parseKey(from), end = parseKey(to), guard = 0;
    while (d <= end && guard++ < 800) { out.push(dateKey(d)); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); }
    return out;
  }

  /* ---------- data awal (demo) ---------- */
  function seedData() {
    function ing(id, name, unit, stock, min, cost) { return { id: id, name: name, unit: unit, stock: stock, min: min, cost: cost }; }
    function rec(arr) { return arr.map(function (a) { return { iid: a[0], qty: a[1] }; }); }
    var ingredients = [
      ing('i_beras', 'Beras', 'gram', 18000, 3000, 14),
      ing('i_telur', 'Telur ayam', 'butir', 90, 20, 2300),
      ing('i_ayam', 'Daging ayam', 'gram', 7500, 1500, 38),
      ing('i_mie', 'Mie kuning', 'gram', 5200, 1000, 16),
      ing('i_minyak', 'Minyak goreng', 'ml', 9000, 2000, 18),
      ing('i_bumbu', 'Bumbu halus', 'gram', 2800, 500, 32),
      ing('i_cabai', 'Cabai rawit', 'gram', 260, 300, 60),
      ing('i_kentang', 'Kentang', 'gram', 4500, 1000, 18),
      ing('i_teh', 'Teh celup', 'pcs', 160, 30, 450),
      ing('i_gula', 'Gula pasir', 'gram', 6500, 1000, 16),
      ing('i_kopi', 'Kopi bubuk', 'gram', 1800, 300, 130),
      ing('i_susu', 'Susu cair', 'ml', 7000, 1500, 20),
      ing('i_jeruk', 'Jeruk peras', 'pcs', 40, 15, 2200)
    ];
    var products = [
      { id: 'p_nasgor', name: 'Nasi Goreng Spesial', category: 'Makanan', price: 22000, active: true, manualCost: 0,
        recipe: rec([['i_beras', 200], ['i_telur', 1], ['i_ayam', 50], ['i_minyak', 15], ['i_bumbu', 20], ['i_cabai', 8]]) },
      { id: 'p_mie', name: 'Mie Goreng', category: 'Makanan', price: 20000, active: true, manualCost: 0,
        recipe: rec([['i_mie', 120], ['i_telur', 1], ['i_minyak', 15], ['i_bumbu', 20], ['i_cabai', 6]]) },
      { id: 'p_geprek', name: 'Ayam Geprek', category: 'Makanan', price: 25000, active: true, manualCost: 0,
        recipe: rec([['i_ayam', 150], ['i_minyak', 40], ['i_cabai', 25], ['i_beras', 150]]) },
      { id: 'p_kentang', name: 'Kentang Goreng', category: 'Camilan', price: 15000, active: true, manualCost: 0,
        recipe: rec([['i_kentang', 150], ['i_minyak', 60]]) },
      { id: 'p_esteh', name: 'Es Teh Manis', category: 'Minuman', price: 6000, active: true, manualCost: 0,
        recipe: rec([['i_teh', 1], ['i_gula', 25]]) },
      { id: 'p_tehhangat', name: 'Teh Hangat', category: 'Minuman', price: 5000, active: true, manualCost: 0,
        recipe: rec([['i_teh', 1], ['i_gula', 15]]) },
      { id: 'p_kopisusu', name: 'Kopi Susu', category: 'Minuman', price: 14000, active: true, manualCost: 0,
        recipe: rec([['i_kopi', 15], ['i_susu', 100], ['i_gula', 15]]) },
      { id: 'p_esjeruk', name: 'Es Jeruk', category: 'Minuman', price: 9000, active: true, manualCost: 0,
        recipe: rec([['i_jeruk', 2], ['i_gula', 20]]) },
      { id: 'p_air', name: 'Air Mineral', category: 'Minuman', price: 4000, active: true, manualCost: 2000, recipe: [] }
    ];
    var d = {
      version: 2,
      users: [
        { id: 'u_admin', username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
        { id: 'u_kasir', username: 'kasir', password: 'kasir123', name: 'Kasir Utama', role: 'kasir' }
      ],
      ingredients: ingredients, products: products,
      transactions: [], movements: [], expenses: [],
      dailyResets: {}
    };

    // transaksi contoh 31 hari terakhir (stok tidak dikurangi karena stok awal sudah final)
    var rand = mulberry(20261122);
    var now = new Date();
    var counters = {};
    var weights =;
    var wsum = weights.reduce(function (a, b) { return a + b; }, 0);
    function pick() {
      var r = rand() * wsum, i = 0;
      for (; i < weights.length; i++) { r -= weights[i]; if (r <= 0) break; }
      return products[Math.min(i, products.length - 1)];
    }
    var all = [];
    for (var back = 30; back >= 0; back--) {
      var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
      var dow = day.getDay();
      var n = Math.round(14 + rand() * 8 + (dow === 0 || dow === 6 ? 8 : 0));
      var times = [];
      for (var k = 0; k < n; k++) {
        var ts = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 10 + Math.floor(rand() * 11), Math.floor(rand() * 60), Math.floor(rand() * 60));
        if (back === 0 && ts > now) continue;
        times.push(ts);
      }
      times.sort(function (a, b) { return a - b; });
      times.forEach(function (ts) {
        var cnt = 1 + Math.floor(rand() * 3.4), chosen = {}, items = [];
        for (var q = 0; q < cnt; q++) {
          var p = pick(); if (chosen[p.id]) continue; chosen[p.id] = 1;
          var qty = 1 + Math.floor(rand() * 2.6);
          var cost = p.recipe.length ? p.recipe.reduce(function (s, r) {
            var g = ingredients.filter(function (x) { return x.id === r.iid; })[0]; return s + (g ? g.cost * r.qty : 0);
          }, 0) : p.manualCost;
          items.push({ pid: p.id, name: p.name, category: p.category, price: p.price, cost: Math.round(cost), qty: qty, recipe: [] });
        }
        var subtotal = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        var discount = rand() < 0.08 ? 2000 : 0;
        var total = subtotal - discount;
        var m = rand(), method = m < 0.55 ? 'Tunai' : (m < 0.85 ? 'QRIS' : 'Transfer');
        var paid = total;
        if (method === 'Tunai') paid = Math.ceil(total / 5000) * 5000 + (rand() < 0.3 ? 5000 : 0);
        var dk = dateKey(ts), ck = dk.replace(/-/g, '');
        counters[ck] = (counters[ck] || 0) + 1;
        var no = 'TRX-' + ck + '-' + String(counters[ck]).padStart(4, '0');
        all.push({
          id: 'T' + no, no: no, ts: ts.toISOString(), day: dk,
          cashier: rand() < 0.8 ? 'Kasir Utama' : 'Administrator',
          items: items, subtotal: subtotal, discount: discount, total: total,
          method: method, paid: paid, change: paid - total,
          status: 'selesai', stockDeducted: false
        });
      });
    }
    d.transactions = all.reverse();

    // biaya operasional contoh
    var monthStart = dateKey(new Date(now.getFullYear(), now.getMonth(), 1));
    function exp(date, cat, desc, amount) { return { id: uid('e_'), date: date, category: cat, desc: desc, amount: amount, user: 'Administrator' }; }
    d.expenses.push(exp(monthStart, 'Sewa', 'Sewa tempat bulan ini', 1500000));
    d.expenses.push(exp(monthStart, 'Gaji', 'Gaji karyawan (2 orang)', 2400000));
    d.expenses.push(exp(dateKey(new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 3))), 'Listrik & Air', 'Tagihan listrik dan air', 350000));
    for (var g = 0; g < 6; g++) {
      d.expenses.push(exp(dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - g * 5)), 'Operasional', 'Gas LPG 3 kg', 22000 * 2));
    }
    d.expenses.push(exp(dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8)), 'Lainnya', 'Perlengkapan kebersihan', 85000));
    d.expenses.push(exp(dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)), 'Lainnya', 'Kemasan dan tisu', 120000));
    d.expenses.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return d;
  }

  /* ---------- persistensi ---------- */
  function save() {
    try { root.localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch (e) { console.error('Gagal menyimpan', e); return false; }
  }
  function load() {
    try {
      var raw = root.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 2) {
          if (!parsed.dailyResets || typeof parsed.dailyResets !== 'object') parsed.dailyResets = {};
          data = parsed;
          return data;
        }
      }
    } catch (e) { /* abaikan, buat data baru */ }
    data = seedData(); save(); return data;
  }
  function reset() { data = seedData(); save(); return data; }
  function exportJSON() { return JSON.stringify(data, null, 2); }
  function importJSON(text) {
    var p;
    try { p = JSON.parse(text); } catch (e) { return { ok: false, error: 'File bukan JSON yang valid.' }; }
    if (!p || p.version !== 2 || !Array.isArray(p.users) || !Array.isArray(p.products) ||
        !Array.isArray(p.ingredients) || !Array.isArray(p.transactions) || !Array.isArray(p.expenses)) {
      return { ok: false, error: 'Format cadangan tidak dikenali.' };
    }
    if (!Array.isArray(p.movements)) p.movements = [];
    if (!p.dailyResets || typeof p.dailyResets !== 'object') p.dailyResets = {};
    data = p; save(); return { ok: true };
  }

  /* ---------- autentikasi ---------- */
  function login(username, password, role) {
    var u = data.users.filter(function (x) {
      return x.username.toLowerCase() === String(username).trim().toLowerCase();
    })[0];
