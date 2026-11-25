/* charts.js : grafik SVG ringan (tanpa library eksternal, berfungsi offline) */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var gid = 0;

  function node(name, attrs, parent) {
    var el = document.createElementNS(NS, name);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  function niceStep(raw) {
    var exp = Math.pow(10, Math.floor(Math.log10(raw)));
    var f = raw / exp;
    var nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nf * exp;
  }
  function fmtShort(v) {
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' M';
    if (a >= 1e6) return (v / 1e6).toFixed(a % 1e6 ? 1 : 0).replace(/\.0$/, '').replace('.', ',') + ' jt';
    if (a >= 1e3) return Math.round(v / 1e3) + ' rb';
    return String(Math.round(v));
  }
  function fmtFull(v) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(v));
  }

  /* cfg: { type:'bar'|'line', labels:[], series:[{name,color,values:[]}], height, emptyMax } */
  function render(el, cfg) {
    el._cfg = cfg;
    el.setAttribute('data-chart', '1');
    el.innerHTML = '';
    var W = Math.max(el.clientWidth || 300, 240);
    var H = cfg.height || el.clientHeight || 240;
    var m = { t: 10, r: 8, b: 28, l: 46 };
    var pw = W - m.l - m.r, ph = H - m.t - m.b;
    var n = cfg.labels.length;
    var svg = node('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.title || 'Grafik' }, el);

    var maxV = 0;
    cfg.series.forEach(function (s) { s.values.forEach(function (v) { if (v > maxV) maxV = v; }); });
    if (maxV <= 0) maxV = cfg.emptyMax || 100000;
    var step = niceStep(maxV / 4);
    var top = Math.ceil(maxV / step) * step;
    if (top === maxV && cfg.type !== 'line') top += step; // beri ruang di atas
    var ticks = Math.round(top / step);

    function y(v) { return m.t + ph - (v / top) * ph; }

    var i;
    for (i = 0; i <= ticks; i++) {
      var tv = step * i, ty = y(tv);
      node('line', { x1: m.l, x2: W - m.r, y1: ty, y2: ty, stroke: i === 0 ? '#CBD2C8' : '#E9ECE8', 'stroke-width': 1 }, svg);
      var t = node('text', { x: m.l - 8, y: ty + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#7C857B' }, svg);
      t.textContent = fmtShort(tv);
    }

    var band = n ? pw / n : pw;
    var every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / (cfg.labelW || 46)))));
    for (i = 0; i < n; i++) {
      if (i % every !== 0) continue;
      var lx = m.l + band * i + band / 2;
      var lt = node('text', { x: lx, y: H - 9, 'text-anchor': 'middle', 'font-size': 11, fill: '#7C857B' }, svg);
      lt.textContent = cfg.labels[i];
    }

    if (cfg.type === 'line') {
      var s0 = cfg.series[0], id = 'g' + (++gid), pts = [];
      var defs = node('defs', {}, svg);
      var grad = node('linearGradient', { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      node('stop', { offset: '0%', 'stop-color': s0.color, 'stop-opacity': 0.22 }, grad);
      node('stop', { offset: '100%', 'stop-color': s0.color, 'stop-opacity': 0.02 }, grad);
      s0.values.forEach(function (v, k) { pts.push([m.l + band * k + band / 2, y(v)]); });
      if (pts.length) {
        var d = pts.map(function (p, k) { return (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
        node('path', { d: d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + y(0) + ' L' + pts[0][0].toFixed(1) + ' ' + y(0) + ' Z', fill: 'url(#' + id + ')' }, svg);
        node('path', { d: d, fill: 'none', stroke: s0.color, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
        if (n <= 31) pts.forEach(function (p) { node('circle', { cx: p[0], cy: p[1], r: 2.8, fill: '#fff', stroke: s0.color, 'stroke-width': 1.8 }, svg); });
      }
    } else {
      var sc = cfg.series.length;
      var groupW = Math.min(band * 0.72, 44 * sc);
      var gap = sc > 1 ? 3 : 0;
      var bw = (groupW - gap * (sc - 1)) / sc;
      cfg.series.forEach(function (s, si) {
        s.values.forEach(function (v, k) {
          var h = Math.max(0, (v / top) * ph);
          var x = m.l + band * k + (band - groupW) / 2 + si * (bw + gap);
          if (h > 0) node('rect', { x: x.toFixed(1), y: (y(0) - h).toFixed(1), width: Math.max(1, bw).toFixed(1), height: h.toFixed(1), rx: Math.min(4, bw / 2), fill: s.color }, svg);
        });
      });
    }

    // area hover + tooltip bawaan browser
    for (i = 0; i < n; i++) {
      var r = node('rect', { x: m.l + band * i, y: m.t, width: band, height: ph, fill: 'transparent' }, svg);
      var tip = node('title', {}, r);
      tip.textContent = cfg.labels[i] + '\n' + cfg.series.map(function (s) { return s.name + ': ' + fmtFull(s.values[i] || 0); }).join('\n');
    }
  }

  var timer = null;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-chart]'), function (el) { if (el._cfg) render(el, el._cfg); });
    }, 150);
  });

  root.Charts = { render: render, fmtShort: fmtShort };
})(window);
