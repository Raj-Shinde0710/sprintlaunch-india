import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Zap, CheckSquare, Users, GitBranch, Bot, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const eventIcons: Record<string, any> = {
  task_completed: CheckSquare,
  member_joined: Users,
  status_change: Zap,
  code_committed: GitBranch,
  file_uploaded: GitBranch,
  ai_mentor_chat: Bot,
  ai_mentor_analysis: Bot,
  default: Clock,
};

const eventColors: Record<string, string> = {
  task_completed: "bg-green-100 text-green-600",
  member_joined: "bg-blue-100 text-blue-600",
  status_change: "bg-orange-100 text-orange-600",
  code_committed: "bg-purple-100 text-purple-600",
  file_uploaded: "bg-teal-100 text-teal-600",
  ai_mentor_chat: "bg-indigo-100 text-indigo-600",
  default: "bg-muted text-muted-foreground",
};

export default function Timeline() {
  const { user } = useAuth();

  const { data: events = [] } = useQuery({
    queryKey: ["all-timeline", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("sprint_timeline")
        .select("*, sprints(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Timeline</h1>
          <p className="text-muted-foreground text-sm">Activity across all your sprints</p>
        </div>

        <div className="space-y-1">
          {events.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No activity yet</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event: any, i: number) => {
              const Icon = eventIcons[event.event_type] || eventIcons.default;
              const color = eventColors[event.event_type] || eventColors.default;
              return (
                <div key={event.id} className="flex gap-3 py-3">
                  <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{event.event_type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.sprints?.name} · {format(new Date(event.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
