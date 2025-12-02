import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Target, User, Dumbbell } from "lucide-react";

interface CompletionStepProps {
  nickname: string;
  goalCategory: string;
  selectedExample: string;
  customGoal: string;
  equipmentCount: number;
  onGenerateWorkout: () => void;
  onExploreDashboard: () => void;
}

export const CompletionStep = ({
  nickname,
  goalCategory,
  selectedExample,
  customGoal,
  equipmentCount,
  onGenerateWorkout,
  onExploreDashboard
}: CompletionStepProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const displayGoal = customGoal || selectedExample || "Not set";
  const displayName = nickname || "there";

  const goalLabels: Record<string, string> = {
    athletic_performance: "Athletic Performance",
    endurance: "Endurance",
    strength: "Strength",
    flexibility: "Flexibility",
    body_composition: "Body Composition",
    custom: "Custom Goal"
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'][i % 5],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-scale-in">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>

      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
        You're All Set, {displayName}! 💪
      </h1>

      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Your personalized fitness journey starts now. Let's crush those goals together!
      </p>

      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="font-semibold mb-4 text-left">Your Setup Summary</h3>
        <div className="space-y-3">
          {nickname && (
            <div className="flex items-center gap-3 text-left">
              <User className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{nickname}</span>
            </div>
          )}
          {goalCategory && (
            <div className="flex items-center gap-3 text-left">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Goal:</span>
              <span className="font-medium">{goalLabels[goalCategory] || goalCategory}</span>
            </div>
          )}
          {displayGoal !== "Not set" && (
            <div className="flex items-start gap-3 text-left">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <span className="text-muted-foreground">Target:</span>
              <span className="font-medium flex-1">{displayGoal}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-left">
            <Dumbbell className="w-5 h-5 text-primary" />
            <span className="text-muted-foreground">Equipment:</span>
            <span className="font-medium">
              {equipmentCount > 0 ? `${equipmentCount} items` : "Not set"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <Button
          size="lg"
          className="flex-1 group"
          onClick={onGenerateWorkout}
        >
          <Sparkles className="mr-2 w-4 h-4 group-hover:animate-spin" />
          Generate My First Workout
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={onExploreDashboard}
        >
          Explore Dashboard
        </Button>
      </div>
    </div>
  );
};
