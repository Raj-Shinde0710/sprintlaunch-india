import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { calculateEquityDistribution, type EquityDistribution } from "@/lib/sprint-logic";
import {
  ArrowLeft,
  Clock,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  Timer,
  Activity,
  AlertTriangle,
  LogOut,
  Rocket,
  ListChecks,
  Trophy,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  hours_estimated: number | null;
  hours_logged: number | null;
  due_date: string | null;
  assignee_id: string | null;
}

interface SprintMember {
  id: string;
  user_id: string;
  role: string;
  hours_committed: number;
  hours_logged: number;
  equity_share: number;
  is_founder: boolean;
  profile: {
    full_name: string | null;
    execution_score: number | null;
  } | null;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

export default function BuilderWorkspace() {
  const { id: sprintId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sprintName, setSprintName] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaId, setIdeaId] = useState("");
  const [sprintStatus, setSprintStatus] = useState("");
  const [sprintProgress, setSprintProgress] = useState(0);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [myRole, setMyRole] = useState("");
  const [myMembership, setMyMembership] = useState<SprintMember | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<SprintMember[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [equityDist, setEquityDist] = useState<EquityDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoursToLog, setHoursToLog] = useState(1);

  useEffect(() => {
    if (sprintId && user) fetchAll();
  }, [sprintId, user]);

  const fetchAll = async () => {
    if (!sprintId || !user) return;

    const { data: sprint } = await supabase
      .from("sprints")
      .select("name, status, progress, end_date, idea:ideas(id, title)")
      .eq("id", sprintId)
      .single();

    if (!sprint) {
      navigate("/dashboard");
      return;
    }

    const idea = sprint.idea as unknown as { id: string; title: string };
    setSprintName(sprint.name);
    setSprintStatus(sprint.status || "draft");
    setSprintProgress(sprint.progress || 0);
    setEndDate(sprint.end_date);
    setIdeaTitle(idea.title);
    setIdeaId(idea.id);

    const { data: membersData } = await supabase
      .from("sprint_members")
      .select("id, user_id, role, hours_committed, hours_logged, equity_share, is_founder")
      .eq("sprint_id", sprintId)
      .is("left_at", null);

    const memberRows = (membersData || []) as unknown as Omit<SprintMember, "profile">[];
    let membersList: SprintMember[] = [];

    if (memberRows.length > 0) {
      const userIds = memberRows.map((member) => member.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, execution_score")
        .in("id", userIds);

      const profileById = new Map((profilesData || []).map((profile) => [profile.id, profile]));
      membersList = memberRows.map((member) => {
        const profile = profileById.get(member.user_id);
        return {
          ...member,
          profile: profile
            ? {
                full_name: profile.full_name,
                execution_score: profile.execution_score,
              }
            : null,
        };
      });
    }

    setMembers(membersList);
    const me = membersList.find((m) => m.user_id === user.id);
    if (me) {
      setMyRole(me.role);
      setMyMembership(me);
    }

    const { data: tasksData } = await supabase
      .from("tasks")
      .select("id, title, description, status, priority, hours_estimated, hours_logged, due_date, assignee_id")
      .eq("sprint_id", sprintId)
      .order("priority", { ascending: false });

    setTasks((tasksData || []) as Task[]);

    const { data: timelineData } = await supabase
      .from("sprint_timeline")
      .select("id, event_type, event_data, created_at")
      .eq("sprint_id", sprintId)
      .order("created_at", { ascending: false })
      .limit(20);

    setTimeline((timelineData || []) as TimelineEvent[]);

    // Calculate equity
    const equity = await calculateEquityDistribution(sprintId);
    setEquityDist(equity);

    setLoading(false);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus as "todo" | "in_progress" | "done", completed_at: newStatus === "done" ? new Date().toISOString() : null })
      .eq("id", taskId);

    if (!error) {
      toast({ title: "Task updated" });
      fetchAll();
    }
  };

  const logHours = async () => {
    if (!myMembership) return;
    const { error } = await supabase
      .from("sprint_members")
      .update({ hours_logged: (myMembership.hours_logged || 0) + hoursToLog })
      .eq("id", myMembership.id);

    if (!error) {
      toast({ title: `${hoursToLog}h logged` });
      fetchAll();
    }
  };

  const handleLeaveSprint = async () => {
    if (!myMembership || !sprintId) return;
    const confirmed = window.confirm("Are you sure? Leaving will forfeit your equity share and impact your Execution Score.");
    if (!confirmed) return;

    const { error } = await supabase
      .from("sprint_members")
      .update({ left_at: new Date().toISOString() })
      .eq("id", myMembership.id);

    if (!error) {
      toast({ title: "You have left the sprint", variant: "destructive" });
      navigate("/dashboard");
    }
  };

  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000))
    : 0;

  const myTasks = tasks.filter((t) => t.assignee_id === user?.id);
  const myCompleted = myTasks.filter((t) => t.status === "done").length;
  const myEquity = equityDist.find((entry) => entry.userId === user?.id);
  const myContributionScore = (myEquity?.tasksCompleted || 0) * 5 + (myEquity?.hoursLogged || 0);
  const noContributionsYet =
    equityDist.length > 0 &&
    equityDist.every((entry) => entry.tasksCompleted === 0 && entry.hoursLogged === 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-builder" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-display">{sprintName}</h1>
              <Link to={`/idea/${ideaId}`} className="text-muted-foreground hover:text-foreground text-sm">
                {ideaTitle} · <Badge variant="outline" className="capitalize">{sprintStatus}</Badge>
              </Link>
            </div>
          </div>
          <Badge className="bg-builder/10 text-builder px-4 py-2 text-sm">
            Your Role: {myRole}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-6 h-6 text-builder mx-auto mb-2" />
              <p className="text-2xl font-bold">{sprintProgress}%</p>
              <p className="text-xs text-muted-foreground">Progress</p>
              <Progress value={sprintProgress} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-6 h-6 text-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">{daysRemaining}</p>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Timer className="w-6 h-6 text-builder mx-auto mb-2" />
              <p className="text-2xl font-bold">{myMembership?.hours_logged || 0}</p>
              <p className="text-xs text-muted-foreground">Hours Logged</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-6 h-6 text-founder mx-auto mb-2" />
              <p className="text-2xl font-bold">{(myEquity?.equityShare || 0).toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">Equity Projection</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Tasks + Contribution */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-builder" />
                  My Tasks ({myCompleted}/{myTasks.length} done)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No tasks assigned to you yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border border-border">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {task.status === "todo" && (
                            <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, "in_progress")}>
                              Start
                            </Button>
                          )}
                          {task.status === "in_progress" && (
                            <Button size="sm" variant="builder" onClick={() => updateTaskStatus(task.id, "done")}>
                              Done
                            </Button>
                          )}
                          {task.status === "done" && (
                            <Badge className="bg-green-500/10 text-green-600">✓ Done</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Log Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-builder" />
                  Log Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={hoursToLog}
                    onChange={(e) => setHoursToLog(Number(e.target.value))}
                    className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-center"
                  />
                  <span className="text-muted-foreground">hours</span>
                  <Button variant="builder" onClick={logHours}>Log Hours</Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {myMembership?.hours_logged || 0} / {myMembership?.hours_committed || 0} hours committed
                </p>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-builder" />
                  Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {timeline.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-2 h-2 rounded-full bg-builder mt-2 shrink-0" />
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {event.event_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-builder" />
                  Team ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No sprint members yet.</p>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                          {m.profile?.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.profile?.full_name || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground">{m.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {m.is_founder && <Badge className="bg-founder/10 text-founder text-xs">Founder</Badge>}
                        <p className="text-xs text-muted-foreground">Score: {m.profile?.execution_score || 50}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Contribution & Equity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-builder" />
                  Your Equity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-builder">
                    {(myEquity?.equityShare || 0).toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sprintStatus === "completed" ? "Final Equity" : "Projected Equity"}
                  </p>
                  <Progress value={myEquity?.equityShare || 0} className="h-2 mt-3" />
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ListChecks className="w-3 h-3" /> Tasks Done
                    </span>
                    <span className="font-medium">{myEquity?.tasksCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" /> Hours
                    </span>
                    <span className="font-medium">{myEquity?.hoursLogged || 0}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Contribution</span>
                    <span className="font-medium">{myContributionScore}</span>
                  </div>
                </div>

                {noContributionsYet && (
                  <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 p-2">
                    No contributions yet — equity equally distributed
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Team Equity Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Team Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {equityDist.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No sprint members yet.</p>
                ) : (
                  [...equityDist]
                    .sort((a, b) => b.equityShare - a.equityShare)
                    .map((m, i) => (
                      <div key={m.userId} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 truncate">
                          {i === 0 && <Trophy className="w-3 h-3 text-yellow-500" />}
                          <span className={m.userId === user?.id ? "font-bold" : ""}>{m.userName}</span>
                        </span>
                        <span className="font-medium">{m.equityShare.toFixed(2)}%</span>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Leave Sprint */}
            <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleLeaveSprint}>
              <LogOut className="w-4 h-4 mr-2" />
              Leave Sprint
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
