import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface EquipmentStepProps {
  selectedEquipment: string[];
  onEquipmentChange: (equipment: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const EQUIPMENT_CATEGORIES = {
  "Free Weights": [
    "Dumbbells",
    "Barbell",
    "Kettlebells",
    "Weight Plates",
    "EZ Curl Bar"
  ],
  "Machines": [
    "Cable Machine",
    "Leg Press",
    "Smith Machine",
    "Lat Pulldown",
    "Chest Press Machine",
    "Leg Extension",
    "Leg Curl",
    "Seated Row Machine"
  ],
  "Cardio": [
    "Treadmill",
    "Stationary Bike",
    "Elliptical",
    "Rowing Machine",
    "Stair Climber",
    "Jump Rope"
  ],
  "Accessories": [
    "Pull-up Bar",
    "Resistance Bands",
    "Foam Roller",
    "Medicine Ball",
    "Stability Ball",
    "TRX/Suspension Trainer",
    "Ab Wheel",
    "Yoga Mat"
  ],
  "Benches & Racks": [
    "Flat Bench",
    "Adjustable Bench",
    "Squat Rack",
    "Dip Station"
  ]
};

const PRESETS = {
  "Full Gym": Object.values(EQUIPMENT_CATEGORIES).flat(),
  "Home Gym": [
    "Dumbbells",
    "Resistance Bands",
    "Pull-up Bar",
    "Yoga Mat",
    "Jump Rope",
    "Kettlebells",
    "Adjustable Bench"
  ],
  "Bodyweight Only": ["Pull-up Bar", "Yoga Mat", "Dip Station"]
};

export const EquipmentStep = ({
  selectedEquipment,
  onEquipmentChange,
  onNext,
  onBack,
  onSkip
}: EquipmentStepProps) => {
  const toggleEquipment = (item: string) => {
    if (selectedEquipment.includes(item)) {
      onEquipmentChange(selectedEquipment.filter((e) => e !== item));
    } else {
      onEquipmentChange([...selectedEquipment, item]);
    }
  };

  const applyPreset = (preset: keyof typeof PRESETS) => {
    onEquipmentChange(PRESETS[preset]);
  };

  return (
    <div className="flex flex-col min-h-[60vh] px-4 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Your Equipment</h2>
        <p className="text-muted-foreground">
          We'll only suggest exercises you can actually do
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("Full Gym")}
        >
          Full Gym
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("Home Gym")}
        >
          Home Gym
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("Bodyweight Only")}
        >
          Bodyweight Only
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEquipmentChange([])}
        >
          Clear All
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[40vh] space-y-6 mb-6">
        {Object.entries(EQUIPMENT_CATEGORIES).map(([category, items]) => (
          <div key={category}>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              {category}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {items.map((item) => (
                <div
                  key={item}
                  className="flex items-center space-x-2 p-2 rounded-lg border border-muted hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => toggleEquipment(item)}
                >
                  <Checkbox
                    id={item}
                    checked={selectedEquipment.includes(item)}
                    onCheckedChange={() => toggleEquipment(item)}
                  />
                  <Label
                    htmlFor={item}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground mb-4">
        {selectedEquipment.length} items selected
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
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
