import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OnboardingProgress } from "./OnboardingProgress";
import { WelcomeStep } from "./WelcomeStep";
import { GoalStep } from "./GoalStep";
import { PersonalDetailsStep } from "./PersonalDetailsStep";
import { EquipmentStep } from "./EquipmentStep";
import { FeatureTourStep } from "./FeatureTourStep";
import { CompletionStep } from "./CompletionStep";

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
  onGenerateWorkout: () => void;
}

export const OnboardingWizard = ({ userId, onComplete, onGenerateWorkout }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nickname, setNickname] = useState("");
  const [goalCategory, setGoalCategory] = useState("");
  const [selectedExample, setSelectedExample] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [isImperial, setIsImperial] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const totalSteps = 6;

  const saveProgress = async () => {
    setSaving(true);
    try {
      // Convert imperial to metric if needed
      let weightKg = weight ? parseFloat(weight) : null;
      let heightCm = height ? parseFloat(height) : null;

      if (isImperial) {
        if (weightKg) weightKg = weightKg * 0.453592;
        if (heightCm) heightCm = heightCm * 2.54;
      }

      const primaryGoal = customGoal || selectedExample || "";

      // Update user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: userId,
          nickname: nickname || null,
          goal_category: goalCategory || null,
          custom_goal: customGoal || null,
          primary_goal: primaryGoal,
          weight_kg: weightKg,
          height_cm: heightCm,
          birth_year: birthYear ? parseInt(birthYear) : null,
          gender: gender || null,
          preferred_unit_system: isImperial ? "imperial" : "metric",
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Save equipment if selected
      if (selectedEquipment.length > 0) {
        const { error: equipmentError } = await supabase
          .from("user_equipment")
          .upsert({
            user_id: userId,
            equipment_list: selectedEquipment
          });

        if (equipmentError) throw equipmentError;
      }

      return true;
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast.error("Failed to save your preferences");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = async () => {
    const success = await saveProgress();
    if (success) {
      onComplete();
    }
  };

  const handleGenerateWorkout = async () => {
    const success = await saveProgress();
    if (success) {
      onGenerateWorkout();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full max-w-3xl mx-auto">
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto py-8">
        {currentStep === 0 && (
          <WelcomeStep
            nickname={nickname}
            onNicknameChange={setNickname}
            onNext={handleNext}
          />
        )}

        {currentStep === 1 && (
          <GoalStep
            goalCategory={goalCategory}
            selectedExample={selectedExample}
            customGoal={customGoal}
            onGoalCategoryChange={setGoalCategory}
            onSelectedExampleChange={setSelectedExample}
            onCustomGoalChange={setCustomGoal}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 2 && (
          <PersonalDetailsStep
            weight={weight}
            height={height}
            birthYear={birthYear}
            gender={gender}
            isImperial={isImperial}
            onWeightChange={setWeight}
            onHeightChange={setHeight}
            onBirthYearChange={setBirthYear}
            onGenderChange={setGender}
            onImperialChange={setIsImperial}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        )}

        {currentStep === 3 && (
          <EquipmentStep
            selectedEquipment={selectedEquipment}
            onEquipmentChange={setSelectedEquipment}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        )}

        {currentStep === 4 && (
          <FeatureTourStep
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && (
          <CompletionStep
            nickname={nickname}
            goalCategory={goalCategory}
            selectedExample={selectedExample}
            customGoal={customGoal}
            equipmentCount={selectedEquipment.length}
            onGenerateWorkout={handleGenerateWorkout}
            onExploreDashboard={handleComplete}
          />
        )}
      </div>
    </div>
  );
};
