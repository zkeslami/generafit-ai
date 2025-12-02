import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, Minus, Plus, Flame } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";

interface WeeklyGoalTrackerProps {
  refreshTrigger?: number;
}

export function WeeklyGoalTracker({ refreshTrigger }: WeeklyGoalTrackerProps) {
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [completedWorkouts, setCompletedWorkouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's weekly goal
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("weekly_workout_goal")
        .eq("id", user.id)
        .single();

      if (profile?.weekly_workout_goal) {
        setWeeklyGoal(profile.weekly_workout_goal);
      }

      // Calculate week boundaries (Monday to Sunday)
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // Count workouts this week
      const { count } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("logged_duration", "is", null)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      setCompletedWorkouts(count || 0);
    } catch (error) {
      console.error("Error fetching weekly goal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (newGoal: number) => {
    if (newGoal < 1 || newGoal > 7) return;
    
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_profiles")
        .update({ weekly_workout_goal: newGoal })
        .eq("id", user.id);

      if (error) throw error;

      setWeeklyGoal(newGoal);
      toast.success(`Weekly goal updated to ${newGoal} workouts`);
    } catch (error: any) {
      toast.error("Failed to update goal");
    } finally {
      setUpdating(false);
    }
  };

  const progress = Math.min((completedWorkouts / weeklyGoal) * 100, 100);
  const isGoalMet = completedWorkouts >= weeklyGoal;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isGoalMet ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-4 h-4 text-primary" />
          Weekly Goal
          {isGoalMet && <Flame className="w-4 h-4 text-orange-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">This week</span>
            <span className={`font-semibold ${isGoalMet ? "text-primary" : ""}`}>
              {completedWorkouts} / {weeklyGoal} workouts
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isGoalMet 
                  ? "bg-gradient-to-r from-primary to-green-500" 
                  : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {isGoalMet && (
            <p className="text-xs text-green-500 font-medium">
              🎉 Goal achieved! Keep up the great work!
            </p>
          )}
        </div>

        {/* Goal Adjustment */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Adjust goal:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateGoal(weeklyGoal - 1)}
              disabled={updating || weeklyGoal <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{weeklyGoal}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateGoal(weeklyGoal + 1)}
              disabled={updating || weeklyGoal >= 7}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
