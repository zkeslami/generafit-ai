import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GoalSetupModal } from "@/components/GoalSetupModal";
import { EquipmentSetupModal } from "@/components/EquipmentSetupModal";
import { ManualWorkoutModal } from "@/components/ManualWorkoutModal";
import { WorkoutGenerator } from "@/components/WorkoutGenerator";
import { WorkoutCard } from "@/components/WorkoutCard";
import { LogWorkoutModal } from "@/components/LogWorkoutModal";
import { DailySuggestion } from "@/components/DailySuggestion";
import { WorkoutStats } from "@/components/WorkoutStats";
import { WorkoutHistory } from "@/components/WorkoutHistory";
import { Dumbbell, LogOut, Settings, Plus, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showManualWorkoutModal, setShowManualWorkoutModal] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [workoutToLog, setWorkoutToLog] = useState<any>(null);
  const [refreshStats, setRefreshStats] = useState(0);

  useEffect(() => {
    // Check authentication but don't redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        checkProfile(session.user.id);
        loadEquipment(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        checkProfile(session.user.id);
        loadEquipment(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setEquipment([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        setShowGoalModal(true);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  const loadEquipment = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_equipment")
        .select("equipment_list")
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.equipment_list) {
        setEquipment(data.equipment_list as string[]);
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const handleWorkoutGenerated = (workout: any) => {
    setGeneratedWorkout(workout);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogWorkout = (workout: any) => {
    if (!user) {
      toast.error("Please sign in to save your workouts", {
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }
    setWorkoutToLog(workout);
    setShowLogModal(true);
  };

  const handleLogComplete = () => {
    setShowLogModal(false);
    setWorkoutToLog(null);
    setGeneratedWorkout(null);
    setRefreshStats(prev => prev + 1);
    
    // Check milestones
    if (user) {
      supabase
        .from("workouts")
        .select("id", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .then(({ count }) => {
          if (count && [5, 10, 25, 50, 100].includes(count)) {
            toast.success(`🎉 Milestone! You've completed ${count} workouts!`, {
              duration: 5000,
            });
          }
        });
    }
  };

  const handleManualWorkoutComplete = () => {
    setRefreshStats(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Smart Fitness</h1>
              {profile?.custom_goal && (
                <p className="text-xs text-muted-foreground">
                  Goal: {profile.custom_goal}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Button variant="ghost" size="icon" onClick={() => setShowEquipmentModal(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            )}
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Guest Banner */}
      {!user && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              👋 Try it out! Sign in to save your workouts and track progress.
            </p>
            <Button variant="link" size="sm" onClick={() => navigate("/auth")}>
              Sign In →
            </Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Generated Workout Display */}
            {generatedWorkout && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Your Generated Workout</h2>
                <WorkoutCard 
                  workout={generatedWorkout} 
                  onLog={handleLogWorkout}
                  onDismiss={() => setGeneratedWorkout(null)}
                />
              </div>
            )}

            {/* Daily Suggestion - only for logged in users */}
            {user && <DailySuggestion onStartWorkout={handleLogWorkout} />}

            {/* Manual Log Card for logged in users */}
            {user && (
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Log a Workout</h3>
                      <p className="text-sm text-muted-foreground">
                        Record cardio, classes, or any activity
                      </p>
                    </div>
                    <Button onClick={() => setShowManualWorkoutModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Log Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats and History - only for logged in users */}
            {user && (
              <>
                <WorkoutStats refreshTrigger={refreshStats} />
                <WorkoutHistory refreshTrigger={refreshStats} />
              </>
            )}

            {/* CTA for guests */}
            {!user && (
              <Card className="border-primary/20">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold mb-2">Track Your Progress</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign in to save workouts, track stats, and get personalized suggestions.
                  </p>
                  <Button onClick={() => navigate("/auth")}>
                    Get Started Free
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            <WorkoutGenerator 
              onWorkoutGenerated={handleWorkoutGenerated}
              userGoal={profile?.custom_goal || profile?.primary_goal}
              equipment={equipment}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <GoalSetupModal 
        open={showGoalModal} 
        onComplete={() => {
          setShowGoalModal(false);
          if (user) checkProfile(user.id);
        }} 
      />

      <EquipmentSetupModal
        open={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        userId={user?.id}
        initialEquipment={equipment}
        onSave={setEquipment}
      />

      <ManualWorkoutModal
        open={showManualWorkoutModal}
        onClose={() => setShowManualWorkoutModal(false)}
        onComplete={handleManualWorkoutComplete}
      />

      {workoutToLog && (
        <LogWorkoutModal
          open={showLogModal}
          onClose={handleLogComplete}
          workout={workoutToLog}
        />
      )}
    </div>
  );
};

export default Index;
