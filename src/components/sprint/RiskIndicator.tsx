import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface RiskData {
  riskLevel: "healthy" | "slow" | "at_risk";
  completionRate: number;
  overdueTasks: number;
  totalTasks: number;
  completedTasks: number;
  totalHoursLogged: number;
  totalHoursCommitted: number;
  daysRemaining: number;
  daysElapsed: number;
  suggestions: string[];
  message: string;
}

interface RiskIndicatorProps {
  sprintId: string;
  compact?: boolean;
}

export function RiskIndicator({ sprintId, compact = false }: RiskIndicatorProps) {
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeRisk();
  }, [sprintId]);

  const analyzeRisk = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: { action: "analyze_risk", sprintId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRisk(data);
    } catch (e) {
      console.error("Risk analysis failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const getRiskConfig = (level: string) => {
    switch (level) {
      case "healthy":
        return {
          icon: ShieldCheck,
          color: "text-green-600",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          label: "Healthy",
        };
      case "slow":
        return {
          icon: AlertTriangle,
          color: "text-yellow-600",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          label: "Slow",
        };
      case "at_risk":
        return {
          icon: ShieldAlert,
          color: "text-red-600",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          label: "At Risk",
        };
      default:
        return {
          icon: ShieldCheck,
          color: "text-muted-foreground",
          bg: "bg-muted",
          border: "border-border",
          label: "Unknown",
        };
    }
  };

  if (loading) {
    return compact ? (
      <Badge variant="outline" className="animate-pulse">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Analyzing...
      </Badge>
    ) : (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Analyzing sprint risk...</p>
        </CardContent>
      </Card>
    );
  }

  if (!risk) return null;

  const config = getRiskConfig(risk.riskLevel);
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge className={`${config.bg} ${config.color} ${config.border} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  return (
    <Card className={`border-2 ${config.border}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            Sprint Risk Assessment
          </span>
          <Button variant="ghost" size="sm" onClick={analyzeRisk} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-xl ${config.bg}`}>
          <div className="flex items-center gap-3 mb-2">
            <Icon className={`w-8 h-8 ${config.color}`} />
            <div>
              <p className={`font-bold text-lg ${config.color}`}>{config.label}</p>
              <p className="text-sm text-muted-foreground">{risk.message}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Completion</span>
            </div>
            <p className="text-lg font-bold">{risk.completionRate}%</p>
            <p className="text-xs text-muted-foreground">{risk.completedTasks}/{risk.totalTasks} tasks</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Time</span>
            </div>
            <p className="text-lg font-bold">{risk.daysRemaining}d left</p>
            <p className="text-xs text-muted-foreground">{risk.daysElapsed}d elapsed</p>
          </div>
          {risk.overdueTasks > 0 && (
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600">Overdue</span>
              </div>
              <p className="text-lg font-bold text-red-600">{risk.overdueTasks}</p>
              <p className="text-xs text-muted-foreground">tasks overdue</p>
            </div>
          )}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Hours</span>
            </div>
            <p className="text-lg font-bold">{risk.totalHoursLogged}h</p>
            <p className="text-xs text-muted-foreground">of {risk.totalHoursCommitted}h committed</p>
          </div>
        </div>

        {/* Suggestions */}
        {risk.suggestions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Suggestions</p>
            <div className="space-y-2">
              {risk.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">→</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
