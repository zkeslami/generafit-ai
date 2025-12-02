import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManualWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const WORKOUT_TYPES = [
  { value: "cardio", label: "🏃 Cardio", examples: "Running, Cycling, Swimming" },
  { value: "class", label: "🧘 Class", examples: "Yoga, Spin, CrossFit, HIIT" },
  { value: "strength", label: "🏋️ Strength Training", examples: "Weight lifting, Bodyweight" },
  { value: "sports", label: "🎾 Sports/Recreation", examples: "Basketball, Tennis, Hiking" },
  { value: "other", label: "📋 Other", examples: "Any other activity" },
];

const CARDIO_ACTIVITIES = [
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
  "Rowing",
  "Elliptical",
  "Stair Climbing",
  "Jump Rope",
  "Other",
];

export const ManualWorkoutModal = ({ open, onClose, onComplete }: ManualWorkoutModalProps) => {
  const [workoutType, setWorkoutType] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [calories, setCalories] = useState("");
  const [difficulty, setDifficulty] = useState([5]);
  const [notes, setNotes] = useState("");
  const [distance, setDistance] = useState("");
  const [cardioActivity, setCardioActivity] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setWorkoutType("");
    setTitle("");
    setDuration(30);
    setCalories("");
    setDifficulty([5]);
    setNotes("");
    setDistance("");
    setCardioActivity("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!workoutType || !duration) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to log workouts");
        return;
      }

      // Generate title based on type if not provided
      let finalTitle = title;
      if (!finalTitle) {
        if (workoutType === "cardio" && cardioActivity) {
          finalTitle = `${cardioActivity}${distance ? ` - ${distance}` : ""}`;
        } else {
          const typeLabel = WORKOUT_TYPES.find(t => t.value === workoutType)?.label || workoutType;
          finalTitle = typeLabel.replace(/[^\w\s]/g, "").trim();
        }
      }

      const workoutData = {
        user_id: user.id,
        title: finalTitle,
        type: workoutType,
        duration_minutes: duration,
        logged_duration: duration,
        calories_burned: calories ? parseInt(calories) : null,
        difficulty: difficulty[0],
        feedback: notes || null,
        source: "manual",
        sections: [{
          title: "Activity",
          exercises: [{
            name: finalTitle,
            details: `${duration} minutes${distance ? `, ${distance}` : ""}`,
          }],
        }],
      };

      const { error } = await supabase.from("workouts").insert(workoutData);

      if (error) throw error;

      toast.success("Workout logged!");
      handleClose();
      onComplete?.();
    } catch (error: any) {
      console.error("Error logging workout:", error);
      toast.error(error.message || "Failed to log workout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Log Workout</DialogTitle>
          <DialogDescription>
            Record any workout - cardio, classes, sports, or custom activities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Workout Type */}
          <div className="space-y-2">
            <Label>Workout Type *</Label>
            <Select value={workoutType} onValueChange={setWorkoutType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {type.examples}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cardio-specific: Activity selection */}
          {workoutType === "cardio" && (
            <div className="space-y-2">
              <Label>Activity</Label>
              <Select value={cardioActivity} onValueChange={setCardioActivity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity..." />
                </SelectTrigger>
                <SelectContent>
                  {CARDIO_ACTIVITIES.map(activity => (
                    <SelectItem key={activity} value={activity}>
                      {activity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title (optional for cardio) */}
          {workoutType && workoutType !== "cardio" && (
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Morning Yoga, Basketball Game"
              />
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration (minutes) *</Label>
            <Input
              type="number"
              value={duration}
              onChange={e => setDuration(parseInt(e.target.value) || 0)}
              min={1}
            />
          </div>

          {/* Distance (for cardio) */}
          {workoutType === "cardio" && (
            <div className="space-y-2">
              <Label>Distance (optional)</Label>
              <Input
                value={distance}
                onChange={e => setDistance(e.target.value)}
                placeholder="e.g., 5K, 3 miles"
              />
            </div>
          )}

          {/* Calories */}
          <div className="space-y-2">
            <Label>Calories Burned (optional)</Label>
            <Input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="Estimated calories"
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulty: {difficulty[0]}/10</Label>
            <Slider
              value={difficulty}
              onValueChange={setDifficulty}
              max={10}
              min={1}
              step={1}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did it go? Any highlights?"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !workoutType} className="flex-1">
            {saving ? "Saving..." : "Log Workout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
