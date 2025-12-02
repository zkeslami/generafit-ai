import { Settings, User, Bell, Sparkles, Dumbbell, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "personal", label: "Personal Details", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "personalization", label: "Personalization", icon: Sparkles },
  { id: "equipment", label: "Equipment", icon: Dumbbell },
  { id: "subscription", label: "Subscription", icon: Crown },
];

export function ProfileSidebar({ activeTab, onTabChange }: ProfileSidebarProps) {
  return (
    <div className="md:w-56 shrink-0">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
              "hover:bg-secondary/80",
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}