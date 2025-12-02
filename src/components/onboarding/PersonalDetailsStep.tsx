import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";

interface PersonalDetailsStepProps {
  weight: string;
  height: string;
  birthYear: string;
  gender: string;
  isImperial: boolean;
  onWeightChange: (weight: string) => void;
  onHeightChange: (height: string) => void;
  onBirthYearChange: (year: string) => void;
  onGenderChange: (gender: string) => void;
  onImperialChange: (imperial: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const PersonalDetailsStep = ({
  weight,
  height,
  birthYear,
  gender,
  isImperial,
  onWeightChange,
  onHeightChange,
  onBirthYearChange,
  onGenderChange,
  onImperialChange,
  onNext,
  onBack,
  onSkip
}: PersonalDetailsStepProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 10 - i);

  return (
    <div className="flex flex-col min-h-[60vh] px-4 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Personal Details</h2>
        <p className="text-muted-foreground">
          Help us estimate your calories burned accurately
        </p>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          These details are used to calculate personalized calorie estimates using your body metrics and workout intensity.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 mb-6">
        <Label htmlFor="unit-system" className="text-sm">Metric</Label>
        <Switch
          id="unit-system"
          checked={isImperial}
          onCheckedChange={onImperialChange}
        />
        <Label htmlFor="unit-system" className="text-sm">Imperial</Label>
      </div>

      <div className="grid gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight" className="mb-2 block">
              Weight ({isImperial ? "lbs" : "kg"})
            </Label>
            <Input
              id="weight"
              type="number"
              placeholder={isImperial ? "e.g., 165" : "e.g., 75"}
              value={weight}
              onChange={(e) => onWeightChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="height" className="mb-2 block">
              Height ({isImperial ? "inches" : "cm"})
            </Label>
            <Input
              id="height"
              type="number"
              placeholder={isImperial ? "e.g., 70" : "e.g., 178"}
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthYear" className="mb-2 block">
              Birth Year
            </Label>
            <Select value={birthYear} onValueChange={onBirthYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="gender" className="mb-2 block">
              Gender
            </Label>
            <Select value={gender} onValueChange={onGenderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-auto pt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={onNext}>
            Next
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
