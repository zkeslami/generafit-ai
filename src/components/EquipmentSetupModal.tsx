import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EquipmentSetupModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
  initialEquipment?: string[];
  onSave?: (equipment: string[]) => void;
}

const EQUIPMENT_CATEGORIES = {
  "Cardio Machines": [
    "Treadmill",
    "Elliptical",
    "Rowing Machine",
    "Stationary Bike",
    "Stair Climber",
    "Assault Bike",
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
    "Lat Pulldown",
    "Leg Press",
    "Smith Machine",
    "Chest Press Machine",
    "Leg Curl Machine",
    "Leg Extension Machine",
    "Shoulder Press Machine",
  ],
  "Other Equipment": [
    "Pull-up Bar",
    "Dip Station",
    "Resistance Bands",
    "Flat Bench",
    "Adjustable Bench",
    "Squat Rack",
    "Foam Roller",
    "Medicine Ball",
    "Battle Ropes",
    "TRX/Suspension Trainer",
  ],
};

export const EquipmentSetupModal = ({ 
  open, 
  onClose, 
  userId, 
  initialEquipment = [],
  onSave 
}: EquipmentSetupModalProps) => {
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(initialEquipment);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedEquipment(initialEquipment);
  }, [initialEquipment]);

  const toggleEquipment = (item: string) => {
    setSelectedEquipment(prev =>
      prev.includes(item)
        ? prev.filter(e => e !== item)
        : [...prev, item]
    );
  };

  const selectAll = () => {
    const allEquipment = Object.values(EQUIPMENT_CATEGORIES).flat();
    setSelectedEquipment(allEquipment);
  };

  const clearAll = () => {
    setSelectedEquipment([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (userId) {
        // Check if equipment record exists
        const { data: existing } = await supabase
          .from("user_equipment")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("user_equipment")
            .update({ equipment_list: selectedEquipment })
            .eq("user_id", userId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_equipment")
            .insert({ user_id: userId, equipment_list: selectedEquipment });
          if (error) throw error;
        }
        toast.success("Equipment saved!");
      }
      
      onSave?.(selectedEquipment);
      onClose();
    } catch (error: any) {
      console.error("Error saving equipment:", error);
      toast.error(error.message || "Failed to save equipment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Gym Equipment</DialogTitle>
          <DialogDescription className="text-base">
            Select the equipment available at your gym. Workouts will only include exercises you can do.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
          <span className="text-sm text-muted-foreground ml-auto self-center">
            {selectedEquipment.length} selected
          </span>
        </div>

        <div className="space-y-6">
          {Object.entries(EQUIPMENT_CATEGORIES).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm text-primary mb-3">{category}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {items.map(item => (
                  <div
                    key={item}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary/50 transition-base cursor-pointer"
                    onClick={() => toggleEquipment(item)}
                  >
                    <Checkbox
                      id={item}
                      checked={selectedEquipment.includes(item)}
                      onCheckedChange={() => toggleEquipment(item)}
                    />
                    <Label htmlFor={item} className="cursor-pointer text-sm">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Equipment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
