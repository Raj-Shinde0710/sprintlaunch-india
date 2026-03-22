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
import {
  ArrowLeft,
  IndianRupee,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  AlertTriangle,
  TrendingUp,
  Video,
  FileText,
  MessageSquare,
  Shield,
  ArrowUpRight,
} from "lucide-react";

export default function BackerInvestmentDashboard() {
  const { id: sprintId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [commitment, setCommitment] = useState<{
    id: string;
    amount: number;
    status: string;
    unlock_milestone: string | null;
  } | null>(null);
  const [sprint, setSprint] = useState<{
    id: string;
    name: string;
    status: string;
    progress: number;
    end_date: string | null;
    start_date: string | null;
    team_formed: boolean;
    goals_defined: boolean;
    tasks_assigned: boolean;
    mid_review_done: boolean;
    deliverables_submitted: boolean;
    demo_video_url: string | null;
    demo_notes: string | null;
  } | null>(null);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaId, setIdeaId] = useState("");
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sprintId && user) fetchAll();
  }, [sprintId, user]);

  const fetchAll = async () => {
    if (!sprintId || !user) return;

    const { data: commitmentData } = await supabase
      .from("commitments")
      .select("id, amount, status, unlock_milestone")
      .eq("sprint_id", sprintId)
      .eq("backer_id", user.id)
      .maybeSingle();

    if (!commitmentData) {
      navigate("/dashboard");
      return;
    }
    setCommitment(commitmentData);

    const { data: sprintData } = await supabase
      .from("sprints")
      .select("id, name, status, progress, end_date, start_date, team_formed, goals_defined, tasks_assigned, mid_review_done, deliverables_submitted, demo_video_url, demo_notes, idea:ideas(id, title)")
      .eq("id", sprintId)
      .single();

    if (sprintData) {
      const idea = sprintData.idea as unknown as { id: string; title: string };
      setSprint(sprintData as unknown as typeof sprint);
      setIdeaTitle(idea.title);
      setIdeaId(idea.id);
    }

    const { count: taskTotal } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("sprint_id", sprintId);

    const { count: taskDone } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("sprint_id", sprintId)
      .eq("status", "done");

    setTaskStats({ total: taskTotal || 0, done: taskDone || 0 });

    const { count: members } = await supabase
      .from("sprint_members")
      .select("*", { count: "exact", head: true })
      .eq("sprint_id", sprintId)
      .is("left_at", null);

    setMemberCount(members || 0);
    setLoading(false);
  };

  const handleRequestUpdate = async () => {
    if (!sprintId || !user) return;
    const { error } = await supabase.from("demo_requests").insert({
      sprint_id: sprintId,
      backer_id: user.id,
      request_type: "update",
      message: "Requesting a progress update from the team.",
    });
    if (!error) toast({ title: "Update requested" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-5 h-5 text-yellow-600" />;
      case "locked": return <Lock className="w-5 h-5 text-blue-600" />;
      case "released": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "refunded": return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getRiskLevel = () => {
    if (!sprint) return "unknown";
    if (sprint.status === "failed") return "failed";
    if (sprint.progress < 30 && sprint.status === "active") return "slow";
    if (sprint.progress >= 30) return "healthy";
    return "unknown";
  };

  const riskLevel = getRiskLevel();
  const riskConfig: Record<string, { label: string; color: string }> = {
    healthy: { label: "Healthy", color: "bg-green-500/10 text-green-600" },
    slow: { label: "Slow Progress", color: "bg-yellow-500/10 text-yellow-600" },
    failed: { label: "Failed", color: "bg-red-500/10 text-red-600" },
    unknown: { label: "Unknown", color: "bg-muted text-muted-foreground" },
  };

  const daysRemaining = sprint?.end_date
    ? Math.max(0, Math.ceil((new Date(sprint.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-backer" />
        </div>
      </main>
    );
  }

  if (!commitment || !sprint) return null;

  const milestones = [
    { label: "Team Formed", done: sprint.team_formed },
    { label: "Goals Defined", done: sprint.goals_defined },
    { label: "Tasks Assigned", done: sprint.tasks_assigned },
    { label: "Mid-Sprint Review", done: sprint.mid_review_done },
    { label: "Deliverables Submitted", done: sprint.deliverables_submitted },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Investment Dashboard</h1>
            <Link to={`/idea/${ideaId}`} className="text-muted-foreground hover:text-foreground text-sm">
              {ideaTitle}
            </Link>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-backer/20">
              <CardContent className="pt-6 text-center">
                <IndianRupee className="w-6 h-6 text-backer mx-auto mb-2" />
                <p className="text-2xl font-bold">₹{Number(commitment.amount).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Committed</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getStatusIcon(commitment.status)}
                </div>
                <p className="text-lg font-bold capitalize">{commitment.status}</p>
                <p className="text-xs text-muted-foreground">Commitment Status</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="w-6 h-6 text-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">{sprint.progress}%</p>
                <p className="text-xs text-muted-foreground">Sprint Progress</p>
                <Progress value={sprint.progress} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="pt-6 text-center">
                <Badge className={`${riskConfig[riskLevel].color} text-sm`}>
                  {riskLevel === "slow" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {riskConfig[riskLevel].label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">Risk Indicator</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-backer" />
                  Milestones & Unlock Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {commitment.unlock_milestone && (
                  <div className="p-3 rounded-lg bg-backer/5 border border-backer/20 mb-4">
                    <p className="text-sm font-medium text-backer">Unlock condition: {commitment.unlock_milestone}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {m.done ? (
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={m.done ? "text-foreground" : "text-muted-foreground"}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deliverables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-backer" />
                  Deliverables & Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold">{taskStats.done}/{taskStats.total}</p>
                    <p className="text-xs text-muted-foreground">Tasks Completed</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold">{memberCount}</p>
                    <p className="text-xs text-muted-foreground">Team Members</p>
                  </div>
                </div>
                {sprint.demo_video_url && (
                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-4 h-4 text-backer" />
                      <span className="font-medium text-sm">Demo Video</span>
                    </div>
                    <a href={sprint.demo_video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-backer hover:underline flex items-center gap-1">
                      Watch Demo <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {sprint.demo_notes && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">{sprint.demo_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sprint Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sprint Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sprint</span>
                  <span className="font-medium">{sprint.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="capitalize">{sprint.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Left</span>
                  <span className="font-medium">{daysRemaining}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Size</span>
                  <span className="font-medium">{memberCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" size="sm" onClick={handleRequestUpdate}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request Update
                </Button>
                <Link to={`/sprint/${sprintId}`} className="block">
                  <Button variant="backer" className="w-full" size="sm">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Full Sprint
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
