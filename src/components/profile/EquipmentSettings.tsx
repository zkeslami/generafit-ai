import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";

interface EquipmentSettingsProps {
  userId: string;
  equipment: string[];
  onUpdate: () => void;
}

const EQUIPMENT_CATEGORIES: Record<string, string[]> = {
  "Cardio Equipment": [
    "Treadmill",
    "Stationary Bike",
    "Rowing Machine",
    "Elliptical",
    "Stair Climber",
    "Jump Rope",
  ],
  "Free Weights": [
    "Dumbbells",
    "Barbells",
    "Kettlebells",
    "Weight Plates",
    "EZ Curl Bar",
  ],
  "Machines": [
    "Cable Machine",
    "Leg Press",
    "Smith Machine",
    "Lat Pulldown",
    "Chest Press Machine",
    "Leg Extension",
    "Leg Curl",
  ],
  "Other Equipment": [
    "Pull-up Bar",
    "Bench (Flat/Adjustable)",
    "Resistance Bands",
    "Medicine Ball",
    "Foam Roller",
    "Yoga Mat",
    "TRX/Suspension Trainer",
    "Battle Ropes",
  ],
};

export function EquipmentSettings({ userId, equipment, onUpdate }: EquipmentSettingsProps) {
  const [selected, setSelected] = useState<string[]>(equipment);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(equipment);
  }, [equipment]);

  const toggleEquipment = (item: string) => {
    setSelected((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const selectAll = () => {
    const allItems = Object.values(EQUIPMENT_CATEGORIES).flat();
    setSelected(allItems);
  };

  const clearAll = () => {
    setSelected([]);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("user_equipment")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_equipment")
          .update({ equipment_list: selected })
          .eq("user_id", userId);
      } else {
        await supabase
          .from("user_equipment")
          .insert({ user_id: userId, equipment_list: selected });
      }

      toast.success("Equipment saved");
      onUpdate();
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error("Failed to save equipment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Equipment</h2>
        <p className="text-muted-foreground">Select your available gym equipment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Available Equipment
          </CardTitle>
          <CardDescription>
            Workouts will only include exercises for equipment you have
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>

          {Object.entries(EQUIPMENT_CATEGORIES).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <Checkbox
                      checked={selected.includes(item)}
                      onCheckedChange={() => toggleEquipment(item)}
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              {selected.length} items selected
            </p>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Equipment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}