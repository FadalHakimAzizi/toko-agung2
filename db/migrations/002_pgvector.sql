-- =============================================================
-- Migration 002: pgvector untuk RAG semantic search
-- Menambahkan kolom embedding pada knowledge_base agar chatbot bisa
-- mencari konteks berdasarkan MAKNA (bukan sekadar kecocokan kata kunci).
-- Dimensi 768 mengikuti model Google text-embedding-004.
-- =============================================================

-- Aktifkan ekstensi pgvector (tersedia di Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Kolom vektor embedding (nullable; diisi oleh script db:embed)
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Index HNSW dengan cosine distance untuk pencarian kemiripan yang cepat
CREATE INDEX IF NOT EXISTS idx_kb_embedding
  ON knowledge_base USING hnsw (embedding vector_cosine_ops);
