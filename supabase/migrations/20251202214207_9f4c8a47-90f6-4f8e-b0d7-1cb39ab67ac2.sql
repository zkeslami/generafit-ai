-- Add weekly goal and notification columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN weekly_workout_goal integer DEFAULT 3,
ADD COLUMN email_notifications boolean DEFAULT false,
ADD COLUMN notification_email text;

-- Create notification_logs table
CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  workout_data jsonb NOT NULL,
  email_sent_to text NOT NULL
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_logs
CREATE POLICY "Users can view own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (true);