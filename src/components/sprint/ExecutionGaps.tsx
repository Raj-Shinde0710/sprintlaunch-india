import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ShieldAlert, Info, RefreshCw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Gap {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

const severityConfig = {
  high: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-500/5 border-red-500/30", badge: "bg-red-500/10 text-red-600" },
  medium: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-500/5 border-yellow-500/30", badge: "bg-yellow-500/10 text-yellow-600" },
  low: { icon: Info, color: "text-blue-600", bg: "bg-blue-500/5 border-blue-500/30", badge: "bg-blue-500/10 text-blue-600" },
};

export function ExecutionGaps({ sprintId }: { sprintId: string }) {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const detectGaps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: { action: "detect_gaps", sprintId },
      });
      if (error) throw error;
      setGaps(data.gaps || []);
      setHasLoaded(true);
    } catch (e) {
      console.error("Gap detection failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Execution Gaps
          </CardTitle>
          <Button variant="outline" size="sm" onClick={detectGaps} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-2">{hasLoaded ? "Refresh" : "Analyze"}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasLoaded ? (
          <p className="text-sm text-muted-foreground text-center py-6">Click "Analyze" to detect execution gaps in your sprint.</p>
        ) : gaps.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <Info className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-green-600">No execution gaps detected</p>
            <p className="text-sm text-muted-foreground">Your sprint is well-organized.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map((gap, i) => {
              const config = severityConfig[gap.severity];
              const Icon = config.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-lg border ${config.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{gap.title}</span>
                        <Badge className={`text-xs ${config.badge} border-0`}>{gap.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{gap.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
