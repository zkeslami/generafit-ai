import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Star, Play, Clock, Flame } from "lucide-react";
import { toast } from "sonner";

interface FavoriteWorkout {
  id: string;
  title: string;
  type: string;
  duration_minutes: number;
  calories_burned?: number;
  sections: any;
}

interface FavoriteWorkoutsProps {
  onQuickStart?: (workout: FavoriteWorkout) => void;
  refreshTrigger?: number;
}

export function FavoriteWorkouts({ onQuickStart, refreshTrigger }: FavoriteWorkoutsProps) {
  const [favorites, setFavorites] = useState<FavoriteWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [refreshTrigger]);

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("workouts")
      .select("id, title, type, duration_minutes, calories_burned, sections")
      .eq("user_id", user.id)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching favorites:", error);
    } else {
      setFavorites(data || []);
    }
    setLoading(false);
  };

  const handleQuickStart = async (workout: FavoriteWorkout) => {
    if (onQuickStart) {
      onQuickStart(workout);
      toast.success(`Starting ${workout.title}!`);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Quick Start
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((workout) => (
            <div
              key={workout.id}
              className="group relative p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-foreground line-clamp-1">
                  {workout.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {workout.type}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {workout.duration_minutes}m
                  </span>
                  {workout.calories_burned && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {workout.calories_burned}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleQuickStart(workout)}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
