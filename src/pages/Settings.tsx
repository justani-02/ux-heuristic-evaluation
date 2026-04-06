import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { User, Settings, Save, Shield } from "lucide-react";

type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  default_analysis_mode: string;
  email_notifications: boolean;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [analysisMode, setAnalysisMode] = useState("fast");
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      // Try to fetch existing profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
        setLoading(false);
        return;
      }

      if (data) {
        const p = data as unknown as Profile;
        setProfile(p);
        setDisplayName(p.display_name || "");
        setAnalysisMode(p.default_analysis_mode || "fast");
        setEmailNotifications(p.email_notifications ?? true);
      } else {
        // Create profile for existing user (trigger only fires on new signups)
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ user_id: user!.id, display_name: "" })
          .select()
          .single();

        if (!insertError && newProfile) {
          const p = newProfile as unknown as Profile;
          setProfile(p);
          setDisplayName(p.display_name || "");
          setAnalysisMode(p.default_analysis_mode || "fast");
          setEmailNotifications(p.email_notifications ?? true);
        }
      }
      setLoading(false);
    }

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;

    const trimmedName = displayName.trim().slice(0, 100);
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedName,
        default_analysis_mode: analysisMode,
        email_notifications: emailNotifications,
      })
      .eq("user_id", user!.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } else {
      setDisplayName(trimmedName);
      toast({ title: "Saved", description: "Your settings have been updated." });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="container max-w-2xl mx-auto px-6 py-12 text-center">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Sign in required</h3>
          <p className="text-sm text-muted-foreground mb-4">Please sign in to access your settings.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your profile and preferences
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted/30"
                  />
                  <p className="text-xs text-muted-foreground">Your email is managed through authentication.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {displayName.length}/100 characters
                  </p>
                </div>

                <Separator />

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>
                    User ID: {user.id.slice(0, 8)}… · Joined{" "}
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Preferences
                </CardTitle>
                <CardDescription>Customize your analysis experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="analysisMode">Default Analysis Mode</Label>
                  <Select value={analysisMode} onValueChange={setAnalysisMode}>
                    <SelectTrigger id="analysisMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">Fast Mode (1 run)</SelectItem>
                      <SelectItem value="reliable">Reliable Mode (3 runs)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Reliable Mode runs 3 parallel analyses for higher confidence scores.
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive updates when analyses complete
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
