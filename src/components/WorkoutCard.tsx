import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Zap, Pencil, Trash2, X, Check } from "lucide-react";
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

interface Exercise {
  name: string;
  details: string;
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
}

interface WorkoutCardProps {
  workout: Workout;
  onLog?: (modifiedWorkout: Workout) => void;
  onDelete?: () => void;
  showDate?: boolean;
  date?: string;
  editable?: boolean;
}

export const WorkoutCard = ({ 
  workout, 
  onLog, 
  onDelete,
  showDate, 
  date,
  editable = true,
}: WorkoutCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [removedExercises, setRemovedExercises] = useState<Set<string>>(new Set());

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

  const totalExercises = workout.sections.reduce((sum, s) => sum + s.exercises.length, 0);
  const remainingExercises = totalExercises - removedExercises.size;

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
              </CardDescription>
            </div>
            <div className="flex gap-1">
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
        <CardContent className="space-y-4">
          {workout.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2">
              <h4 className="text-sm font-semibold text-primary">{section.title}</h4>
              <ul className="space-y-2">
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
                      <div className={`flex-1 ${isRemoved ? "line-through" : ""}`}>
                        <span className="font-medium">{exercise.name}</span>
                        <span className="text-muted-foreground"> — {exercise.details}</span>
                      </div>
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
            </div>
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
