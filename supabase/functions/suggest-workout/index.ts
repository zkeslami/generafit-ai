import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get user's goal
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('primary_goal')
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