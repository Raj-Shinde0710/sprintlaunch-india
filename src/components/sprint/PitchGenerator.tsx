import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Edit3, Save, X } from "lucide-react";
import { motion } from "framer-motion";

interface PitchSection {
  title: string;
  content: string;
}

interface PitchGeneratorProps {
  ideaId: string;
}

export function PitchGenerator({ ideaId }: PitchGeneratorProps) {
  const [sections, setSections] = useState<PitchSection[]>([]);
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: { action: "generate_pitch", ideaId },
      });
      if (error) throw error;
      setSections(data.sections || []);
      setTagline(data.tagline || "");
    } catch (e) {
      console.error("Pitch generation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditContent(sections[idx].content);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    setSections(prev => prev.map((s, i) => i === editingIdx ? { ...s, content: editContent } : s));
    setEditingIdx(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-founder" />
            AI Pitch
          </CardTitle>
          <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {sections.length > 0 ? "Regenerate" : "Generate Pitch"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Generate an AI-powered investor pitch based on your idea and sprint data.
          </p>
        ) : (
          <div className="space-y-4">
            {tagline && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg bg-founder/5 border border-founder/20 text-center">
                <p className="text-lg font-semibold italic text-foreground">"{tagline}"</p>
                <Badge className="mt-2 bg-founder/10 text-founder border-0 text-xs">Elevator Pitch</Badge>
              </motion.div>
            )}
            {sections.map((section, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground">{section.title}</h4>
                  {editingIdx === i ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEdit}><Save className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingIdx(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(i)}><Edit3 className="w-3 h-3" /></Button>
                  )}
                </div>
                {editingIdx === i ? (
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
                ) : (
                  <p className="text-sm text-muted-foreground">{section.content}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
