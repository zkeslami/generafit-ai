-- Add personal details to user_profiles for calorie estimation
ALTER TABLE public.user_profiles 
ADD COLUMN weight_kg numeric,
ADD COLUMN height_cm numeric,
ADD COLUMN birth_year integer,
ADD COLUMN gender text;

-- Add is_favorite column to workouts
ALTER TABLE public.workouts 
ADD COLUMN is_favorite boolean DEFAULT false;