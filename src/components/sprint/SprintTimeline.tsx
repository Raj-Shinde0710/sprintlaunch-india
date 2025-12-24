import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  UserPlus,
  UserMinus,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Flag,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  user_id: string | null;
  user?: {
    full_name: string | null;
  };
}

interface SprintTimelineProps {
  sprintId: string;
}

const eventConfig: Record<
  string,
  { icon: typeof Activity; color: string; label: string }
> = {
  sprint_activated: { icon: Play, color: "text-green-600", label: "Sprint Started" },
  sprint_paused: { icon: Pause, color: "text-yellow-600", label: "Sprint Paused" },
  sprint_resumed: { icon: Play, color: "text-green-600", label: "Sprint Resumed" },
  sprint_completed: { icon: Flag, color: "text-blue-600", label: "Sprint Completed" },
  sprint_failed: { icon: XCircle, color: "text-red-600", label: "Sprint Failed" },
  status_change: { icon: Activity, color: "text-foreground", label: "Status Changed" },
  member_joined: { icon: UserPlus, color: "text-builder", label: "Member Joined" },
  member_exit: { icon: UserMinus, color: "text-red-600", label: "Member Left" },
  task_created: { icon: CheckCircle2, color: "text-foreground", label: "Task Created" },
  task_completed: { icon: CheckCircle2, color: "text-green-600", label: "Task Completed" },
  task_status_changed: { icon: Activity, color: "text-foreground", label: "Task Updated" },
  hours_logged: { icon: Clock, color: "text-builder", label: "Hours Logged" },
  inactivity_warning: { icon: AlertTriangle, color: "text-yellow-600", label: "Inactivity Warning" },
  auto_failed: { icon: XCircle, color: "text-red-600", label: "Auto-Failed" },
};

export function SprintTimeline({ sprintId }: SprintTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [sprintId]);

  const fetchTimeline = async () => {
    const { data } = await supabase
      .from("sprint_timeline")
      .select(`
        *,
        user:profiles!sprint_timeline_user_id_fkey (
          full_name
        )
      `)
      .eq("sprint_id", sprintId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setEvents(data as unknown as TimelineEvent[]);
    }
    setLoading(false);
  };

  const formatEventDescription = (event: TimelineEvent) => {
    const data = event.event_data;

    switch (event.event_type) {
      case "status_change":
        return `Status changed from ${data.old_status} to ${data.new_status}`;
      case "task_created":
        return `Created task: "${data.task_title}"`;
      case "task_status_changed":
        return `"${data.task_title}" moved to ${data.new_status}`;
      case "hours_logged":
        return `Logged ${data.hours} hours on "${data.task_title}"`;
      case "member_exit":
        return `Left the sprint (${data.role}, ${data.equity_forfeited}% equity forfeited)`;
      case "inactivity_warning":
        return `Sprint inactive for ${data.days_inactive} days`;
      case "auto_failed":
        return `Sprint auto-failed: ${data.reason}`;
      default:
        return JSON.stringify(data);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-founder"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Sprint Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No activity yet
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {events.map((event) => {
                const config = eventConfig[event.event_type] || {
                  icon: Activity,
                  color: "text-muted-foreground",
                  label: event.event_type,
                };
                const Icon = config.icon;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-card border-2 border-border ${config.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{config.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(event.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {formatEventDescription(event)}
                      </p>

                      {event.user?.full_name && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          by {event.user.full_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
