import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Settings, Save, Zap, ShieldCheck, Lock } from "lucide-react";

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

  const [displayName, setDisplayName] = useState("");
  const [analysisMode, setAnalysisMode] = useState("fast");
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
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
      toast({ title: "Settings updated", description: "Your changes have been saved successfully." });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="container max-w-xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Sign in required</h3>
          <p className="text-sm text-muted-foreground mb-6">Please sign in to access your settings.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container max-w-[600px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Section 1: Account */}
            <section>
              <h2 className="text-base font-semibold mb-5">Account</h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    maxLength={100}
                    className="h-11 rounded-xl border-border/60 focus-visible:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground/70 tabular-nums">
                    {displayName.length}/100
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ""}
                    disabled
                    className="h-11 rounded-xl bg-muted/40 text-muted-foreground border-transparent cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    Managed through your authentication provider
                  </p>
                </div>
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* Section 2: Analysis Preferences */}
            <section>
              <h2 className="text-base font-semibold mb-5">Analysis Preferences</h2>
              <div className="space-y-3">
                <Label className="text-sm">Default Mode</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAnalysisMode("fast")}
                    className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all ${
                      analysisMode === "fast"
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/60 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${analysisMode === "fast" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium">Fast</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Quick analysis (1 run)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnalysisMode("reliable")}
                    className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all ${
                      analysisMode === "reliable"
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/60 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${analysisMode === "reliable" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium">Reliable</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Higher confidence (3 runs)</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground/70 pt-1">
                  Reliable mode runs multiple analyses to improve consistency and confidence.
                </p>
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* Section 3: Notifications */}
            <section>
              <h2 className="text-base font-semibold mb-5">Notifications</h2>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-sm">Email me when analysis completes</span>
                  <p className="text-xs text-muted-foreground/70">
                    Get notified when your results are ready
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* Coming Soon */}
            <section className="opacity-50 pointer-events-none select-none">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold">Advanced Preferences</h2>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Custom scoring weights, export formats, and integrations</span>
              </div>
            </section>

            {/* Save */}
            <div className="flex justify-end pt-2 pb-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="min-w-[140px] h-10 rounded-xl shadow-sm"
              >
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
