import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Check, Sparkles, Music, BarChart3, Target, Zap, Mail, FileText } from "lucide-react";

interface SubscriptionSettingsProps {
  user: any;
  profile: any;
}

const FREE_FEATURES = [
  { icon: Zap, label: "AI workout generation" },
  { icon: Check, label: "Workout logging & history" },
  { icon: Target, label: "Weekly goal tracking" },
  { icon: Mail, label: "Daily email suggestions" },
  { icon: Check, label: "Favorite workouts" },
  { icon: Check, label: "Workout calendar" },
];

const PREMIUM_FEATURES = [
  { id: "spotify", icon: Music, label: "Spotify Playlist Recommendations", description: "AI-curated playlists based on workout type" },
  { id: "analytics", icon: BarChart3, label: "Advanced Analytics", description: "Detailed progress charts & trends" },
  { id: "programs", icon: Target, label: "Custom AI Training Programs", description: "Multi-week structured plans" },
  { id: "priority", icon: Zap, label: "Priority AI Generation", description: "Faster response times" },
  { id: "schedule", icon: Mail, label: "Flexible Email Schedules", description: "Choose your notification time" },
  { id: "reports", icon: FileText, label: "Detailed Progress Reports", description: "Weekly/monthly summaries" },
];

export function SubscriptionSettings({ user, profile }: SubscriptionSettingsProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentTier = profile?.subscription_tier || "free";

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (selectedFeatures.length === 0) {
      toast.error("Please select at least one feature you're interested in");
      return;
    }

    setSubmitting(true);
    try {
      // Save to database
      const { error: dbError } = await supabase
        .from("upgrade_requests")
        .insert({
          user_id: user.id,
          user_email: email,
          user_name: name || null,
          message: message || null,
          interested_features: selectedFeatures,
        });

      if (dbError) throw dbError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke("send-upgrade-request", {
        body: {
          userName: name,
          userEmail: email,
          userId: user.id,
          message,
          interestedFeatures: selectedFeatures.map(
            (id) => PREMIUM_FEATURES.find((f) => f.id === id)?.label || id
          ),
        },
      });

      if (emailError) {
        console.error("Email error:", emailError);
        // Don't throw - the request was saved
      }

      toast.success("Request submitted! We'll notify you when Premium is available.");
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription</h2>
        <p className="text-muted-foreground">Manage your plan and features</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {currentTier === "premium" ? "Premium" : "Free"}
            </Badge>
            {currentTier === "free" && (
              <span className="text-sm text-muted-foreground">
                Upgrade to unlock premium features
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Free Features</CardTitle>
            <CardDescription>What you have now</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {FREE_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Premium Features */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Premium Features
            </CardTitle>
            <CardDescription>$5/month - Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Request Form */}
      {currentTier === "free" && !submitted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Request Premium Access
            </CardTitle>
            <CardDescription>
              Be the first to know when Premium launches and help shape the features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Which features interest you most?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PREMIUM_FEATURES.map((feature) => (
                  <label
                    key={feature.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedFeatures.includes(feature.id)}
                      onCheckedChange={() => toggleFeature(feature.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium">{feature.label}</span>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about features you'd like to see..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Submitting..." : "Request Premium Access"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {submitted && (
        <Card className="border-primary/30">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Thanks for your interest!</h3>
            <p className="text-muted-foreground">
              We'll notify you at <span className="font-medium">{email}</span> when Premium is available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}