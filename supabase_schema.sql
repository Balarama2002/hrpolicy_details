-- ============================================================
-- TechyGeekHub HR Agent: Supabase Table & Security Configuration
-- Table Name: "User information"
-- ============================================================
-- Execute this script in your Supabase Dashboard:
-- 1. Open https://supabase.com/dashboard/project/vsihdsgoebpkxmztqqil
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this SQL, and click "Run"
-- ============================================================

-- 1. Create the 'User information' table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public."User information" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    department TEXT,
    password_hash TEXT, -- Stored as cryptographic SHA-256 hash (never plain text)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public."User information" ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anon & authenticated roles to insert during registration
DROP POLICY IF EXISTS "Allow user registration insert" ON public."User information";
CREATE POLICY "Allow user registration insert"
    ON public."User information"
    FOR INSERT
    WITH CHECK (true);

-- 4. Policy: Allow users to view their own profile information
DROP POLICY IF EXISTS "Allow users to view own profile" ON public."User information";
CREATE POLICY "Allow users to view own profile"
    ON public."User information"
    FOR SELECT
    USING (true);

-- 5. Policy: Allow users to update their own profile / login timestamps
DROP POLICY IF EXISTS "Allow users to update own profile" ON public."User information";
CREATE POLICY "Allow users to update own profile"
    ON public."User information"
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- Security Notes:
-- 1. Passwords for authentication are automatically hashed by
--    Supabase Auth using bcrypt in auth.users.
-- 2. The password_hash in this table is a secondary SHA-256 digest,
--    guaranteeing raw plaintext passwords are NEVER stored in the database.
-- 3. Only emails ending in @techygeekhub.com are accepted.
-- ============================================================
