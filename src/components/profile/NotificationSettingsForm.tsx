import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

interface NotificationSettingsFormProps {
  profile: any;
  onUpdate: () => void;
}

export function NotificationSettingsForm({ profile, onUpdate }: NotificationSettingsFormProps) {
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (profile) {
      setEnabled(profile.email_notifications || false);
      setEmail(profile.notification_email || "");
    }
    fetchUserEmail();
  }, [profile]);

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setUserEmail(user.email);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          email_notifications: enabled,
          notification_email: email || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Notification settings saved");
      onUpdate();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const targetEmail = email || userEmail;
      if (!targetEmail) {
        toast.error("Please enter an email address");
        return;
      }

      const { error } = await supabase.functions.invoke("send-daily-workout", {
        body: { testEmail: targetEmail },
      });

      if (error) throw error;
      toast.success("Test email sent!");
    } catch (error) {
      console.error("Error sending test:", error);
      toast.error("Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground">Manage your email notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Daily Workout Emails
          </CardTitle>
          <CardDescription>
            Receive personalized workout suggestions every morning at 6 AM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable daily emails</Label>
              <p className="text-sm text-muted-foreground">
                Get a workout recommendation every day
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Notification Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={userEmail || "Enter email address"}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use your account email ({userEmail})
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSendTest}
              disabled={sendingTest}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingTest ? "Sending..." : "Send Test Email"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}