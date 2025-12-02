import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export const OnboardingProgress = ({ currentStep, totalSteps, labels }: OnboardingProgressProps) => {
  const defaultLabels = ["Welcome", "Goals", "Details", "Equipment", "Tour", "Done"];
  const stepLabels = labels || defaultLabels;

  return (
    <div className="w-full px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                i < currentStep
                  ? "bg-primary text-primary-foreground"
                  : i === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-xs mt-2 text-center hidden sm:block transition-colors",
                i <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {stepLabels[i]}
            </span>
          </div>
        ))}
      </div>
      <div className="relative h-1 bg-muted rounded-full mt-4">
        <div
          className="absolute h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};
