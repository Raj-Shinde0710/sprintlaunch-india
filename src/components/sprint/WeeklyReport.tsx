import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, Download, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { motion } from "framer-motion";

interface ReportData {
  report: string;
  stats: {
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    teamSize: number;
    totalHoursLogged: number;
  };
  generatedAt: string;
}

export function WeeklyReport({ sprintId }: { sprintId: string }) {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: { action: "generate_report", sprintId },
      });
      if (error) throw error;
      setReports(prev => [data, ...prev]);
    } catch (e) {
      console.error("Report generation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-builder" />
            Weekly Reports
          </CardTitle>
          <Button variant="outline" size="sm" onClick={generateReport} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            Generate Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Generate a weekly report to see a summary of sprint progress, task completion, and team activity.
          </p>
        ) : (
          <div className="space-y-6">
            {reports.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(r.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{r.stats.doneTasks}/{r.stats.totalTasks}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-center">
                    <Clock className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{r.stats.inProgressTasks}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                    <AlertTriangle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{r.stats.overdueTasks}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                    <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{r.stats.totalHoursLogged}h</p>
                    <p className="text-xs text-muted-foreground">Hours Logged</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{r.report}</div>
                </div>
                {i < reports.length - 1 && <hr className="border-border" />}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
