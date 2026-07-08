-- =============================================================
-- Migration 004: Semantic search untuk produk (barang)
-- Sebelumnya hanya knowledge_base yang punya embedding (lihat migration 002);
-- pencarian produk masih 100% keyword (ILIKE), jadi tidak paham sinonim
-- (mis. "alat buat gambar" tidak akan menemukan "Pensil warna" atau
-- "Cat air & kuas" kalau nama produknya tidak literally mengandung "gambar").
-- Kolom ini diisi otomatis saat barang ditambah/diedit (lihat
-- app/api/barang/route.ts) atau lewat `npm run db:embed`.
-- =============================================================

ALTER TABLE barang ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_barang_embedding
  ON barang USING hnsw (embedding vector_cosine_ops);
