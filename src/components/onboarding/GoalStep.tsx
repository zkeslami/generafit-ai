import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface GoalStepProps {
  goalCategory: string;
  selectedExample: string;
  customGoal: string;
  onGoalCategoryChange: (category: string) => void;
  onSelectedExampleChange: (example: string) => void;
  onCustomGoalChange: (goal: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const GOAL_CATEGORIES = [
  {
    value: "athletic_performance",
    label: "Athletic Performance",
    emoji: "🏃",
    examples: [
      "Run a sub 3-hour marathon",
      "Complete my first triathlon",
      "Improve my 5K time by 5 minutes"
    ]
  },
  {
    value: "endurance",
    label: "Endurance",
    emoji: "💪",
    examples: [
      "Complete a 100-mile bike ride",
      "Swim 1 mile without stopping",
      "Run for 60 minutes continuously"
    ]
  },
  {
    value: "strength",
    label: "Strength",
    emoji: "🏋️",
    examples: [
      "Bench press my body weight",
      "Do 10 pull-ups",
      "Deadlift 2x my body weight"
    ]
  },
  {
    value: "flexibility",
    label: "Flexibility",
    emoji: "🧘",
    examples: [
      "Touch my toes comfortably",
      "Do a full split",
      "Complete a 30-day yoga challenge"
    ]
  },
  {
    value: "body_composition",
    label: "Body Composition",
    emoji: "⚖️",
    examples: [
      "Lose 20 pounds",
      "Gain 10 pounds of muscle",
      "Reduce body fat to 15%"
    ]
  },
  {
    value: "custom",
    label: "Custom Goal",
    emoji: "✨",
    examples: []
  }
];

export const GoalStep = ({
  goalCategory,
  selectedExample,
  customGoal,
  onGoalCategoryChange,
  onSelectedExampleChange,
  onCustomGoalChange,
  onNext,
  onBack
}: GoalStepProps) => {
  const selectedCategoryData = GOAL_CATEGORIES.find(c => c.value === goalCategory);

  const canProceed = goalCategory && (
    goalCategory === "custom" ? customGoal.trim() : selectedExample
  );

  return (
    <div className="flex flex-col min-h-[60vh] px-4 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">What's Your Fitness Goal?</h2>
        <p className="text-muted-foreground">
          This helps us create workouts tailored to YOUR goals
        </p>
      </div>

      <RadioGroup
        value={goalCategory}
        onValueChange={(value) => {
          onGoalCategoryChange(value);
          onSelectedExampleChange("");
        }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6"
      >
        {GOAL_CATEGORIES.map((category) => (
          <div key={category.value}>
            <RadioGroupItem
              value={category.value}
              id={category.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={category.value}
              className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-muted bg-card cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
            >
              <span className="text-2xl mb-2">{category.emoji}</span>
              <span className="font-medium text-sm text-center">{category.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {goalCategory && goalCategory !== "custom" && selectedCategoryData?.examples.length > 0 && (
        <div className="mb-6 animate-fade-in">
          <Label className="mb-3 block">Select a specific goal:</Label>
          <RadioGroup
            value={selectedExample}
            onValueChange={onSelectedExampleChange}
            className="space-y-2"
          >
            {selectedCategoryData.examples.map((example) => (
              <div key={example} className="flex items-center">
                <RadioGroupItem
                  value={example}
                  id={example}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={example}
                  className="flex-1 p-3 rounded-lg border border-muted bg-card cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                >
                  {example}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {goalCategory === "custom" && (
        <div className="mb-6 animate-fade-in">
          <Label htmlFor="customGoal" className="mb-2 block">
            Describe your fitness goal:
          </Label>
          <Input
            id="customGoal"
            placeholder="e.g., Complete an obstacle course race"
            value={customGoal}
            onChange={(e) => onCustomGoalChange(e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-between mt-auto pt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
