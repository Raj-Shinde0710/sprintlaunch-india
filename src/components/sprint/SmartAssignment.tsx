import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

interface Suggestion {
  user_id: string;
  name: string;
  reason: string;
  match_score: number;
}

interface SmartAssignmentProps {
  sprintId: string;
  taskTitle: string;
  taskDescription: string;
  onAssign: (userId: string) => void;
}

export function SmartAssignment({ sprintId, taskTitle, taskDescription, onAssign }: SmartAssignmentProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const getSuggestions = async () => {
    if (!taskTitle.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: { action: "suggest_assignee", sprintId, taskTitle, taskDescription },
      });
      if (error) throw error;
      setSuggestions(data.suggestions || []);
      setShown(true);
    } catch (e) {
      console.error("Smart assignment failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!shown) {
    return (
      <Button variant="ghost" size="sm" onClick={getSuggestions} disabled={loading || !taskTitle.trim()} className="text-xs">
        {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
        AI Suggest
      </Button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
      <p className="text-xs font-medium text-blue-600 flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> AI Suggested Assignees
      </p>
      {suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No suggestions available.</p>
      ) : (
        suggestions.map((s, i) => (
          <div key={s.user_id} className="flex items-center justify-between gap-2 p-2 rounded bg-background/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium truncate">{s.name}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{s.match_score}%</Badge>
                {i === 0 && <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[10px] shrink-0">Best</Badge>}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{s.reason}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => onAssign(s.user_id)}>
              <UserCheck className="w-3 h-3 mr-1" /> Assign
            </Button>
          </div>
        ))
      )}
    </motion.div>
  );
}
