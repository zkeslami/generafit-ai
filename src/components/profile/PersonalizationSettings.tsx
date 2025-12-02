import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Target } from "lucide-react";

interface PersonalizationSettingsProps {
  profile: any;
  onUpdate: () => void;
}

const GOAL_CATEGORIES = [
  { value: "athletic_performance", label: "Athletic Performance", emoji: "🏃" },
  { value: "endurance", label: "Endurance", emoji: "🚴" },
  { value: "strength", label: "Strength", emoji: "💪" },
  { value: "flexibility", label: "Flexibility", emoji: "🧘" },
  { value: "body_composition", label: "Body Composition", emoji: "⚖️" },
];

export function PersonalizationSettings({ profile, onUpdate }: PersonalizationSettingsProps) {
  const [goalCategory, setGoalCategory] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setGoalCategory(profile.goal_category || profile.primary_goal || "");
      setCustomGoal(profile.custom_goal || "");
      setWeeklyGoal(profile.weekly_workout_goal || 3);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!goalCategory) {
      toast.error("Please select a fitness goal");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          goal_category: goalCategory,
          primary_goal: goalCategory,
          custom_goal: customGoal || null,
          weekly_workout_goal: weeklyGoal,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Personalization saved");
      onUpdate();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Personalization</h2>
        <p className="text-muted-foreground">Customize your fitness journey</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Fitness Goal
          </CardTitle>
          <CardDescription>What are you working towards?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={goalCategory} onValueChange={setGoalCategory}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOAL_CATEGORIES.map((category) => (
                <div key={category.value}>
                  <RadioGroupItem
                    value={category.value}
                    id={category.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={category.value}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer transition-colors hover:bg-secondary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                  >
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="font-medium">{category.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="customGoal">Custom Goal (Optional)</Label>
            <Input
              id="customGoal"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g., Run a marathon by June"
            />
            <p className="text-xs text-muted-foreground">
              Add specifics to personalize your workout suggestions
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Workout Goal</CardTitle>
          <CardDescription>How many workouts per week do you want to complete?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">1 workout</span>
              <span className="text-2xl font-bold text-primary">{weeklyGoal}</span>
              <span className="text-sm text-muted-foreground">7 workouts</span>
            </div>
            <Slider
              value={[weeklyGoal]}
              onValueChange={(value) => setWeeklyGoal(value[0])}
              min={1}
              max={7}
              step={1}
            />
            <p className="text-sm text-muted-foreground text-center">
              {weeklyGoal === 1 && "Start slow and build consistency"}
              {weeklyGoal === 2 && "Great for maintaining fitness"}
              {weeklyGoal === 3 && "Perfect for steady progress"}
              {weeklyGoal === 4 && "Serious commitment to gains"}
              {weeklyGoal === 5 && "High dedication level"}
              {weeklyGoal === 6 && "Elite training frequency"}
              {weeklyGoal === 7 && "Maximum dedication!"}
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Personalization"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}