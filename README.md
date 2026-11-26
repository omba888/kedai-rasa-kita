# Kedai Rasa Kita - SIM Penjualan & Persediaan

Aplikasi web (HTML, CSS, JavaScript murni). Tanpa server, tanpa instalasi, tanpa internet.

## Akun demo
- Admin : admin / admin123 (semua menu)
- Kasir : kasir / kasir123 (Dashboard, Kasir, Riwayat, Inventori hanya lihat)

## Fitur
- Login Admin/Kasir dengan pembatasan akses per peran
- Kasir (POS): pencarian, kategori, diskon, Tunai/QRIS/Transfer, kembalian, struk cetak
- Produk & Resep: harga, HPP otomatis dari resep, margin, aktif/nonaktif
- Inventori: stok, batas minimum, restock, penyesuaian (opname), riwayat pergerakan
- Stok bahan berkurang otomatis berdasarkan resep tiap penjualan; transaksi ditolak bila stok kurang
- Riwayat transaksi: filter, detail, pembatalan (Admin) dengan pengembalian stok
- Laporan Penjualan & Keuangan (laba rugi, biaya operasional), ekspor CSV, cetak
- Cadangkan/pulihkan data (JSON), ganti password, reset data contoh

## Catatan
Data tersimpan di localStorage browser ini (tidak otomatis tersinkron antar perangkat).
Gunakan Pengaturan > Cadangkan secara berkala. Autentikasi bersifat lokal (demo), bukan pengganti keamanan server.

## Struktur
index.html, css/style.css, js/store.js (data & logika), js/charts.js (grafik SVG), js/app.js (login, kerangka, dashboard, POS), js/views.js (produk, inventori, riwayat, laporan, pengaturan)
