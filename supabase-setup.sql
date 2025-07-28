-- =====================================================
-- Timeline Notes - Complete Supabase Setup
-- Run this script in your fresh Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DOCUMENTS TABLE FOR Y.JS COLLABORATION
-- =====================================================

-- Create documents table for storing Y.js document states
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ydoc_state BYTEA, -- Y.js document state as binary data
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique document names per user
    CONSTRAINT unique_user_document UNIQUE (owner_id, name)
);

-- Add helpful comments
COMMENT ON TABLE public.documents IS 'Stores Y.js document states for collaborative editing';
COMMENT ON COLUMN public.documents.ydoc_state IS 'Binary Y.js document state for CRDT collaboration';
COMMENT ON COLUMN public.documents.name IS 'Document name (e.g., "timeline-notes")';
COMMENT ON COLUMN public.documents.owner_id IS 'User who owns this document';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for fast user document lookups
CREATE INDEX idx_documents_owner_name ON public.documents(owner_id, name);

-- Index for recently updated documents
CREATE INDEX idx_documents_updated ON public.documents(last_updated DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own documents
CREATE POLICY "Users can view own documents" 
ON public.documents FOR SELECT 
USING (auth.uid() = owner_id);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can create own documents" 
ON public.documents FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents" 
ON public.documents FOR UPDATE 
USING (auth.uid() = owner_id);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents" 
ON public.documents FOR DELETE 
USING (auth.uid() = owner_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_updated on document changes
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON public.documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- REALTIME SETUP
-- =====================================================

-- Enable realtime for the documents table (for collaboration)
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- =====================================================
-- OPTIONAL: USER PROFILES TABLE
-- =====================================================

-- Create user profiles table (optional, for storing additional user info)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    phone TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, phone, display_name)
    VALUES (
        NEW.id, 
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'User')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION & TESTING
-- =====================================================

-- Grant necessary permissions (should already be set by default)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Your Supabase database is now ready for Timeline Notes!
-- 
-- Next steps:
-- 1. Go to Authentication > Providers > Enable Phone
-- 2. Configure Twilio for SMS (in Phone provider settings)
-- 3. Go to Database > Replication > Enable Realtime for 'documents' table
-- 4. Add your Supabase URL and anon key to your .env file (using VITE_ prefix)
-- 
-- Tables created:
-- - documents: Stores Y.js collaborative document states
-- - profiles: Stores user profile information
-- 
-- Features enabled:
-- - Row Level Security (RLS) for data isolation
-- - Realtime subscriptions for collaboration
-- - Automatic timestamp updates
-- - Phone authentication support 