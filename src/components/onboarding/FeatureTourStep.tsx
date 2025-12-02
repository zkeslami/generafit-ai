import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, Calendar, Heart, BarChart3, Zap } from "lucide-react";

interface FeatureTourStepProps {
  onNext: () => void;
  onBack: () => void;
}

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Workout Generator",
    description: "Generate custom workouts in seconds based on your goals, equipment, and preferences."
  },
  {
    icon: Zap,
    title: "Daily Suggestions",
    description: "Get personalized workout ideas every day, tailored to your progress and schedule."
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Track calories burned, workout duration, and maintain your streaks."
  },
  {
    icon: Heart,
    title: "Favorites",
    description: "Save your best workouts for quick access anytime you need them."
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description: "Visualize your fitness journey and see your workout patterns over time."
  }
];

export const FeatureTourStep = ({ onNext, onBack }: FeatureTourStepProps) => {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="flex flex-col min-h-[60vh] px-4 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">What You Can Do</h2>
        <p className="text-muted-foreground">
          Here's what's waiting for you
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                activeFeature === index
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-muted bg-card hover:border-primary/50"
              }`}
              onClick={() => setActiveFeature(index)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  activeFeature === index ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-auto pt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Almost Done
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
