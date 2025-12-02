import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, Zap, Pencil, Trash2, X, Check, ChevronDown, ChevronRight,
  Dumbbell, Heart, Move, Target, Scale, ExternalLink, Star, Flame
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Exercise {
  name: string;
  details: string;
  category?: string;
  muscle_group?: string;
  equipment?: string;
}

interface WorkoutSection {
  title: string;
  exercises: Exercise[];
}

interface Workout {
  id?: string;
  title: string;
  type: string;
  duration_minutes: number;
  sections: WorkoutSection[];
  rationale?: string;
  source?: string;
  is_favorite?: boolean;
  calories_burned?: number;
  estimated_calories?: number;
}

interface WorkoutCardProps {
  workout: Workout;
  onLog?: (modifiedWorkout: Workout) => void;
  onDelete?: () => void;
  onDismiss?: () => void;
  onFavoriteChange?: () => void;
  showDate?: boolean;
  date?: string;
  editable?: boolean;
}

const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case "strength":
      return <Dumbbell className="w-4 h-4 text-orange-400" />;
    case "cardio":
      return <Heart className="w-4 h-4 text-red-400" />;
    case "flexibility":
    case "stretch":
      return <Move className="w-4 h-4 text-green-400" />;
    case "plyometric":
      return <Zap className="w-4 h-4 text-yellow-400" />;
    case "core":
      return <Target className="w-4 h-4 text-blue-400" />;
    case "balance":
      return <Scale className="w-4 h-4 text-purple-400" />;
    default:
      return <Dumbbell className="w-4 h-4 text-muted-foreground" />;
  }
};

const getFormGifLink = (exerciseName: string) => {
  const searchQuery = encodeURIComponent(`${exerciseName} exercise form gif`);
  return `https://www.google.com/search?q=${searchQuery}&tbm=isch`;
};

export const WorkoutCard = ({ 
  workout, 
  onLog, 
  onDelete,
  onDismiss,
  onFavoriteChange,
  showDate, 
  date,
  editable = true,
}: WorkoutCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [removedExercises, setRemovedExercises] = useState<Set<string>>(new Set());
  const [isFavorite, setIsFavorite] = useState(workout.is_favorite || false);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(() => 
    Object.fromEntries(workout.sections.map((_, idx) => [idx, false]))
  );

  const getExerciseKey = (sectionIdx: number, exIdx: number) => `${sectionIdx}-${exIdx}`;

  const toggleExercise = (key: string) => {
    setCompletedExercises(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const removeExercise = (key: string) => {
    setRemovedExercises(prev => new Set([...prev, key]));
  };

  const undoRemove = (key: string) => {
    setRemovedExercises(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const getModifiedWorkout = (): Workout => {
    const modifiedSections = workout.sections.map((section, sIdx) => ({
      ...section,
      exercises: section.exercises.filter((_, exIdx) => 
        !removedExercises.has(getExerciseKey(sIdx, exIdx))
      ),
    })).filter(section => section.exercises.length > 0);

    return {
      ...workout,
      sections: modifiedSections,
    };
  };

  const handleLog = () => {
    const modifiedWorkout = getModifiedWorkout();
    onLog?.(modifiedWorkout);
    setIsEditing(false);
    setRemovedExercises(new Set());
    setCompletedExercises({});
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setRemovedExercises(new Set());
    setCompletedExercises({});
  };

  const toggleSection = (idx: number) => {
    setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAll = () => {
    setOpenSections(Object.fromEntries(workout.sections.map((_, idx) => [idx, true])));
  };

  const collapseAll = () => {
    setOpenSections(Object.fromEntries(workout.sections.map((_, idx) => [idx, false])));
  };

  const toggleFavorite = async () => {
    if (!workout.id) return;
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    const { error } = await supabase
      .from("workouts")
      .update({ is_favorite: newFavoriteState })
      .eq("id", workout.id);
    
    if (error) {
      setIsFavorite(!newFavoriteState);
      toast.error("Failed to update favorite");
    } else {
      toast.success(newFavoriteState ? "Added to favorites" : "Removed from favorites");
      onFavoriteChange?.();
    }
  };

  const allExpanded = Object.values(openSections).every(Boolean);

  const totalExercises = workout.sections.reduce((sum, s) => sum + s.exercises.length, 0);
  const remainingExercises = totalExercises - removedExercises.size;

  // Calculate summary data
  const muscleGroups = new Set<string>();
  const exerciseTypes: Record<string, number> = {};
  workout.sections.forEach(section => {
    section.exercises.forEach(ex => {
      if (ex.muscle_group) muscleGroups.add(ex.muscle_group);
      const category = ex.category || "general";
      exerciseTypes[category] = (exerciseTypes[category] || 0) + 1;
    });
  });

  const estimatedCalories = workout.calories_burned || workout.estimated_calories;

  return (
    <>
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl">{workout.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{workout.type}</Badge>
                {workout.source === "manual" && (
                  <Badge variant="outline">Manual</Badge>
                )}
                <span className="flex items-center gap-1 text-sm">
                  <Clock className="w-3 h-3" />
                  {workout.duration_minutes} min
                </span>
                {estimatedCalories && (
                  <span className="flex items-center gap-1 text-sm text-orange-400">
                    <Flame className="w-3 h-3" />
                    ~{estimatedCalories} cal
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {workout.id && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleFavorite}
                  className={isFavorite ? "text-yellow-500" : "text-muted-foreground"}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? "fill-yellow-500" : ""}`} />
                </Button>
              )}
              {onLog && editable && !isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Workout Summary */}
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Exercises</span>
                <p className="font-semibold">{totalExercises}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sections</span>
                <p className="font-semibold">{workout.sections.length}</p>
              </div>
              {muscleGroups.size > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Muscles</span>
                  <p className="font-semibold text-xs">{[...muscleGroups].slice(0, 4).join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {workout.rationale && (
            <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{workout.rationale}</span>
              </p>
            </div>
          )}
          {showDate && date && (
            <p className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</p>
          )}
          {isEditing && (
            <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Edit mode: Remove exercises you didn't do, then log the workout.
                ({remainingExercises}/{totalExercises} exercises remaining)
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Expand/Collapse All button */}
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={allExpanded ? collapseAll : expandAll}
              className="text-xs text-muted-foreground"
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>

          {workout.sections.map((section, sIdx) => (
            <Collapsible
              key={sIdx}
              open={openSections[sIdx]}
              onOpenChange={() => toggleSection(sIdx)}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  {openSections[sIdx] ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <h4 className="text-sm font-semibold text-primary">{section.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    ({section.exercises.length} exercises)
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-2 ml-6 mt-2">
                  {section.exercises.map((exercise, exIdx) => {
                    const key = getExerciseKey(sIdx, exIdx);
                    const isRemoved = removedExercises.has(key);
                    const isCompleted = completedExercises[key];

                    if (isRemoved && !isEditing) return null;

                    return (
                      <li
                        key={exIdx}
                        className={`text-sm flex items-start gap-2 p-2 rounded transition-base ${
                          isRemoved
                            ? "bg-destructive/10 opacity-50"
                            : isCompleted
                            ? "bg-primary/10"
                            : "bg-secondary/30"
                        }`}
                      >
                        {isEditing && !isRemoved && (
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => toggleExercise(key)}
                            className="mt-0.5"
                          />
                        )}
                        {!isEditing && getCategoryIcon(exercise.category)}
                        <div className={`flex-1 ${isRemoved ? "line-through" : ""}`}>
                          <span className="font-medium">{exercise.name}</span>
                          <span className="text-muted-foreground"> — {exercise.details}</span>
                        </div>
                        {!isEditing && (
                          <a
                            href={getFormGifLink(exercise.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="View exercise form"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {isEditing && (
                          isRemoved ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => undoRemove(key)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removeExercise(key)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ))}
          
          {onLog && (
            <div className="flex gap-2 mt-4">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleLog} className="flex-1" disabled={remainingExercises === 0}>
                    Log Modified Workout
                  </Button>
                </>
              ) : (
                <Button onClick={() => onLog(workout)} className="w-full" size="lg">
                  Log This Workout
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{workout.title}" from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
