import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoalSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

const GOAL_CATEGORIES = [
  {
    value: "athletic_performance",
    label: "Athletic Performance",
    emoji: "🏀",
    examples: ["Dunk a basketball", "Improve vertical jump 6 inches", "Run faster 40-yard dash"],
  },
  {
    value: "endurance",
    label: "Endurance",
    emoji: "🏃",
    examples: ["Run a sub 3-hour marathon", "Complete a 5K", "Finish a triathlon"],
  },
  {
    value: "strength",
    label: "Strength",
    emoji: "💪",
    examples: ["Bench press 225 lbs", "Do 10 pull-ups", "Deadlift 2x bodyweight"],
  },
  {
    value: "flexibility",
    label: "Flexibility & Wellness",
    emoji: "🧘",
    examples: ["Touch my toes", "Do the splits", "Hold a handstand"],
  },
  {
    value: "body_composition",
    label: "Body Composition",
    emoji: "🎯",
    examples: ["Lose 20 pounds", "Get visible abs", "Gain 10 lbs muscle"],
  },
  {
    value: "general_fitness",
    label: "General Fitness",
    emoji: "⚡",
    examples: ["Feel more energetic", "Build healthy habits", "Get in shape"],
  },
];

export const GoalSetupModal = ({ open, onComplete }: GoalSetupModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedExample, setSelectedExample] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [saving, setSaving] = useState(false);

  const currentCategory = GOAL_CATEGORIES.find(c => c.value === selectedCategory);

  const handleSave = async () => {
    if (!selectedCategory) {
      toast.error("Please select a goal category");
      return;
    }

    const finalGoal = customGoal || selectedExample;
    if (!finalGoal) {
      toast.error("Please select or enter a goal");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          primary_goal: selectedCategory,
          goal_category: selectedCategory,
          custom_goal: finalGoal,
        });

      if (error) throw error;

      toast.success("Your fitness goal has been set!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving goal:", error);
      toast.error(error.message || "Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Smart Fitness!</DialogTitle>
          <DialogDescription className="text-base">
            What's your fitness goal? This helps us create personalized workouts just for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Choose a category:</Label>
            <RadioGroup value={selectedCategory} onValueChange={(val) => {
              setSelectedCategory(val);
              setSelectedExample("");
              setCustomGoal("");
            }}>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_CATEGORIES.map((category) => (
                  <div
                    key={category.value}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-base cursor-pointer ${
                      selectedCategory === category.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-secondary/50"
                    }`}
                    onClick={() => {
                      setSelectedCategory(category.value);
                      setSelectedExample("");
                      setCustomGoal("");
                    }}
                  >
                    <RadioGroupItem value={category.value} id={category.value} />
                    <Label
                      htmlFor={category.value}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <span className="text-xl">{category.emoji}</span>
                      <span className="text-sm">{category.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Example Goals */}
          {currentCategory && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select a goal or write your own:</Label>
              <div className="space-y-2">
                {currentCategory.examples.map((example) => (
                  <div
                    key={example}
                    className={`p-3 rounded-lg border cursor-pointer transition-base ${
                      selectedExample === example && !customGoal
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-secondary/50"
                    }`}
                    onClick={() => {
                      setSelectedExample(example);
                      setCustomGoal("");
                    }}
                  >
                    <span className="text-sm">{example}</span>
                  </div>
                ))}
              </div>

              {/* Custom Goal Input */}
              <div className="pt-2">
                <Input
                  value={customGoal}
                  onChange={(e) => {
                    setCustomGoal(e.target.value);
                    if (e.target.value) setSelectedExample("");
                  }}
                  placeholder="Or type your own goal..."
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !selectedCategory || (!selectedExample && !customGoal)}
          size="lg"
          className="w-full"
        >
          {saving ? "Saving..." : "Set My Goal"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
