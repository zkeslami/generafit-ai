import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, Target } from "lucide-react";

interface WorkoutGeneratorProps {
  onWorkoutGenerated: (workout: any) => void;
  userGoal?: string;
  equipment?: string[];
  userProfile?: {
    weight_kg?: number | null;
    height_cm?: number | null;
    birth_year?: number | null;
    gender?: string | null;
  };
}

const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Full Body"
];

const WORKOUT_TYPES = [
  "Strength Training",
  "Cardio",
  "HIIT",
  "Yoga",
  "Calisthenics",
  "Circuit Training"
];

export const WorkoutGenerator = ({ onWorkoutGenerated, userGoal, equipment = [], userProfile }: WorkoutGeneratorProps) => {
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [workoutType, setWorkoutType] = useState("");
  const [duration, setDuration] = useState(30);
  const [sessionGoal, setSessionGoal] = useState("");
  const [generating, setGenerating] = useState(false);

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const handleGenerate = async () => {
    if (selectedMuscles.length === 0 || !workoutType) {
      toast.error("Please select muscle groups and workout type");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          targetMuscles: selectedMuscles,
          workoutType,
          duration,
          userGoal: sessionGoal || userGoal,
          equipment: equipment.length > 0 ? equipment : undefined,
          userProfile: userProfile ? {
            weight_kg: userProfile.weight_kg,
            height_cm: userProfile.height_cm,
            birth_year: userProfile.birth_year,
            gender: userProfile.gender,
          } : undefined,
        }
      });

      if (error) throw error;

      if (data?.workout) {
        onWorkoutGenerated(data.workout);
        toast.success("Workout generated!");
        setSessionGoal("");
      } else {
        throw new Error("No workout data received");
      }
    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast.error(error.message || "Failed to generate workout");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Generate Workout
        </CardTitle>
        <CardDescription>
          Customize your workout based on your preferences
          {equipment.length > 0 && (
            <span className="block text-xs mt-1 text-primary">
              Using {equipment.length} equipment items
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Target Muscle Groups</Label>
          <div className="grid grid-cols-2 gap-3">
            {MUSCLE_GROUPS.map((muscle) => (
              <div key={muscle} className="flex items-center space-x-2">
                <Checkbox
                  id={muscle}
                  checked={selectedMuscles.includes(muscle)}
                  onCheckedChange={() => toggleMuscle(muscle)}
                />
                <Label htmlFor={muscle} className="cursor-pointer text-sm">
                  {muscle}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workout-type">Workout Type</Label>
          <Select value={workoutType} onValueChange={setWorkoutType}>
            <SelectTrigger id="workout-type">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {WORKOUT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes): {duration}</Label>
          <Input
            id="duration"
            type="range"
            min="15"
            max="90"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>15 min</span>
            <span>90 min</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="session-goal" className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            Session Goal (optional)
          </Label>
          <Textarea
            id="session-goal"
            placeholder="e.g., Focus on explosive power, recover from yesterday's leg day, prepare for a 5K..."
            value={sessionGoal}
            onChange={(e) => setSessionGoal(e.target.value)}
            className="resize-none h-20"
          />
          <p className="text-xs text-muted-foreground">
            Describe what you want to achieve in this specific workout
          </p>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={generating || selectedMuscles.length === 0 || !workoutType}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Workout
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
