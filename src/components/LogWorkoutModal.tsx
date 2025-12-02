import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

interface LogWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  workout: any;
}

export const LogWorkoutModal = ({ open, onClose, workout }: LogWorkoutModalProps) => {
  const [duration, setDuration] = useState(workout?.duration_minutes || 30);
  const [calories, setCalories] = useState(0);
  const [difficulty, setDifficulty] = useState([5]);
  const [feedback, setFeedback] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset form when workout changes
  useEffect(() => {
    if (workout) {
      setDuration(workout.duration_minutes || 30);
      setCalories(0);
      setDifficulty([5]);
      setFeedback("");
      setLocation(null);
    }
  }, [workout]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast.success("Location added!");
        },
        (error) => {
          toast.error("Could not get location");
          console.error(error);
        }
      );
    } else {
      toast.error("Geolocation is not supported");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("workouts").insert({
        user_id: user.id,
        title: workout.title,
        type: workout.type,
        duration_minutes: workout.duration_minutes,
        sections: workout.sections,
        logged_duration: duration,
        calories_burned: calories || null,
        difficulty: difficulty[0],
        feedback: feedback || null,
        location: location,
        source: "generated",
      });

      if (error) throw error;

      toast.success("Workout logged successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error logging workout:", error);
      toast.error(error.message || "Failed to log workout");
    } finally {
      setLoading(false);
    }
  };

  if (!workout) return null;

  // Calculate how many exercises remain (in case workout was modified)
  const totalExercises = workout.sections?.reduce(
    (sum: number, section: any) => sum + (section.exercises?.length || 0),
    0
  ) || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Workout</DialogTitle>
          <DialogDescription>
            {workout.title} • {totalExercises} exercises
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories">Calories Burned (optional)</Label>
            <Input
              id="calories"
              type="number"
              min="0"
              value={calories || ""}
              onChange={(e) => setCalories(Number(e.target.value))}
              placeholder="Estimated calories"
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty: {difficulty[0]}/10</Label>
            <Slider
              value={difficulty}
              onValueChange={setDifficulty}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="How did the workout feel?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={getLocation}
            className="w-full"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {location ? "Location Added ✓" : "Add Location"}
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Log Workout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
