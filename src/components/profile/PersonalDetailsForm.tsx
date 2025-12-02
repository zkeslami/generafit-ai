import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface PersonalDetailsFormProps {
  profile: any;
  onUpdate: () => void;
}

export function PersonalDetailsForm({ profile, onUpdate }: PersonalDetailsFormProps) {
  const [useImperial, setUseImperial] = useState(true);
  const [weightLbs, setWeightLbs] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.weight_kg) {
        const lbs = Math.round(profile.weight_kg * 2.20462);
        setWeightLbs(lbs.toString());
        setWeightKg(profile.weight_kg.toString());
      }
      if (profile.height_cm) {
        const totalInches = profile.height_cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inRemaining = Math.round(totalInches % 12);
        setHeightFt(ft.toString());
        setHeightIn(inRemaining.toString());
        setHeightCm(profile.height_cm.toString());
      }
      if (profile.birth_year) {
        setBirthYear(profile.birth_year.toString());
      }
      if (profile.gender) {
        setGender(profile.gender);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let finalWeightKg = null;
      let finalHeightCm = null;

      if (useImperial) {
        if (weightLbs) finalWeightKg = parseFloat(weightLbs) / 2.20462;
        if (heightFt || heightIn) {
          const totalInches = (parseInt(heightFt) || 0) * 12 + (parseInt(heightIn) || 0);
          finalHeightCm = totalInches * 2.54;
        }
      } else {
        if (weightKg) finalWeightKg = parseFloat(weightKg);
        if (heightCm) finalHeightCm = parseFloat(heightCm);
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({
          weight_kg: finalWeightKg,
          height_cm: finalHeightCm,
          birth_year: birthYear ? parseInt(birthYear) : null,
          gender: gender || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Personal details saved");
      onUpdate();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 10 - i);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Personal Details</h2>
        <p className="text-muted-foreground">Your measurements for calorie estimates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Body Measurements</CardTitle>
          <CardDescription>Used to calculate accurate calorie estimates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Unit System</Label>
            <div className="flex items-center gap-2">
              <span className={useImperial ? "text-muted-foreground" : "font-medium"}>Metric</span>
              <Switch checked={useImperial} onCheckedChange={setUseImperial} />
              <span className={useImperial ? "font-medium" : "text-muted-foreground"}>Imperial</span>
            </div>
          </div>

          {useImperial ? (
            <>
              <div className="space-y-2">
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  value={weightLbs}
                  onChange={(e) => setWeightLbs(e.target.value)}
                  placeholder="e.g., 165"
                />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      placeholder="ft"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      placeholder="in"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g., 75"
                />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="e.g., 175"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Birth Year</Label>
            <Select value={birthYear} onValueChange={setBirthYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Details"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}