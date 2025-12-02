import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MET_VALUES: Record<string, number> = {
  'Strength Training': 5.0,
  'Cardio': 7.0,
  'HIIT': 8.0,
  'Yoga': 3.0,
  'Calisthenics': 4.5,
  'Circuit Training': 6.0,
  'default': 5.0,
};

function calculateCalories(workoutType: string, durationMinutes: number, weightKg?: number): number {
  const met = MET_VALUES[workoutType] || MET_VALUES['default'];
  const weight = weightKg || 70;
  return Math.round((met * weight * durationMinutes) / 60);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a test request
    const body = await req.json().catch(() => ({}));
    const { testMode, userId, testEmail } = body;

    let usersToNotify: any[] = [];

    if (testMode && userId) {
      // Test mode - send to specific user
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile) {
        usersToNotify = [{
          ...profile,
          notification_email: testEmail,
          auth_email: testEmail,
        }];
      }
    } else {
      // Production mode - get all users with notifications enabled
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email_notifications", true);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Get auth emails for users
      for (const profile of profiles || []) {
        const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
        if (authData?.user?.email) {
          usersToNotify.push({
            ...profile,
            auth_email: authData.user.email,
          });
        }
      }
    }

    console.log(`Processing ${usersToNotify.length} users for daily workout emails`);

    const results = [];

    for (const user of usersToNotify) {
      try {
        const targetEmail = user.notification_email || user.auth_email;
        if (!targetEmail) {
          console.log(`No email for user ${user.id}, skipping`);
          continue;
        }

        // Fetch user's equipment
        const { data: equipmentData } = await supabase
          .from("user_equipment")
          .select("equipment_list")
          .eq("user_id", user.id)
          .single();

        // Fetch recent workouts for context
        const { data: recentWorkouts } = await supabase
          .from("workouts")
          .select("type, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        // Generate workout suggestion using Lovable AI
        const systemPrompt = `You are a fitness coach creating a personalized daily workout suggestion. Create a workout that:
- Is varied from recent workouts to prevent plateaus
- Considers the user's goals and available equipment
- Is achievable and motivating
- Takes about 30-45 minutes

Return ONLY valid JSON with this structure:
{
  "title": "Workout Name",
  "type": "Workout Type",
  "duration_minutes": 30,
  "rationale": "Why this workout is perfect for today",
  "sections": [
    {
      "name": "Warm-up",
      "exercises": [
        {"name": "Exercise", "duration": "30 seconds", "notes": "Optional tips"}
      ]
    }
  ]
}`;

        const userPrompt = `Create today's workout for:
- Goal: ${user.custom_goal || user.primary_goal || "General fitness"}
- Available equipment: ${equipmentData?.equipment_list ? JSON.stringify(equipmentData.equipment_list) : "Bodyweight only"}
- Recent workouts: ${recentWorkouts?.map(w => w.type).join(", ") || "None"}

Generate a balanced workout that complements their recent activity.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error("AI API error:", await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("No JSON found in AI response");
          continue;
        }

        const workout = JSON.parse(jsonMatch[0]);
        const estimatedCalories = calculateCalories(workout.type, workout.duration_minutes, user.weight_kg);

        // Get the app URL from environment or use default
        const appUrl = "https://oqbrlkrztinmyspsaxak.lovableproject.com";
        
        // Create email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #171717; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">
                🏋️ Your Daily Workout
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Good morning! Here's your personalized workout for today.
              </p>
            </td>
          </tr>
          
          <!-- Workout Details -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 20px; font-weight: 600;">
                ${workout.title}
              </h2>
              
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 16px; background-color: #262626; border-radius: 8px; margin-right: 8px;">
                    <span style="color: #a3a3a3; font-size: 12px;">Type</span><br>
                    <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${workout.type}</span>
                  </td>
                  <td width="8"></td>
                  <td style="padding: 8px 16px; background-color: #262626; border-radius: 8px; margin-right: 8px;">
                    <span style="color: #a3a3a3; font-size: 12px;">Duration</span><br>
                    <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${workout.duration_minutes} min</span>
                  </td>
                  <td width="8"></td>
                  <td style="padding: 8px 16px; background-color: #262626; border-radius: 8px;">
                    <span style="color: #a3a3a3; font-size: 12px;">Est. Calories</span><br>
                    <span style="color: #ffffff; font-size: 14px; font-weight: 500;">~${estimatedCalories} cal</span>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #262626; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #d4d4d4; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #0ea5e9;">Why this workout?</strong><br>
                  ${workout.rationale || "This workout is designed to help you reach your fitness goals with a balanced approach."}
                </p>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Go to Workout →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #262626;">
              <p style="margin: 0; color: #737373; font-size: 12px; text-align: center;">
                You're receiving this because you enabled daily workout notifications.<br>
                <a href="${appUrl}" style="color: #0ea5e9; text-decoration: none;">Update your preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        // Send email
        const { error: emailError } = await resend.emails.send({
          from: "Fitness Dashboard <onboarding@resend.dev>",
          to: [targetEmail],
          subject: `🏋️ Your Daily Workout: ${workout.title}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Email error for ${targetEmail}:`, emailError);
          continue;
        }

        // Log the notification (skip in test mode to avoid clutter)
        if (!testMode) {
          await supabase.from("notification_logs").insert({
            user_id: user.id,
            workout_data: workout,
            email_sent_to: targetEmail,
          });
        }

        console.log(`Email sent to ${targetEmail}`);
        results.push({ email: targetEmail, success: true });
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.push({ userId: user.id, success: false, error: String(userError) });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-daily-workout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
