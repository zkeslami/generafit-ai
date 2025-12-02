import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Mail, Loader2, Send } from "lucide-react";

interface NotificationSettingsProps {
  initialEnabled?: boolean;
  initialEmail?: string | null;
  onUpdate?: () => void;
}

export function NotificationSettings({ initialEnabled, initialEmail, onUpdate }: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled ?? false);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    fetchUserEmail();
  }, []);

  useEffect(() => {
    setEnabled(initialEnabled ?? false);
    setEmail(initialEmail ?? "");
  }, [initialEnabled, initialEmail]);

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserEmail(user.email);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to update settings");
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({
          email_notifications: enabled,
          notification_email: email || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Notification settings saved");
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first");
        return;
      }

      const targetEmail = email || userEmail;
      if (!targetEmail) {
        toast.error("No email address available");
        return;
      }

      const { error } = await supabase.functions.invoke('send-daily-workout', {
        body: { 
          testMode: true, 
          userId: user.id,
          testEmail: targetEmail 
        }
      });

      if (error) throw error;

      toast.success(`Test email sent to ${targetEmail}`);
    } catch (error: any) {
      console.error("Test email error:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  const targetEmailDisplay = email || userEmail || "your account email";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-4 h-4 text-primary" />
          Daily Workout Email
        </CardTitle>
        <CardDescription>
          Receive your personalized workout at 6am daily
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Enable daily emails</Label>
            <p className="text-xs text-muted-foreground">
              Get a workout suggestion every morning
            </p>
          </div>
          <Switch
            id="notifications"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="notification-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email address (optional)
              </Label>
              <Input
                id="notification-email"
                type="email"
                placeholder={userEmail || "Use account email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use your account email ({userEmail || "not set"})
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTest}
                disabled={sendingTest}
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
