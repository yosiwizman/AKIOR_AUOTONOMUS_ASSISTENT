
-- Add conversation_id to memories table to link memories to conversations
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_memories_conversation_id ON memories(conversation_id);
