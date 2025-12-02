import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutCard } from "./WorkoutCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WorkoutHistoryProps {
  refreshTrigger?: number;
}

export const WorkoutHistory = ({ refreshTrigger }: WorkoutHistoryProps) => {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('workouts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workouts'
        },
        () => {
          fetchWorkouts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const fetchWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId);

      if (error) throw error;
      
      toast.success("Workout deleted");
      fetchWorkouts();
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("Failed to delete workout");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (workouts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            No workouts logged yet. Generate and log your first workout!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Workout History</h2>
      <div className="space-y-4">
        {workouts.map((workout) => (
          <WorkoutCard 
            key={workout.id} 
            workout={workout} 
            showDate 
            date={workout.created_at}
            onDelete={() => handleDelete(workout.id)}
            editable={false}
          />
        ))}
      </div>
    </div>
  );
};
