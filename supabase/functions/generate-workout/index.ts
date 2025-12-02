import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetMuscles, workoutType, duration, userGoal, equipment } = await req.json();

    console.log('Generating workout with params:', { targetMuscles, workoutType, duration, userGoal, equipment });

    const equipmentConstraint = equipment && equipment.length > 0
      ? `\n\nIMPORTANT: Only use exercises that require this available equipment: ${equipment.join(', ')}. Do NOT include exercises requiring equipment not listed.`
      : '';

    const systemPrompt = `You are a professional fitness trainer creating structured workout plans. 
Always return a valid JSON object with this exact structure:
{
  "title": "string - creative workout name",
  "type": "string - workout type (e.g., strength, cardio, HIIT)",
  "duration_minutes": number,
  "sections": [
    {
      "title": "Warm-up" | "Workout" | "Cool-down",
      "exercises": [
        { "name": "string - exercise name", "details": "string - reps/duration/instructions" }
      ]
    }
  ]
}

Make the workout challenging but achievable. Include proper warm-up and cool-down sections.${equipmentConstraint}`;

    const userPrompt = `Create a ${duration}-minute ${workoutType} workout targeting ${targetMuscles.join(', ')}. 
User's fitness goal: ${userGoal || 'general fitness'}.
Use current fitness trends and proven exercise science. Make it engaging and effective.`;

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
    console.log('AI response:', JSON.stringify(data, null, 2));

    const generatedText = data.choices?.[0]?.message?.content;
    if (!generatedText) {
      throw new Error('No content in AI response');
    }

    let workout;
    try {
      workout = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedText);
      throw new Error('Invalid JSON from AI');
    }

    // Validate the structure
    if (!workout.title || !workout.sections || !Array.isArray(workout.sections)) {
      console.error('Invalid workout structure:', workout);
      throw new Error('Invalid workout structure from AI');
    }

    return new Response(JSON.stringify({ workout }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-workout:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check function logs for more information'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
