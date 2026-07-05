# Skenario Black-Box Testing — Toko Alat Tulis Agung

Dokumen ini berisi skenario pengujian black-box untuk seluruh fitur aplikasi.
Prasyarat: database sudah di-migrate & seed (`npm run db:migrate && npm run db:seed`), aplikasi berjalan (`npm run dev`).

Akun uji:
- Admin: `admin` / `admin123`
- Pembeli: `pembeli` / `pembeli123` (atau daftar akun baru lewat halaman `/register`)

| No | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| 1 | Login admin berhasil | Buka `/login`, isi `admin` / `admin123`, klik Masuk | Diarahkan ke `/dashboard`, ringkasan dashboard tampil | ☐ |
| 2 | Login gagal | Buka `/login`, isi username/password salah | Muncul pesan "Username atau password salah!", tetap di halaman login | ☐ |
| 3 | Tambah barang | Login admin → Data Barang → Tambah Barang → isi form valid → simpan | Muncul pesan sukses, barang baru tampil di tabel dengan kode BRG-xxxx | ☐ |
| 4 | Edit barang | Data Barang → klik ikon edit pada satu barang → ubah harga/stok → simpan | Muncul pesan sukses, data pada tabel berubah | ☐ |
| 5 | Hapus barang | Data Barang → klik ikon hapus → konfirmasi | Muncul pesan sukses, barang hilang dari tabel | ☐ |
| 6 | Checkout berhasil | Login pembeli → `/belanja` → tambah barang ke keranjang → Keranjang → Buat Pesanan | Diarahkan ke halaman pembayaran QRIS, status "Menunggu Pembayaran", stok barang BELUM berkurang | ☐ |
| 7 | Checkout gagal karena stok kurang | Di `/belanja`, coba menaikkan jumlah melebihi stok; atau checkout saat stok sudah diambil pesanan lain | Tombol tambah nonaktif saat mencapai stok; server menolak dengan pesan "Stok ... tidak mencukupi" | ☐ |
| 8 | Upload bukti pembayaran berhasil | Dari halaman pembayaran, pilih file JPG/PNG < 2MB → Unggah | Muncul pesan sukses, status berubah "Menunggu Verifikasi", gambar tampil di daftar bukti | ☐ |
| 9 | Upload bukti gagal (format salah) | Pilih file PDF/di atas 2MB → Unggah | Muncul pesan error format/ukuran, status tidak berubah | ☐ |
| 10 | Admin menyetujui pembayaran | Login admin → Verifikasi Pembayaran → Detail transaksi menunggu verifikasi → Setujui | Pesan sukses, status "Lunas", stok barang berkurang sesuai jumlah pesanan | ☐ |
| 11 | Admin menolak pembayaran | Verifikasi Pembayaran → Detail → isi alasan → Tolak | Status "Ditolak" + alasan tampil di halaman pesanan pembeli; pembeli bisa unggah ulang bukti | ☐ |
| 12 | Export PDF berhasil | Login admin → Laporan → pilih rentang tanggal → klik PDF pada salah satu jenis laporan | File PDF terunduh, berisi judul, tanggal export, tabel data, dan ringkasan | ☐ |
| 13 | Export Excel berhasil | Laporan → klik Excel pada salah satu jenis laporan | File .xlsx terunduh dan bisa dibuka, isi sama dengan versi PDF | ☐ |
| 14 | Chatbot menjawab pertanyaan stok | Buka widget chatbot → tanya "stok pulpen masih ada?" | Jawaban menyebutkan nama produk, harga, dan jumlah stok dari database | ☐ |
| 15 | Chatbot menjawab pertanyaan harga | Tanya "berapa harga kertas HVS?" | Jawaban menyebutkan harga produk sesuai database | ☐ |
| 16 | Chatbot menolak pertanyaan di luar konteks | Tanya "siapa presiden Indonesia?" | Jawaban persis: "Maaf, saya hanya dapat membantu informasi seputar Toko Alat Tulis Agung." | ☐ |
| 17 | Tampilan mobile berjalan baik | Buka aplikasi dengan lebar layar ±375px (DevTools) di halaman: landing, login, dashboard, barang, transaksi, checkout, pembayaran, laporan, chatbot | Tidak ada elemen terpotong; sidebar admin menjadi menu drawer; tabel bisa discroll horizontal; tombol mudah ditekan | ☐ |

## Skenario tambahan (pendukung)

| No | Skenario | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- |
| 18 | Registrasi pembeli baru (`/register`) | Akun dibuat dengan role `user`; username duplikat ditolak | ☐ |
| 19 | User biasa mencoba membuka `/dashboard` | Diarahkan keluar (bukan admin); API admin menolak dengan status 403 | ☐ |
| 20 | User biasa memanggil API laporan (mis. `/api/laporan/export`) | Respons 403 "Akses ditolak, khusus admin" — data laporan tidak bocor ke user biasa | ☐ |
| 21 | Pembeli membatalkan pesanan yang belum dibayar | Status menjadi "Dibatalkan", tidak bisa dibayar lagi | ☐ |
| 22 | Verifikasi disetujui saat stok tidak lagi cukup | Sistem menolak menyetujui dan menampilkan pesan stok tidak mencukupi (stok tidak menjadi minus) | ☐ |
| 23 | Input jumlah barang kosong/minus (kasir & checkout) | Ditolak dengan pesan validasi "Jumlah barang tidak boleh kosong atau minus" | ☐ |
| 24 | Chatbot: admin bertanya "omset hari ini" | Jawaban berisi ringkasan laporan; pertanyaan yang sama oleh user biasa TIDAK menampilkan data laporan | ☐ |
| 25 | Ganti QRIS di Pengaturan → Pembayaran | Gambar QRIS baru tampil di halaman pembayaran pesanan berikutnya | ☐ |

## Catatan pengujian

- Kolom **Status** diisi ✅ (lulus) / ❌ (gagal) beserta tanggal pengujian.
- Bukti pengujian (screenshot) disarankan disimpan per skenario untuk lampiran skripsi.
- Pengujian keamanan dasar: pastikan `.env` tidak ikut ke repository dan API key tidak pernah tampil di response/browser.
