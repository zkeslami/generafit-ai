import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Flame, Trophy } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";

interface WorkoutDay {
  date: Date;
  count: number;
  workouts: {
    id: string;
    title: string;
    type: string;
    calories_burned?: number;
  }[];
}

interface WorkoutCalendarProps {
  refreshTrigger?: number;
}

export function WorkoutCalendar({ refreshTrigger }: WorkoutCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({ workouts: 0, calories: 0 });

  useEffect(() => {
    fetchWorkouts();
  }, [currentMonth, refreshTrigger]);

  const fetchWorkouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from("workouts")
      .select("id, title, type, calories_burned, created_at")
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching workouts:", error);
      return;
    }

    // Group workouts by date
    const grouped: Record<string, WorkoutDay> = {};
    data?.forEach((workout) => {
      const dateKey = format(new Date(workout.created_at), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: new Date(workout.created_at),
          count: 0,
          workouts: [],
        };
      }
      grouped[dateKey].count++;
      grouped[dateKey].workouts.push({
        id: workout.id,
        title: workout.title,
        type: workout.type,
        calories_burned: workout.calories_burned ?? undefined,
      });
    });

    setWorkoutDays(Object.values(grouped));

    // Calculate monthly stats
    const totalWorkouts = data?.length || 0;
    const totalCalories = data?.reduce((sum, w) => sum + (w.calories_burned || 0), 0) || 0;
    setMonthlyStats({ workouts: totalWorkouts, calories: totalCalories });

    // Calculate streak
    calculateStreak(user.id);
  };

  const calculateStreak = async (userId: string) => {
    const { data, error } = await supabase
      .from("workouts")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(90);

    if (error || !data?.length) {
      setStreak(0);
      return;
    }

    // Get unique workout dates
    const uniqueDates = [...new Set(data.map((w) => format(new Date(w.created_at), "yyyy-MM-dd")))];
    
    let currentStreak = 0;
    const today = new Date();
    let checkDate = today;

    // Check if worked out today or yesterday to start streak
    const todayKey = format(today, "yyyy-MM-dd");
    const yesterdayKey = format(new Date(today.getTime() - 86400000), "yyyy-MM-dd");
    
    if (!uniqueDates.includes(todayKey) && !uniqueDates.includes(yesterdayKey)) {
      setStreak(0);
      return;
    }

    // Count consecutive days
    for (let i = 0; i < 90; i++) {
      const dateKey = format(checkDate, "yyyy-MM-dd");
      if (uniqueDates.includes(dateKey)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else if (i > 0) {
        break;
      } else {
        checkDate = new Date(checkDate.getTime() - 86400000);
      }
    }

    setStreak(currentStreak);
  };

  const getWorkoutsForDate = (date: Date) => {
    return workoutDays.find((wd) => isSameDay(wd.date, date));
  };

  const selectedDayWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : null;

  const modifiers = {
    workout: workoutDays.map((wd) => wd.date),
  };

  const modifiersStyles = {
    workout: {
      backgroundColor: "hsl(var(--primary) / 0.2)",
      borderRadius: "50%",
    },
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <CalendarDays className="h-5 w-5 text-primary" />
          Workout Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Bar */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Streak</span>
            <Badge variant="secondary" className="font-bold">
              {streak} days
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">This month</span>
            <Badge variant="outline">
              {monthlyStats.workouts} workouts
            </Badge>
          </div>
        </div>

        {/* Calendar */}
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border border-border"
        />

        {/* Selected Day Details */}
        {selectedDate && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              {format(selectedDate, "MMMM d, yyyy")}
            </h4>
            {selectedDayWorkouts ? (
              <div className="space-y-2">
                {selectedDayWorkouts.workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex justify-between items-center p-2 rounded bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{workout.title}</p>
                      <p className="text-xs text-muted-foreground">{workout.type}</p>
                    </div>
                    {workout.calories_burned && (
                      <Badge variant="outline" className="text-xs">
                        {workout.calories_burned} cal
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No workouts logged</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
