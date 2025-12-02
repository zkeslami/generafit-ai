import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MET values for different workout types (Metabolic Equivalent of Task)
const MET_VALUES: Record<string, number> = {
  "Strength Training": 5.0,
  "Strength": 5.0,
  "Cardio": 7.0,
  "HIIT": 8.0,
  "Yoga": 3.0,
  "Calisthenics": 5.5,
  "Circuit Training": 6.5,
  "Full Body": 5.5,
  "Upper Body": 5.0,
  "Lower Body": 5.5,
};

function calculateCalories(workoutType: string, durationMinutes: number, weightKg?: number, age?: number, gender?: string): number {
  // Find the best matching MET value
  let met = 5.0;
  const typeUpper = workoutType.toUpperCase();
  for (const [key, value] of Object.entries(MET_VALUES)) {
    if (typeUpper.includes(key.toUpperCase())) {
      met = value;
      break;
    }
  }
  
  const weight = weightKg || 70;
  let calories = met * weight * (durationMinutes / 60);
  
  if (age) {
    if (age > 40) calories *= 0.95;
    if (age > 50) calories *= 0.90;
    if (age > 60) calories *= 0.85;
  }
  
  if (gender === 'female') {
    calories *= 0.9;
  }
  
  return Math.round(calories);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Fetching data for user:', user.id);

    // Get user's profile including personal details
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('primary_goal, weight_kg, height_cm, birth_year, gender')
      .eq('id', user.id)
      .single();

    // Get last 3 workouts with feedback
    const { data: recentWorkouts } = await supabase
      .from('workouts')
      .select('feedback, difficulty, type, duration_minutes')
      .eq('user_id', user.id)
      .not('feedback', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    const userGoal = profile?.primary_goal || 'general fitness';
    const workoutHistory = recentWorkouts || [];

    console.log('User goal:', userGoal);
    console.log('Recent workouts:', workoutHistory.length);

    const systemPrompt = `You are a professional fitness trainer creating personalized workout suggestions.
Return a valid JSON object with this structure:
{
  "title": "string - engaging workout name",
  "type": "string - workout type",
  "duration_minutes": number,
  "rationale": "string - why this workout is perfect for the user today (2-3 sentences)",
  "sections": [
    {
      "title": "Warm-up" | "Main Workout" | "Cool-down",
      "exercises": [
        { 
          "name": "string - exercise name", 
          "details": "string - sets x reps or duration",
          "category": "strength" | "cardio" | "flexibility" | "plyometric" | "core" | "balance",
          "muscle_group": "string - primary muscle worked"
        }
      ]
    }
  ]
}

IMPORTANT: Include category and muscle_group for EVERY exercise.`;

    const userPrompt = `Create a personalized workout suggestion based on:
- User's goal: ${userGoal}
- Recent workout history: ${workoutHistory.length > 0 ? JSON.stringify(workoutHistory) : 'No previous workouts'}

Consider their feedback and difficulty ratings to adjust intensity. Make it fresh and motivating.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('No content in AI response');
    }

    const workout = JSON.parse(generatedText);

    // Calculate estimated calories
    const age = profile?.birth_year ? new Date().getFullYear() - profile.birth_year : undefined;
    const estimatedCalories = calculateCalories(
      workout.type || 'General',
      workout.duration_minutes || 30,
      profile?.weight_kg,
      age,
      profile?.gender
    );

    workout.estimated_calories = estimatedCalories;

    return new Response(JSON.stringify({ workout }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-workout:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
