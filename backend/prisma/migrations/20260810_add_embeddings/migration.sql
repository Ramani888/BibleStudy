-- Extension created manually as superuser (app user lacks CREATE EXTENSION privilege)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns (nullable so existing rows are unaffected)
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS embedding vector(512);
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS embedding vector(512);

-- HNSW index for fast cosine similarity search on Card embeddings
CREATE INDEX IF NOT EXISTS card_embedding_idx ON "Card" USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS note_embedding_idx ON "Note" USING hnsw (embedding vector_cosine_ops);
