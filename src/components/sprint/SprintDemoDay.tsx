import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Video, Upload, Eye, EyeOff, Save, ExternalLink } from "lucide-react";

interface SprintDemoDayProps {
  sprint: {
    id: string;
    name: string;
    demo_video_url: string | null;
    demo_notes: string | null;
    demo_visibility: string;
    pitch_deck_url: string | null;
  };
  isFounder: boolean;
  onUpdate: () => void;
}

export function SprintDemoDay({ sprint, isFounder, onUpdate }: SprintDemoDayProps) {
  const { toast } = useToast();
  const [demoData, setDemoData] = useState({
    demo_video_url: sprint.demo_video_url || "",
    demo_notes: sprint.demo_notes || "",
    demo_visibility: sprint.demo_visibility === "public",
    pitch_deck_url: sprint.pitch_deck_url || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("sprints")
      .update({
        demo_video_url: demoData.demo_video_url || null,
        demo_notes: demoData.demo_notes || null,
        demo_visibility: demoData.demo_visibility ? "public" : "private",
        pitch_deck_url: demoData.pitch_deck_url || null,
      })
      .eq("id", sprint.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error saving demo", variant: "destructive" });
      return;
    }

    toast({ title: "Demo day content saved!" });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-founder" />
            Demo Day Submission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Demo Video */}
          <div>
            <Label htmlFor="video">Demo Video URL</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Upload your demo video to YouTube, Loom, or Vimeo and paste the link
            </p>
            <Input
              id="video"
              placeholder="https://youtube.com/watch?v=..."
              value={demoData.demo_video_url}
              onChange={(e) =>
                setDemoData({ ...demoData, demo_video_url: e.target.value })
              }
              disabled={!isFounder}
            />
          </div>

          {/* Video Preview */}
          {demoData.demo_video_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <iframe
                src={demoData.demo_video_url
                  .replace("watch?v=", "embed/")
                  .replace("youtu.be/", "youtube.com/embed/")}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Demo Notes */}
          <div>
            <Label htmlFor="notes">Demo Notes</Label>
            <Textarea
              id="notes"
              placeholder="Describe what you built, key features, challenges overcome..."
              value={demoData.demo_notes}
              onChange={(e) =>
                setDemoData({ ...demoData, demo_notes: e.target.value })
              }
              rows={4}
              disabled={!isFounder}
            />
          </div>

          {/* Pitch Deck */}
          <div>
            <Label htmlFor="deck">Pitch Deck URL (optional)</Label>
            <Input
              id="deck"
              placeholder="https://docs.google.com/presentation/..."
              value={demoData.pitch_deck_url}
              onChange={(e) =>
                setDemoData({ ...demoData, pitch_deck_url: e.target.value })
              }
              disabled={!isFounder}
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              {demoData.demo_visibility ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Demo Visibility</p>
                <p className="text-sm text-muted-foreground">
                  {demoData.demo_visibility
                    ? "Visible to all backers and public"
                    : "Only visible to team members"}
                </p>
              </div>
            </div>
            {isFounder && (
              <Switch
                checked={demoData.demo_visibility}
                onCheckedChange={(checked) =>
                  setDemoData({ ...demoData, demo_visibility: checked })
                }
              />
            )}
          </div>

          {/* Save Button */}
          {isFounder && (
            <Button variant="founder" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Demo Content"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Public Demo Card */}
      {demoData.demo_visibility && demoData.demo_video_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎉 Public Demo Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your demo is now visible to backers. They can request next sprint
              funding or schedule meetings.
            </p>
            <div className="flex gap-3">
              <Badge className="bg-green-500/10 text-green-600">
                <Eye className="w-3 h-3 mr-1" />
                Public
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/sprint/${sprint.id}/demo`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Demo
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
