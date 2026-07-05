-- =============================================================
-- Migration 001: Skema awal aplikasi Toko Alat Tulis Agung
-- Dibuat untuk pengembangan skripsi: checkout, pembayaran QRIS,
-- verifikasi pembayaran, laporan, dan chatbot RAG.
-- =============================================================

-- Tabel pengguna (admin & user/pembeli)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  nama_lengkap  VARCHAR(100) NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Sesi login (token disimpan di cookie httpOnly)
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT        PRIMARY KEY,
  user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kategori barang
CREATE TABLE IF NOT EXISTS kategori (
  id            SERIAL PRIMARY KEY,
  nama_kategori VARCHAR(100) UNIQUE NOT NULL,
  deskripsi     TEXT NOT NULL DEFAULT ''
);

-- Barang / stok
CREATE TABLE IF NOT EXISTS barang (
  id           SERIAL PRIMARY KEY,
  kode_barang  VARCHAR(20)  UNIQUE NOT NULL,
  nama_barang  VARCHAR(150) NOT NULL,
  kategori_id  INT          REFERENCES kategori(id) ON DELETE SET NULL,
  harga        NUMERIC(12)  NOT NULL DEFAULT 0 CHECK (harga >= 0),
  stok         INT          NOT NULL DEFAULT 0 CHECK (stok >= 0),
  stok_minimum INT          NOT NULL DEFAULT 10,
  satuan       VARCHAR(20)  NOT NULL DEFAULT 'pcs',
  deskripsi    TEXT         NOT NULL DEFAULT '',
  gambar       TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'aktif',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Transaksi penjualan.
-- Alur status: menunggu_pembayaran -> menunggu_verifikasi -> lunas / ditolak.
-- Transaksi kasir (Tunai) langsung berstatus 'lunas'.
CREATE TABLE IF NOT EXISTS transactions (
  id                SERIAL PRIMARY KEY,
  no_faktur         VARCHAR(30) UNIQUE NOT NULL,
  user_id           INT REFERENCES users(id) ON DELETE SET NULL,  -- pembeli (checkout online)
  kasir_id          INT REFERENCES users(id) ON DELETE SET NULL,  -- admin yang menginput (kasir)
  tanggal           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_item        INT         NOT NULL DEFAULT 0,
  total_harga       NUMERIC(14) NOT NULL DEFAULT 0,
  metode_pembayaran VARCHAR(20) NOT NULL DEFAULT 'Tunai',          -- Tunai | QRIS
  status            VARCHAR(30) NOT NULL DEFAULT 'menunggu_pembayaran'
                    CHECK (status IN ('menunggu_pembayaran', 'menunggu_verifikasi',
                                      'lunas', 'ditolak', 'dibatalkan')),
  catatan           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item per transaksi (satu transaksi punya banyak item)
CREATE TABLE IF NOT EXISTS transaction_items (
  id             SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  barang_id      INT REFERENCES barang(id) ON DELETE SET NULL,
  nama_barang    VARCHAR(150) NOT NULL,   -- snapshot nama saat transaksi
  harga_satuan   NUMERIC(12)  NOT NULL,   -- snapshot harga saat transaksi
  jumlah         INT          NOT NULL CHECK (jumlah > 0),
  subtotal       NUMERIC(14)  NOT NULL
);

-- Pembayaran (satu transaksi punya satu pembayaran)
CREATE TABLE IF NOT EXISTS payments (
  id               SERIAL PRIMARY KEY,
  transaction_id   INT UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  metode           VARCHAR(20) NOT NULL DEFAULT 'QRIS',
  jumlah           NUMERIC(14) NOT NULL,
  status           VARCHAR(30) NOT NULL DEFAULT 'menunggu_pembayaran'
                   CHECK (status IN ('menunggu_pembayaran', 'menunggu_verifikasi',
                                     'lunas', 'ditolak', 'dibatalkan')),
  verified_by      INT REFERENCES users(id) ON DELETE SET NULL,   -- admin yang memverifikasi
  verified_at      TIMESTAMPTZ,
  alasan_penolakan TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bukti pembayaran (gambar yang diunggah pembeli)
CREATE TABLE IF NOT EXISTS payment_proofs (
  id          SERIAL PRIMARY KEY,
  payment_id  INT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  file_name   TEXT,
  file_size   INT,
  mime_type   VARCHAR(50),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pengaturan toko (key-value), termasuk gambar QRIS
CREATE TABLE IF NOT EXISTS settings (
  key   VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Knowledge base untuk chatbot RAG (FAQ, profil toko, kebijakan, dll.)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id         SERIAL PRIMARY KEY,
  kategori   VARCHAR(50)  NOT NULL,    -- faq | profil | kebijakan | operasional
  judul      VARCHAR(200) NOT NULL,
  konten     TEXT         NOT NULL,
  kata_kunci TEXT         NOT NULL DEFAULT '',  -- kata kunci retrieval, dipisah koma
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Riwayat percakapan chatbot
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE SET NULL,
  pertanyaan TEXT NOT NULL,
  jawaban    TEXT NOT NULL,
  sumber     TEXT,                     -- ringkasan konteks yang dipakai menjawab
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa pencarian & laporan
CREATE INDEX IF NOT EXISTS idx_barang_nama          ON barang (LOWER(nama_barang));
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions (tanggal);
CREATE INDEX IF NOT EXISTS idx_transactions_status  ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_items_transaction    ON transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments (status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires     ON sessions (expires_at);
