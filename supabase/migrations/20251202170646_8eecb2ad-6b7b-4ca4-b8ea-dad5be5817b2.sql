-- Add columns to user_profiles for enhanced goals
ALTER TABLE user_profiles 
ADD COLUMN custom_goal text,
ADD COLUMN goal_category text,
ADD COLUMN target_date date;

-- Create equipment table
CREATE TABLE public.user_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  equipment_list jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_equipment
ALTER TABLE public.user_equipment ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_equipment
CREATE POLICY "Users can view own equipment"
ON public.user_equipment FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own equipment"
ON public.user_equipment FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipment"
ON public.user_equipment FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipment"
ON public.user_equipment FOR DELETE
USING (auth.uid() = user_id);

-- Add source column to workouts for manual vs generated
ALTER TABLE workouts 
ADD COLUMN source text DEFAULT 'generated';

-- Add trigger for updated_at on user_equipment
CREATE TRIGGER update_user_equipment_updated_at
BEFORE UPDATE ON public.user_equipment
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();