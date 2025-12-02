import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "lucide-react";

interface ProfileSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  initialData?: {
    weight_kg?: number | null;
    height_cm?: number | null;
    birth_year?: number | null;
    gender?: string | null;
  };
}

export function ProfileSetupModal({ open, onOpenChange, onComplete, initialData }: ProfileSetupModalProps) {
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [saving, setSaving] = useState(false);
  const [useImperial, setUseImperial] = useState(false);
  const [weightLbs, setWeightLbs] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  useEffect(() => {
    if (initialData) {
      if (initialData.weight_kg) setWeightKg(String(initialData.weight_kg));
      if (initialData.height_cm) setHeightCm(String(initialData.height_cm));
      if (initialData.birth_year) setBirthYear(String(initialData.birth_year));
      if (initialData.gender) setGender(initialData.gender);
    }
  }, [initialData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save your profile");
        return;
      }

      let finalWeightKg = parseFloat(weightKg);
      let finalHeightCm = parseFloat(heightCm);

      if (useImperial) {
        finalWeightKg = parseFloat(weightLbs) * 0.453592;
        const totalInches = (parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0);
        finalHeightCm = totalInches * 2.54;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({
          weight_kg: finalWeightKg || null,
          height_cm: finalHeightCm || null,
          birth_year: parseInt(birthYear) || null,
          gender: gender || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      onOpenChange(false);
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 10 - i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <User className="h-5 w-5 text-primary" />
            Personal Details
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add your details for personalized calorie estimates during workouts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className={!useImperial ? "text-primary" : "text-muted-foreground"}>Metric</span>
            <button
              type="button"
              onClick={() => setUseImperial(!useImperial)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                useImperial ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform ${
                  useImperial ? "left-7" : "left-1"
                }`}
              />
            </button>
            <span className={useImperial ? "text-primary" : "text-muted-foreground"}>Imperial</span>
          </div>

          {useImperial ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="weightLbs" className="text-foreground">Weight (lbs)</Label>
                <Input
                  id="weightLbs"
                  type="number"
                  placeholder="e.g., 165"
                  value={weightLbs}
                  onChange={(e) => setWeightLbs(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Height</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="ft"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="bg-background border-border"
                  />
                  <Input
                    type="number"
                    placeholder="in"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="weightKg" className="text-foreground">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  placeholder="e.g., 75"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heightCm" className="text-foreground">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  placeholder="e.g., 175"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="birthYear" className="text-foreground">Birth Year</Label>
            <Select value={birthYear} onValueChange={setBirthYear}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-foreground">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
