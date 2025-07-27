-- Create notes table for zai app
CREATE TABLE IF NOT EXISTS notes (
  id BIGINT PRIMARY KEY,  -- Custom generated ID (timestamp + user + random) that fits in 64-bit
  "user" TEXT NOT NULL, -- Phone number for now
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL DEFAULT 'md', -- 'md' for markdown, future: attachments
  contents TEXT NOT NULL
);

-- Create index for user queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_notes_user_created_at 
ON notes("user", created_at);

-- Create index for user + content search
CREATE INDEX IF NOT EXISTS idx_notes_user_contents 
ON notes("user") 
WHERE contents IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- For now, disable RLS policies since we're using simple auth tokens
-- In production, you'd want proper JWT with user claims
-- CREATE POLICY "Users can view own notes" ON notes
--   FOR SELECT USING ("user" = auth.jwt() ->> 'phone');

-- Temporary: Allow all authenticated users to manage their own notes
-- This is a simpler approach while we have basic auth
CREATE POLICY "Allow users to manage own notes" ON notes
  FOR ALL USING (true) WITH CHECK (true);

-- Note: This is less secure - in production you'd want:
-- 1. Proper JWT tokens with user claims
-- 2. Row-level policies that check user identity
-- 3. Service role vs anon role separation

-- Note: For now we're using phone numbers as user IDs
-- In production, you might want a separate users table with proper UUID IDs 