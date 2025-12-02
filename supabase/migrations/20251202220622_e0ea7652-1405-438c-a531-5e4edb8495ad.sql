-- Add new columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS preferred_unit_system text DEFAULT 'imperial',
ADD COLUMN IF NOT EXISTS nickname text;

-- Create upgrade_requests table
CREATE TABLE IF NOT EXISTS public.upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  message text,
  interested_features text[],
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Policy: users can insert their own requests
CREATE POLICY "Users can insert own upgrade requests" ON public.upgrade_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: users can view own requests
CREATE POLICY "Users can view own requests" ON public.upgrade_requests
  FOR SELECT USING (auth.uid() = user_id);