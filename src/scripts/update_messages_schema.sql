-- Add missing columns to messages table for Conversation Engine compatibility
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS content TEXT;

-- Migration: Copy data from 'body' to 'content' for existing rows (optional but good for consistency)
UPDATE messages SET content = body WHERE content IS NULL AND body IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
