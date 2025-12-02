import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpgradeRequestPayload {
  userName: string | null;
  userEmail: string;
  userId: string;
  message: string | null;
  interestedFeatures: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail, userId, message, interestedFeatures }: UpgradeRequestPayload = await req.json();

    console.log("Processing upgrade request from:", userEmail);

    const featuresHtml = interestedFeatures
      .map((feature) => `<li style="padding: 4px 0;">${feature}</li>`)
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #e5e5e5; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; padding: 32px; border: 1px solid #262626;">
          <h1 style="color: #22d3ee; margin: 0 0 24px 0; font-size: 24px;">🚀 New Premium Upgrade Request</h1>
          
          <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px;">User Details</h2>
            <p style="margin: 8px 0; color: #a3a3a3;"><strong style="color: #ffffff;">Name:</strong> ${userName || "Not provided"}</p>
            <p style="margin: 8px 0; color: #a3a3a3;"><strong style="color: #ffffff;">Email:</strong> ${userEmail}</p>
            <p style="margin: 8px 0; color: #a3a3a3;"><strong style="color: #ffffff;">User ID:</strong> ${userId}</p>
          </div>

          <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px;">Interested Features</h2>
            <ul style="margin: 0; padding-left: 20px; color: #22d3ee;">
              ${featuresHtml}
            </ul>
          </div>

          ${message ? `
          <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px;">Message</h2>
            <p style="margin: 0; color: #a3a3a3; white-space: pre-wrap;">${message}</p>
          </div>
          ` : ""}

          <p style="color: #737373; font-size: 12px; margin: 24px 0 0 0; text-align: center;">
            Sent from GenerAI Fit
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "GenerAI Fit <workouts@generaifit.com>",
      to: ["zkeslami@gmail.com"],
      subject: `🚀 New Premium Upgrade Request - ${userName || userEmail}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-upgrade-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);