import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { TeamChat } from "@/components/sprint/TeamChat";
import { SprintRepository } from "@/components/sprint/SprintRepository";
import { AIMentor } from "@/components/sprint/AIMentor";
import { SprintWorkspaceSidebar } from "@/components/sprint/SprintWorkspaceSidebar";
import { SprintSOPSection } from "@/components/sprint/SprintSOPSection";
import { SprintAutomationSection } from "@/components/sprint/SprintAutomationSection";
import { SprintFinanceSection } from "@/components/sprint/SprintFinanceSection";
import { useDepartments } from "@/hooks/useDepartments";
import { DepartmentSelector } from "@/components/sprint/DepartmentSelector";
import { DepartmentManager } from "@/components/sprint/DepartmentManager";
import { DepartmentAccessRequest } from "@/components/sprint/DepartmentAccessRequest";
import { FounderAccessRequests } from "@/components/sprint/FounderAccessRequests";
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
  const { id, departmentId: urlDepartmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [members, setMembers] = useState<SprintMember[]>([]);
  const [health, setHealth] = useState<SprintHealth | null>(null);
  const [checklist, setChecklist] = useState<SprintChecklistType | null>(null);
  const [equityDistribution, setEquityDistribution] = useState<EquityDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const isFounder = sprint?.idea.founder_id === user?.id;
  const isMember = members.some((m) => m.user_id === user?.id);
  const { departments, visibleDepartments, accessibleIds, selectedId: selectedDepartmentId, setSelectedId: setSelectedDepartmentId, refresh: refreshDepartments } = useDepartments(id, isFounder);

  // Sync selected dept with URL param
  useEffect(() => {
    if (urlDepartmentId && urlDepartmentId !== selectedDepartmentId) {
      setSelectedDepartmentId(urlDepartmentId);
    }
  }, [urlDepartmentId, selectedDepartmentId, setSelectedDepartmentId]);

  const handleDeptChange = (newId: string) => {
    setSelectedDepartmentId(newId);
    if (id) navigate(`/sprint/${id}/department/${newId}`);
  };

  useEffect(() => {
    if (id) fetchSprintData();
  }, [id]);

  // Re-fetch members when department changes (department-scoped)
  useEffect(() => {
    if (id) fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, urlDepartmentId, selectedDepartmentId]);

  const fetchMembers = async () => {
    if (!id) return;
    const deptId = urlDepartmentId || selectedDepartmentId;

    let userIds: string[] = [];
    if (deptId) {
      const { data: deptRows } = await supabase
        .from("department_members")
        .select("user_id")
        .eq("sprint_id", id)
        .eq("department_id", deptId);
      userIds = [...new Set((deptRows || []).map((d) => d.user_id))];
      if (userIds.length === 0) {
        setMembers([]);
        return;
      }
    }

    let q = supabase
      .from("sprint_members")
      .select("id, user_id, role, hours_committed, hours_logged, equity_share, is_founder")
      .eq("sprint_id", id)
      .is("left_at", null);
    if (deptId) q = q.in("user_id", userIds);
    const { data: membersData } = await q;

    const memberRows = (membersData || []) as unknown as Omit<SprintMember, "profile">[];
    if (memberRows.length === 0) {
      setMembers([]);
      return;
    }
    const ids = memberRows.map((m) => m.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, execution_score")
      .in("id", ids);
    const profileById = new Map((profilesData || []).map((p) => [p.id, p]));
    setMembers(
      memberRows.map((m) => ({
        ...m,
        profile: profileById.get(m.user_id)
          ? {
              full_name: profileById.get(m.user_id)!.full_name,
              avatar_url: profileById.get(m.user_id)!.avatar_url,
              execution_score: profileById.get(m.user_id)!.execution_score,
            }
          : null,
      }))
    );
  };

  const fetchSprintData = async () => {
    if (!id) return;
    const { data: sprintData, error: sprintError } = await supabase
      .from("sprints")
      .select(`*, idea:ideas (id, title, founder_id, pitch, industry, sprint_duration)`)
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

    const equity = await calculateEquityDistribution(id);
    setEquityDistribution(equity);
    setLoading(false);
  };

  const handleActivateSprint = async () => {
    if (!sprint) return;
    setActionLoading(true);
    const result = await activateSprint(sprint.id);
    if (result.success) {
      toast({ title: "Sprint activated!" });
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
      toast({ title: "Sprint completed!" });
      fetchSprintData();
    } else {
      toast({ title: "Failed to complete", description: result.error, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const handlePauseSprint = async () => {
    if (!sprint) return;
    setActionLoading(true);
    const { error } = await supabase.from("sprints").update({ status: "paused" }).eq("id", sprint.id);
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
    const { error } = await supabase.from("sprints").update({ status: "active", last_activity_at: new Date().toISOString(), inactivity_warning_at: null }).eq("id", sprint.id);
    if (!error) {
      await logSprintEvent(sprint.id, "sprint_resumed", {}, user?.id);
      toast({ title: "Sprint resumed" });
      fetchSprintData();
    }
    setActionLoading(false);
  };

  if (loading || !sprint) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-founder"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600";
      case "paused": return "bg-yellow-500/10 text-yellow-600";
      case "completed": return "bg-blue-500/10 text-blue-600";
      case "failed": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const equityByUserId = new Map(equityDistribution.map((e) => [e.userId, e]));

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Inactivity Warning */}
            {health?.status === "critical" && sprint.status === "active" && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border-2 border-red-500/50 bg-red-500/5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-600">Inactivity Warning</h3>
                    <p className="text-sm text-muted-foreground">{health.message}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Progress</p><p className="text-3xl font-bold">{sprint.progress}%</p></div><div className="p-3 rounded-xl bg-founder/10"><Target className="w-6 h-6 text-founder" /></div></div><Progress value={sprint.progress} className="mt-3 h-2" /></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Days Remaining</p><p className="text-3xl font-bold">{health?.daysRemaining || 0}</p></div><div className="p-3 rounded-xl bg-muted"><Clock className="w-6 h-6 text-foreground" /></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Team Size</p><p className="text-3xl font-bold">{members.length}</p></div><div className="p-3 rounded-xl bg-muted"><Users className="w-6 h-6 text-foreground" /></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Sprint Risk</p></div><RiskIndicator sprintId={sprint.id} compact /></CardContent></Card>
            </div>

            {/* Execution Gaps & Weekly Report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExecutionGaps sprintId={sprint.id} />
              <WeeklyReport sprintId={sprint.id} />
            </div>

            {/* Team */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Team Members</h3>
                {members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No members yet.</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => {
                      const eq = equityByUserId.get(member.user_id);
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{member.profile?.full_name || "Anonymous"}</p>
                                {member.is_founder && <Badge className="bg-founder/10 text-founder text-xs">Founder</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{(eq?.equityShare || 0).toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Score: {member.profile?.execution_score || 50}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checklist */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Sprint Checklist</h3>
                <div className="space-y-2">
                  {[
                    { key: "teamFormed", label: "Team formed (min 2 members)" },
                    { key: "goalsSet", label: "Sprint goals defined" },
                    { key: "tasksAssigned", label: "Tasks assigned" },
                    { key: "midReviewDone", label: "Mid-sprint review" },
                    { key: "deliverablesSubmitted", label: "Deliverables submitted" },
                    { key: "sprintCompleted", label: "Sprint completed" },
                  ].map((item) => (
                    <div key={item.key} className={`flex items-center gap-3 p-2.5 rounded-lg ${checklist?.[item.key as keyof SprintChecklistType] ? "bg-green-500/5" : "bg-muted/30"}`}>
                      {checklist?.[item.key as keyof SprintChecklistType] ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                      <span className={`text-sm ${checklist?.[item.key as keyof SprintChecklistType] ? "" : "text-muted-foreground"}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "planner":
        return <AISprintPlanner sprintId={sprint.id} ideaDescription={sprint.idea.pitch || sprint.idea.title} industry={sprint.idea.industry || []} sprintDuration={sprint.duration_days} departmentId={selectedDepartmentId} departmentName={departments.find((d) => d.id === selectedDepartmentId)?.name} onTasksCreated={fetchSprintData} />;
      case "mentor":
        return <AIMentor sprintId={sprint.id} departmentId={selectedDepartmentId} departmentName={departments.find((d) => d.id === selectedDepartmentId)?.name} />;
      case "tasks":
        return <SprintTaskBoard sprintId={sprint.id} isFounder={isFounder} isMember={isMember} sprintStatus={sprint.status} departmentId={selectedDepartmentId} onProgressUpdate={fetchSprintData} />;
      case "timeline":
        return <SprintTimeline sprintId={sprint.id} departmentId={selectedDepartmentId} />;
      case "repository":
        return <SprintRepository sprintId={sprint.id} departmentId={selectedDepartmentId} />;
      case "sop":
        return <SprintSOPSection ideaPitch={sprint.idea.pitch} ideaTitle={sprint.idea.title} sprintId={sprint.id} departmentId={selectedDepartmentId} departmentName={departments.find((d) => d.id === selectedDepartmentId)?.name} />;
      case "automation":
        return <SprintAutomationSection sprintId={sprint.id} />;
      case "finance":
        return <SprintFinanceSection />;
      case "equity":
        return <EquityChart distribution={equityDistribution} sprintId={sprint.id} isFounder={isFounder} sprintStatus={sprint.status} />;
      case "chat":
        return <TeamChat sprintId={sprint.id} departmentId={selectedDepartmentId} />;
      case "risk":
        return <RiskIndicator sprintId={sprint.id} />;
      case "demo":
        return <SprintDemoDay sprint={sprint} isFounder={isFounder} onUpdate={fetchSprintData} />;
      case "ranking":
        return <BuilderRanking ideaId={sprint.idea.id} />;
      case "pitch":
        return <PitchGenerator ideaId={sprint.idea.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sprint Internal Sidebar */}
      <SprintWorkspaceSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isFounder={isFounder}
        sprintStatus={sprint.status}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/sprint/${sprint.id}`)} className="shrink-0">
              <ArrowLeft className="w-4 h-4 mr-1" /> Departments
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold truncate">{sprint.name}</h1>
                <Badge className={`${getStatusColor(sprint.status)} text-xs`}>{sprint.status}</Badge>
                {selectedDepartmentId && (
                  <Badge variant="outline" className="text-xs">
                    Department: {departments.find((d) => d.id === selectedDepartmentId)?.name || "—"}
                  </Badge>
                )}
              </div>
              <Link to={`/idea/${sprint.idea.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {sprint.idea.title}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DepartmentSelector
              departments={visibleDepartments}
              value={selectedDepartmentId}
              onChange={handleDeptChange}
            />
            {isFounder && (
              <DepartmentManager sprintId={sprint.id} departments={departments} onChanged={refreshDepartments} />
            )}
            {!isFounder && isMember && (
              <DepartmentAccessRequest sprintId={sprint.id} departments={departments} accessibleIds={accessibleIds} />
            )}
            {isFounder && (
              <>
                {sprint.status === "draft" && (
                  <Button size="sm" variant="default" onClick={handleActivateSprint} disabled={actionLoading || members.length < 2}>
                    <Play className="w-3 h-3 mr-1" /> Start
                  </Button>
                )}
                {sprint.status === "active" && (
                  <>
                    <Button size="sm" variant="outline" onClick={handlePauseSprint} disabled={actionLoading}>
                      <Pause className="w-3 h-3 mr-1" /> Pause
                    </Button>
                    <Button size="sm" variant="default" onClick={handleCompleteSprint} disabled={actionLoading}>
                      <Flag className="w-3 h-3 mr-1" /> Complete
                    </Button>
                  </>
                )}
                {sprint.status === "paused" && (
                  <Button size="sm" variant="default" onClick={handleResumeSprint} disabled={actionLoading}>
                    <Play className="w-3 h-3 mr-1" /> Resume
                  </Button>
                )}
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {isFounder && activeSection === "dashboard" && (
            <div className="mb-6">
              <FounderAccessRequests sprintId={sprint.id} onChanged={refreshDepartments} />
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
