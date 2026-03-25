import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Loader2, Star, Users } from "lucide-react";
import { motion } from "framer-motion";

interface RankedBuilder {
  user_id: string;
  name: string;
  match_score: number;
  reason: string;
  best_role: string;
}

export function BuilderRanking({ ideaId }: { ideaId: string }) {
  const [rankings, setRankings] = useState<RankedBuilder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const rankBuilders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: { action: "rank_builders", ideaId },
      });
      if (error) throw error;
      setRankings(data.rankings || []);
      setHasLoaded(true);
    } catch (e) {
      console.error("Builder ranking failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (idx: number) => {
    if (idx === 0) return "text-yellow-500";
    if (idx === 1) return "text-gray-400";
    if (idx === 2) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Builders
          </CardTitle>
          <Button variant="outline" size="sm" onClick={rankBuilders} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
            {hasLoaded ? "Refresh" : "Find Best Builders"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasLoaded ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Find the best-matching builders for this startup based on skills, experience, and execution score.
          </p>
        ) : rankings.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No builders found. More builders need to join the platform.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((builder, i) => (
              <motion.div
                key={builder.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-lg border border-border ${i === 0 ? "bg-yellow-500/5 border-yellow-500/20" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                    <Trophy className={`w-4 h-4 ${getMedalColor(i)}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{builder.name}</span>
                      {i === 0 && <Badge className="bg-yellow-500/10 text-yellow-600 border-0 text-xs">Best Fit</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{builder.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{builder.match_score}%</p>
                    <Badge variant="outline" className="text-xs">{builder.best_role}</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
