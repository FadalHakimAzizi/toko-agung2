# Aplikasi Stok Barang Toko Alat Tulis Agung

Aplikasi web manajemen stok barang dengan **pembayaran digital QRIS** dan **chatbot berbasis RAG** (Retrieval-Augmented Generation), dikembangkan untuk kebutuhan skripsi:

> "Pengembangan Aplikasi Stok Barang pada Toko Alat Tulis Agung dengan Pembayaran Digital QRIS, dan Chatbot Berbasis RAG."

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Next.js Route Handlers (`app/api/*`) |
| Database | PostgreSQL (Supabase / lokal) via `pg` |
| Grafik | Chart.js + react-chartjs-2 |
| Export laporan | `jspdf` + `jspdf-autotable` (PDF), `exceljs` (Excel) |
| Chatbot | RAG: retrieval semantic (embedding + pgvector) & keyword dari database + LLM (Groq) untuk generation |

## Fitur

### Fitur lama (dipertahankan)
- Landing page profil toko (katalog, FAQ, lokasi, kontak).
- Login admin.
- Dashboard admin: ringkasan, grafik penjualan mingguan/bulanan, produk terlaris.
- Kelola barang (CRUD) + kategori.
- Transaksi kasir (tunai) dengan keranjang.
- Laporan transaksi per rentang tanggal.

### Fitur baru (pengembangan skripsi)
1. **Autentikasi sungguhan** — login/daftar dengan password ter-hash (scrypt), sesi cookie httpOnly, role `admin` dan `user`.
2. **Belanja online & checkout** — katalog dinamis dari database, keranjang, ringkasan pesanan, validasi stok. Status awal: `menunggu_pembayaran`.
3. **Pembayaran QRIS** — halaman pembayaran menampilkan total + gambar QRIS (dikelola admin lewat Pengaturan → Pembayaran).
4. **Upload bukti pembayaran** — jpg/jpeg/png/webp, maks. 2MB. Setelah unggah, status menjadi `menunggu_verifikasi`.
5. **Verifikasi pembayaran admin** — setujui (status `lunas`, **stok baru berkurang di sini**) atau tolak (status `ditolak` + alasan; pembeli bisa unggah ulang).
6. **Export laporan PDF & Excel** — laporan transaksi, stok barang, dan pembayaran; diproses di backend; berisi judul, tanggal export, tabel, dan ringkasan.
7. **Responsive UI/UX** — sidebar admin menjadi drawer di mobile, tabel bisa discroll horizontal, grid katalog adaptif.
8. **Chatbot RAG** — widget chat di landing page, halaman belanja, pesanan, dan dashboard. Menjawab stok/harga/produk (database), FAQ/profil/jam buka (knowledge base), dan ringkasan laporan (khusus admin). Pertanyaan di luar konteks toko ditolak.

## Cara Menjalankan Project

### 1. Prasyarat
- Node.js 20+ (disarankan 22/24)
- Akun [Supabase](https://supabase.com) (gratis) atau PostgreSQL lokal

### 2. Instalasi
```bash
npm install
```

### 3. Konfigurasi environment
Salin `.env.example` menjadi `.env`, lalu isi:

```env
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

Cara mendapatkan connection string Supabase:
1. Buat project baru di [supabase.com](https://supabase.com) (catat password database).
2. Buka **Project Settings → Database → Connection string**, pilih **URI** dan mode **Session pooler** (port 5432).
3. Ganti `[YOUR-PASSWORD]` dengan password database Anda.

### 4. Migration & seed database
```bash
npm run db:migrate   # membuat semua tabel + pgvector (db/migrations/*.sql)
npm run db:seed      # mengisi akun, kategori, barang, pengaturan, knowledge base
npm run db:embed     # membuat embedding knowledge base (opsional, butuh EMBEDDING_API_KEY)
```

> `db:embed` mengisi kolom vektor untuk pencarian semantic chatbot. Jika dilewati (mis. belum punya API key embedding), chatbot tetap berjalan memakai keyword search.

Akun hasil seed:
- Admin: `admin` / `admin123`
- Pembeli contoh: `pembeli` / `pembeli123`

> Ganti password akun admin pada database untuk penggunaan sesungguhnya.

### 5. Jalankan
```bash
npm run dev    # development di http://localhost:3000
# atau
npm run build && npm start   # production
```

## Cara Menggunakan Fitur QRIS

1. **Admin** membuka **Dashboard → Pengaturan → Pembayaran (QRIS)** lalu mengunggah gambar QRIS asli toko (dari penyedia pembayaran). Sebelum diganti, sistem memakai gambar placeholder.
2. **Pembeli** membuka **Belanja Online** (dari landing page), mengisi keranjang, lalu **Checkout**.
3. Pembeli diarahkan ke halaman **Pembayaran QRIS**: scan QR, bayar sesuai total, lalu **unggah bukti pembayaran** (gambar, maks. 2MB).
4. **Admin** membuka **Dashboard → Verifikasi Pembayaran**, memeriksa bukti, lalu **Setujui** (transaksi lunas, stok berkurang) atau **Tolak** (dengan alasan; pembeli dapat mengunggah ulang).
5. Pembeli memantau status pesanannya di halaman **Pesanan Saya**.

Alur status: `menunggu_pembayaran` → `menunggu_verifikasi` → `lunas` / `ditolak` (bisa juga `dibatalkan` oleh pembeli selama belum dibayar).

## Cara Menggunakan Chatbot RAG

Klik tombol robot (kiri bawah) di landing page, halaman belanja, pesanan, atau dashboard.

Alur RAG (lihat [lib/rag.ts](lib/rag.ts)): **Retrieve → Augment → Generate**.

1. **Retrieve** — mencari konteks relevan dari:
   - **Database aplikasi** (stok, harga, daftar produk real-time) via keyword search.
   - **Knowledge base** (FAQ, profil, alamat, jam operasional, kebijakan) via **semantic search**: pertanyaan diubah jadi vektor embedding, lalu dicari entri termirip dengan pgvector (operator cosine `<=>`). Jika embedding tidak dikonfigurasi, otomatis fallback ke keyword search.
   - **Ringkasan laporan** (khusus admin, mis. "berapa omset hari ini?").
2. **Augment** — konteks yang ditemukan dirangkai menjadi teks dan disisipkan ke prompt.
3. **Generate** — LLM menyusun jawaban HANYA dari konteks tersebut. Jika tidak ada konteks relevan / pertanyaan di luar topik toko, chatbot menolak: *"Maaf, saya hanya dapat membantu informasi seputar Toko Alat Tulis Agung."*

Semua percakapan tercatat di tabel `chatbot_logs`.

### Konfigurasi LLM & Embedding
Chatbot memakai dua layanan (keduanya punya tier gratis):

```env
# Generation (LLM) — Groq
AI_API_KEY=gsk_...
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile

# Retrieval (embedding) — Jina AI, disimpan di pgvector
EMBEDDING_API_KEY=jina_...
EMBEDDING_BASE_URL=https://api.jina.ai/v1
EMBEDDING_MODEL=jina-embeddings-v3
```

- **Groq** (LLM): buat API key di [console.groq.com](https://console.groq.com). Bila kosong, chatbot memakai jawaban template dari hasil retrieval (tetap akurat, tidak mengarang).
- **Jina AI** (embedding): ambil key gratis di [jina.ai/embeddings](https://jina.ai/embeddings). Bila kosong, retrieval knowledge base memakai keyword search. Setelah mengisi key, jalankan `npm run db:embed`.
- Modul embedding fleksibel — mendukung Google Gemini juga (ganti `EMBEDDING_BASE_URL` & `EMBEDDING_MODEL`; lihat [.env.example](.env.example)). Dimensi vektor default 768.

> Semua kredensial diambil dari environment variable — tidak ada API key yang di-hardcode. Saat deploy, isi variabel ini di dashboard platform hosting.

## Struktur Project (ringkas)

```
app/
  page.tsx               # Landing page
  login/, register/      # Autentikasi
  belanja/, checkout/    # Belanja online & checkout
  pembayaran/[id]/       # Pembayaran QRIS + upload bukti
  pesanan/               # Daftar pesanan pembeli
  dashboard/             # Admin: barang, transaksi kasir, verifikasi, laporan, pengaturan
  api/                   # Backend (route handlers)
components/              # Komponen UI (shadcn/ui + custom)
lib/                     # db, auth, cart, upload, report, rag
db/migrations/           # File SQL migration
scripts/                 # migrate.mjs & seed.mjs
```

## Pengujian

Skenario black-box testing lengkap ada di [TESTING.md](TESTING.md).
