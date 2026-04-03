-- Add document_size column to track character count
ALTER TABLE sources ADD COLUMN IF NOT EXISTS document_size INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN sources.document_size IS 'Character count of the parsed document text';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sources_document_size ON sources(document_size);
