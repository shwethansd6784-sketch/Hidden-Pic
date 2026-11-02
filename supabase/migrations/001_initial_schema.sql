-- ==============================================================================
-- MY PHOTOS — HIDDEN PICS
-- Supabase Schema, Row Level Security (RLS) Policies & Storage Configuration
-- Version: 1.1 (Production-Verified, Idempotent & Hardened)
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  secret_code_enabled BOOLEAN DEFAULT true,
  passkey_enabled BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. ALBUMS TABLE
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own albums" ON public.albums;
CREATE POLICY "Users can view their own albums"
  ON public.albums FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own albums" ON public.albums;
CREATE POLICY "Users can create their own albums"
  ON public.albums FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own albums" ON public.albums;
CREATE POLICY "Users can update their own albums"
  ON public.albums FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own albums" ON public.albums;
CREATE POLICY "Users can delete their own albums"
  ON public.albums FOR DELETE
  USING (auth.uid() = user_id);

-- 3. PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT DEFAULT 'image/jpeg',
  caption TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own photos" ON public.photos;
CREATE POLICY "Users can view their own photos"
  ON public.photos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upload their own photos" ON public.photos;
CREATE POLICY "Users can upload their own photos"
  ON public.photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos;
CREATE POLICY "Users can update their own photos"
  ON public.photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos;
CREATE POLICY "Users can delete their own photos"
  ON public.photos FOR DELETE
  USING (auth.uid() = user_id);

-- 4. USER SESSIONS TABLE (For selective device tracking & revocation)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  device_type TEXT DEFAULT 'desktop',
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;
CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 5. SECURITY EVENTS TABLE (In-Account Instagram-Style Alerts)
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'new_device_login', 'session_revoked', 'password_changed', 'suspicious_attempt'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own security alerts" ON public.security_events;
CREATE POLICY "Users can view their own security alerts"
  ON public.security_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own security alerts" ON public.security_events;
CREATE POLICY "Users can update their own security alerts"
  ON public.security_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own security alerts" ON public.security_events;
CREATE POLICY "Users can insert their own security alerts"
  ON public.security_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own security alerts" ON public.security_events;
CREATE POLICY "Users can delete their own security alerts"
  ON public.security_events FOR DELETE
  USING (auth.uid() = user_id);

-- 6. FAILED LOGIN LOGS (Brute force & suspicious attempt protection)
CREATE TABLE IF NOT EXISTS public.failed_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.failed_login_logs ENABLE ROW LEVEL SECURITY;

-- Allow logging of failed attempts for rate-limiting
DROP POLICY IF EXISTS "Allow logging of failed attempts" ON public.failed_login_logs;
CREATE POLICY "Allow logging of failed attempts"
  ON public.failed_login_logs FOR INSERT
  WITH CHECK (true);

-- Users can only view failed attempts corresponding to their authenticated email
DROP POLICY IF EXISTS "Users can view failed attempts for their email" ON public.failed_login_logs;
CREATE POLICY "Users can view failed attempts for their email"
  ON public.failed_login_logs FOR SELECT
  USING (auth.jwt()->>'email' = email);

-- Helper function: Get recent failed attempts count (used by rate limiter)
CREATE OR REPLACE FUNCTION public.get_recent_failed_attempts(check_email TEXT)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*)::integer INTO v_count
  FROM public.failed_login_logs
  WHERE email = check_email
    AND created_at >= (now() - INTERVAL '15 minutes');
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. AUTOMATIC PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, secret_code_enabled, passkey_enabled)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. HELPER FUNCTION: SIGN OUT ALL OTHER SESSIONS
CREATE OR REPLACE FUNCTION public.sign_out_all_other_sessions(current_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false,
      revoked_at = now()
  WHERE user_id = auth.uid()
    AND session_token != current_token
    AND is_active = true;

  -- Create in-account security event
  INSERT INTO public.security_events (user_id, event_type, title, message, severity)
  VALUES (
    auth.uid(),
    'session_revoked',
    'All Other Devices Signed Out',
    'You signed out all other active sessions from this device.',
    'info'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. HELPER FUNCTION: REVOKE SINGLE SESSION
CREATE OR REPLACE FUNCTION public.revoke_user_session(target_session_id UUID)
RETURNS void AS $$
DECLARE
  v_device_name TEXT;
BEGIN
  SELECT device_name INTO v_device_name
  FROM public.user_sessions
  WHERE id = target_session_id AND user_id = auth.uid();

  UPDATE public.user_sessions
  SET is_active = false,
      revoked_at = now()
  WHERE id = target_session_id
    AND user_id = auth.uid();

  IF FOUND THEN
    INSERT INTO public.security_events (user_id, event_type, title, message, severity)
    VALUES (
      auth.uid(),
      'session_revoked',
      'Device Session Revoked',
      COALESCE('Access was revoked for ' || v_device_name || '.', 'A session was revoked.'),
      'warning'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. REALTIME CONFIGURATION (For instant revocation and alert notifications)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'security_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
  END IF;
END $$;

-- 11. STORAGE BUCKET CONFIGURATION (Private 'photos' Bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- STORAGE POLICIES: Users can only access objects inside their own folder: user_id/*
DROP POLICY IF EXISTS "Users can upload photos to their own folder" ON storage.objects;
CREATE POLICY "Users can upload photos to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view photos in their own folder" ON storage.objects;
CREATE POLICY "Users can view photos in their own folder"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update photos in their own folder" ON storage.objects;
CREATE POLICY "Users can update photos in their own folder"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete photos in their own folder" ON storage.objects;
CREATE POLICY "Users can delete photos in their own folder"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 12. INDEXES FOR SPEED AND INTEGRITY
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON public.photos(album_id);
CREATE INDEX IF NOT EXISTS idx_albums_user_id ON public.albums(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_failed_login_logs_email ON public.failed_login_logs(email, created_at);
