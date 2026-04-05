import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Tasks() {
  const { user } = useAuth();

  const { data: tasks = [] } = useQuery({
    queryKey: ["user-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("tasks")
        .select("*, sprints(name)")
        .or(`assignee_id.eq.${user.id},created_by.eq.${user.id}`)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const todoTasks = tasks.filter((t: any) => t.status === "todo");
  const inProgress = tasks.filter((t: any) => t.status === "in_progress");
  const doneTasks = tasks.filter((t: any) => t.status === "done");

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm">All your tasks across sprints</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={AlertCircle} label="To Do" count={todoTasks.length} color="text-orange-500" />
          <StatCard icon={Clock} label="In Progress" count={inProgress.length} color="text-blue-500" />
          <StatCard icon={CheckSquare} label="Done" count={doneTasks.length} color="text-green-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskColumn title="To Do" tasks={todoTasks} variant="warning" />
          <TaskColumn title="In Progress" tasks={inProgress} variant="info" />
          <TaskColumn title="Done" tasks={doneTasks} variant="success" />
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, count, color }: any) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskColumn({ title, tasks, variant }: any) {
  const colors: Record<string, string> = {
    warning: "border-orange-200 bg-orange-50/50",
    info: "border-blue-200 bg-blue-50/50",
    success: "border-green-200 bg-green-50/50",
  };

  return (
    <div className={`rounded-xl border-2 ${colors[variant]} p-4 space-y-3`}>
      <h3 className="font-semibold text-sm">{title} ({tasks.length})</h3>
      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
      ) : (
        tasks.map((task: any) => (
          <Card key={task.id} className="shadow-sm">
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium">{task.title}</p>
              {task.sprints?.name && (
                <Badge variant="outline" className="text-xs">{task.sprints.name}</Badge>
              )}
              {task.priority && (
                <Badge variant={task.priority >= 3 ? "destructive" : "secondary"} className="text-xs ml-1">
                  P{task.priority}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
