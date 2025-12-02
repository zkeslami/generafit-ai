import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { GeneralSettings } from "@/components/profile/GeneralSettings";
import { PersonalDetailsForm } from "@/components/profile/PersonalDetailsForm";
import { NotificationSettingsForm } from "@/components/profile/NotificationSettingsForm";
import { PersonalizationSettings } from "@/components/profile/PersonalizationSettings";
import { EquipmentSettings } from "@/components/profile/EquipmentSettings";
import { SubscriptionSettings } from "@/components/profile/SubscriptionSettings";

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get("tab") || "general";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadProfile(session.user.id);
      await loadEquipment(session.user.id);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const loadEquipment = async (userId: string) => {
    const { data } = await supabase
      .from("user_equipment")
      .select("equipment_list")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.equipment_list) {
      setEquipment(data.equipment_list as string[]);
    }
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const refreshEquipment = async () => {
    if (user) await loadEquipment(user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings user={user} profile={profile} onUpdate={refreshProfile} />;
      case "personal":
        return <PersonalDetailsForm profile={profile} onUpdate={refreshProfile} />;
      case "notifications":
        return <NotificationSettingsForm profile={profile} onUpdate={refreshProfile} />;
      case "personalization":
        return <PersonalizationSettings profile={profile} onUpdate={refreshProfile} />;
      case "equipment":
        return <EquipmentSettings userId={user?.id} equipment={equipment} onUpdate={refreshEquipment} />;
      case "subscription":
        return <SubscriptionSettings user={user} profile={profile} />;
      default:
        return <GeneralSettings user={user} profile={profile} onUpdate={refreshProfile} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          {/* Sidebar */}
          <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;