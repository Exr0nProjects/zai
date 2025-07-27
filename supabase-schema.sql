-- Create notes table for zai app with Supabase Auth integration
CREATE TABLE IF NOT EXISTS notes (
  id BIGINT PRIMARY KEY,  -- Custom generated ID (timestamp + user + random) that fits in 64-bit
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Supabase auth user ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL DEFAULT 'md', -- 'md' for markdown, future: attachments
  contents TEXT NOT NULL
);

-- Create index for user queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_notes_user_created_at 
ON notes(user_id, created_at);

-- Create index for user + content search
CREATE INDEX IF NOT EXISTS idx_notes_user_contents 
ON notes(user_id) 
WHERE contents IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own notes using proper Supabase auth
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Note: This uses proper Supabase JWT tokens with auth.uid()
-- No need for complex policies - auth.uid() automatically gets user ID from JWT

-- Note: For now we're using phone numbers as user IDs
-- In production, you might want a separate users table with proper UUID IDs 