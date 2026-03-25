import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getSprintHealth,
  getSprintChecklist,
  calculateEquityDistribution,
  activateSprint,
  completeSprint,
  logSprintEvent,
  type SprintHealth,
  type SprintChecklist as SprintChecklistType,
  type EquityDistribution,
} from "@/lib/sprint-logic";
import { SprintTaskBoard } from "@/components/sprint/SprintTaskBoard";
import { SprintTimeline } from "@/components/sprint/SprintTimeline";
import { SprintDemoDay } from "@/components/sprint/SprintDemoDay";
import { EquityChart } from "@/components/sprint/EquityChart";
import { AISprintPlanner } from "@/components/sprint/AISprintPlanner";
import { RiskIndicator } from "@/components/sprint/RiskIndicator";
import { ExecutionGaps } from "@/components/sprint/ExecutionGaps";
import { WeeklyReport } from "@/components/sprint/WeeklyReport";
import { PitchGenerator } from "@/components/sprint/PitchGenerator";
import { BuilderRanking } from "@/components/sprint/BuilderRanking";
import {
  Rocket,
  ArrowLeft,
  Clock,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Flag,
  Brain,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Activity,
  Video,
} from "lucide-react";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  progress: number;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  last_activity_at: string | null;
  inactivity_warning_at: string | null;
  team_formed: boolean;
  goals_defined: boolean;
  tasks_assigned: boolean;
  mid_review_done: boolean;
  deliverables_submitted: boolean;
  demo_video_url: string | null;
  demo_notes: string | null;
  demo_visibility: string;
  pitch_deck_url: string | null;
  idea: {
    id: string;
    title: string;
    founder_id: string;
    pitch: string;
    industry: string[] | null;
    sprint_duration: number | null;
  };
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
    avatar_url: string | null;
    execution_score: number;
  } | null;
}

export default function SprintWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [members, setMembers] = useState<SprintMember[]>([]);
  const [health, setHealth] = useState<SprintHealth | null>(null);
  const [checklist, setChecklist] = useState<SprintChecklistType | null>(null);
  const [equityDistribution, setEquityDistribution] = useState<EquityDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isFounder = sprint?.idea.founder_id === user?.id;
  const isMember = members.some((m) => m.user_id === user?.id);

  useEffect(() => {
    if (id) {
      fetchSprintData();
    }
  }, [id]);

  const fetchSprintData = async () => {
    if (!id) return;

    // Fetch sprint
    const { data: sprintData, error: sprintError } = await supabase
      .from("sprints")
      .select(`
        *,
        idea:ideas (
          id,
          title,
          founder_id,
          pitch,
          industry,
          sprint_duration
        )
      `)
      .eq("id", id)
      .single();

    if (sprintError || !sprintData) {
      toast({ title: "Sprint not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    setSprint(sprintData as unknown as Sprint);
    setHealth(getSprintHealth(sprintData));
    setChecklist(getSprintChecklist(sprintData));

    // Fetch members
    const { data: membersData } = await supabase
      .from("sprint_members")
      .select(`
        id,
        user_id,
        role,
        hours_committed,
        hours_logged,
        equity_share,
        is_founder,
        profile:profiles!sprint_members_user_id_fkey (
          full_name,
          avatar_url,
          execution_score
        )
      `)
      .eq("sprint_id", id)
      .is("left_at", null);

    if (membersData) {
      setMembers(membersData as unknown as SprintMember[]);
    }

    // Calculate equity
    const equity = await calculateEquityDistribution(id);
    setEquityDistribution(equity);

    setLoading(false);
  };

  const handleActivateSprint = async () => {
    if (!sprint) return;
    setActionLoading(true);

    const result = await activateSprint(sprint.id);

    if (result.success) {
      toast({ title: "Sprint activated!", description: "The sprint is now live." });
      fetchSprintData();
    } else {
      toast({ title: "Failed to activate", description: result.error, variant: "destructive" });
    }

    setActionLoading(false);
  };

  const handleCompleteSprint = async () => {
    if (!sprint) return;
    setActionLoading(true);

    const result = await completeSprint(sprint.id);

    if (result.success) {
      toast({ title: "Sprint completed!", description: "Congratulations on finishing your sprint!" });
      fetchSprintData();
    } else {
      toast({ title: "Failed to complete", description: result.error, variant: "destructive" });
    }

    setActionLoading(false);
  };

  const handlePauseSprint = async () => {
    if (!sprint) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("sprints")
      .update({ status: "paused" })
      .eq("id", sprint.id);

    if (!error) {
      await logSprintEvent(sprint.id, "sprint_paused", {}, user?.id);
      toast({ title: "Sprint paused" });
      fetchSprintData();
    }

    setActionLoading(false);
  };

  const handleResumeSprint = async () => {
    if (!sprint) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("sprints")
      .update({ status: "active", last_activity_at: new Date().toISOString(), inactivity_warning_at: null })
      .eq("id", sprint.id);

    if (!error) {
      await logSprintEvent(sprint.id, "sprint_resumed", {}, user?.id);
      toast({ title: "Sprint resumed" });
      fetchSprintData();
    }

    setActionLoading(false);
  };

  if (loading || !sprint) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-founder"></div>
        </div>
      </main>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600";
      case "paused":
        return "bg-yellow-500/10 text-yellow-600";
      case "completed":
        return "bg-blue-500/10 text-blue-600";
      case "failed":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-display">{sprint.name}</h1>
                <Badge className={getStatusBadgeColor(sprint.status)}>
                  {sprint.status}
                </Badge>
              </div>
              <Link
                to={`/idea/${sprint.idea.id}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {sprint.idea.title}
              </Link>
            </div>
          </div>

          {isFounder && (
            <div className="flex gap-3">
              {sprint.status === "draft" && (
                <Button
                  variant="founder"
                  onClick={handleActivateSprint}
                  disabled={actionLoading || members.length < 2}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Sprint
                </Button>
              )}
              {sprint.status === "active" && (
                <>
                  <Button variant="outline" onClick={handlePauseSprint} disabled={actionLoading}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="founder" onClick={handleCompleteSprint} disabled={actionLoading}>
                    <Flag className="w-4 h-4 mr-2" />
                    Complete Sprint
                  </Button>
                </>
              )}
              {sprint.status === "paused" && (
                <Button variant="founder" onClick={handleResumeSprint} disabled={actionLoading}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume Sprint
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Inactivity Warning */}
        {health?.status === "critical" && sprint.status === "active" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border-2 border-red-500/50 bg-red-500/5"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-600">Inactivity Warning</h3>
                <p className="text-sm text-muted-foreground">{health.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-3xl font-bold">{sprint.progress}%</p>
                </div>
                <div className="p-3 rounded-xl bg-founder/10">
                  <Target className="w-6 h-6 text-founder" />
                </div>
              </div>
              <Progress value={sprint.progress} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="text-3xl font-bold">{health?.daysRemaining || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <Clock className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="text-3xl font-bold">{members.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Sprint Risk</p>
              </div>
              <RiskIndicator sprintId={sprint.id} compact />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="flex flex-wrap w-full lg:w-auto lg:inline-flex gap-1">
            <TabsTrigger value="tasks">
              <Target className="w-4 h-4 mr-2" />Tasks
            </TabsTrigger>
            {isFounder && (
              <TabsTrigger value="ai-planner">
                <Brain className="w-4 h-4 mr-2" />AI Planner
              </TabsTrigger>
            )}
            <TabsTrigger value="gaps">
              <ShieldCheck className="w-4 h-4 mr-2" />Gaps
            </TabsTrigger>
            <TabsTrigger value="risk">
              <ShieldCheck className="w-4 h-4 mr-2" />Risk
            </TabsTrigger>
            <TabsTrigger value="report">
              <Activity className="w-4 h-4 mr-2" />Report
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />Team
            </TabsTrigger>
            <TabsTrigger value="equity">
              <TrendingUp className="w-4 h-4 mr-2" />Equity
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Activity className="w-4 h-4 mr-2" />Timeline
            </TabsTrigger>
            {sprint.status === "completed" && (
              <TabsTrigger value="demo">
                <Video className="w-4 h-4 mr-2" />Demo Day
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tasks">
            <SprintTaskBoard
              sprintId={sprint.id}
              isFounder={isFounder}
              isMember={isMember}
              sprintStatus={sprint.status}
              onProgressUpdate={fetchSprintData}
            />
          </TabsContent>

          {isFounder && (
            <TabsContent value="ai-planner">
              <AISprintPlanner
                sprintId={sprint.id}
                ideaDescription={sprint.idea.pitch || sprint.idea.title}
                industry={sprint.idea.industry || []}
                sprintDuration={sprint.duration_days}
                onTasksCreated={fetchSprintData}
              />
            </TabsContent>
          )}

          <TabsContent value="gaps">
            <ExecutionGaps sprintId={sprint.id} />
          </TabsContent>

          <TabsContent value="risk">
            <RiskIndicator sprintId={sprint.id} />
          </TabsContent>

          <TabsContent value="report">
            <WeeklyReport sprintId={sprint.id} />
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {member.profile?.full_name || "Anonymous"}
                            </p>
                            {member.is_founder && (
                              <Badge className="bg-founder/10 text-founder text-xs">
                                Founder
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{member.equity_share.toFixed(1)}% equity</p>
                        <p className="text-sm text-muted-foreground">
                          {member.hours_logged}/{member.hours_committed} hours
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Score: {member.profile?.execution_score || 50}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checklist */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sprint Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: "teamFormed", label: "Team formed (min 2 members)" },
                    { key: "goalsSet", label: "Sprint goals defined" },
                    { key: "tasksAssigned", label: "Tasks assigned" },
                    { key: "midReviewDone", label: "Mid-sprint review completed" },
                    { key: "deliverablesSubmitted", label: "Deliverables submitted" },
                    { key: "sprintCompleted", label: "Sprint completed" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        checklist?.[item.key as keyof SprintChecklistType]
                          ? "bg-green-500/5"
                          : "bg-muted/30"
                      }`}
                    >
                      {checklist?.[item.key as keyof SprintChecklistType] ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span
                        className={
                          checklist?.[item.key as keyof SprintChecklistType]
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equity">
            <EquityChart
              distribution={equityDistribution}
              sprintId={sprint.id}
              isFounder={isFounder}
              sprintStatus={sprint.status}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <SprintTimeline sprintId={sprint.id} />
          </TabsContent>

          {sprint.status === "completed" && (
            <TabsContent value="demo">
              <SprintDemoDay
                sprint={sprint}
                isFounder={isFounder}
                onUpdate={fetchSprintData}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </main>
  );
}
