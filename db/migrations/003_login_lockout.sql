-- =============================================================
-- Migration 003: Proteksi brute-force login
-- Menambahkan penghitung percobaan gagal & waktu kunci sementara
-- pada akun (dicek/diupdate di app/api/auth/login/route.ts).
-- =============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
