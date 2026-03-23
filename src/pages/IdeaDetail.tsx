import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { IdeaTeamSection } from "@/components/idea/IdeaTeamSection";
import { ApplicationFormDialog } from "@/components/sprint/ApplicationFormDialog";
import { FounderApplicationManager } from "@/components/sprint/FounderApplicationManager";
import { 
  MapPin, Clock, Users, Verified, ArrowLeft, Calendar, Target,
  Briefcase, DollarSign, Lock, Rocket, UserPlus, Eye, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Idea {
  id: string;
  title: string;
  pitch: string;
  problem_statement: string | null;
  target_users: string | null;
  industry: string[] | null;
  stage: string | null;
  required_roles: string[] | null;
  sprint_duration: number | null;
  weekly_commitment: number | null;
  competitive_analysis_summary: string | null;
  is_published: boolean | null;
  readiness_status: string | null;
  founder_id: string;
  created_at: string | null;
}

interface FounderProfile {
  id: string;
  full_name: string | null;
  email: string;
  location: string | null;
  is_verified: boolean | null;
  execution_score: number | null;
  sprints_completed: number | null;
}

interface Sprint {
  id: string;
  name: string;
  status: string | null;
  progress: number | null;
  start_date: string | null;
  end_date: string | null;
}

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [founder, setFounder] = useState<FounderProfile | null>(null);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const isOwner = user?.id === idea?.founder_id;

  useEffect(() => {
    if (!id) return;
    fetchIdea();
  }, [id, user]);

  const fetchIdea = async () => {
    setLoading(true);
    setError(null);

    const { data: ideaData, error: ideaError } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (ideaError) { setError("Failed to load idea"); setLoading(false); return; }
    if (!ideaData) { setError("Idea not found"); setLoading(false); return; }
    if (!ideaData.is_published && ideaData.founder_id !== user?.id) {
      setError("This idea is not available"); setLoading(false); return;
    }

    setIdea(ideaData);

    // Fetch founder profile
    const { data: founderData } = await supabase
      .from("profiles")
      .select("id, full_name, email, location, is_verified, execution_score, sprints_completed")
      .eq("id", ideaData.founder_id)
      .maybeSingle();
    if (founderData) setFounder(founderData);

    // Fetch sprint (any status)
    let { data: sprintData } = await supabase
      .from("sprints")
      .select("id, name, status, progress, start_date, end_date")
      .eq("idea_id", id!)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Auto-create a draft sprint if none exists and user is the founder
    if (!sprintData && ideaData.founder_id === user?.id) {
      const { data: newSprint } = await supabase
        .from("sprints")
        .insert({
          idea_id: ideaData.id,
          name: `${ideaData.title} Sprint`,
          duration_days: ideaData.sprint_duration || 14,
          status: "draft",
        })
        .select("id, name, status, progress, start_date, end_date")
        .single();

      if (newSprint) {
        sprintData = newSprint;
        // Add founder as sprint member
        await supabase.from("sprint_members").insert({
          user_id: user!.id,
          sprint_id: newSprint.id,
          role: "Founder",
          is_founder: true,
        });
      }
    }

    if (sprintData) {
      setSprint(sprintData);

      const { count } = await supabase
        .from("sprint_applications")
        .select("*", { count: "exact", head: true })
        .eq("sprint_id", sprintData.id);
      setApplicationCount(count || 0);

      if (user) {
        const { data: myApp } = await supabase
          .from("sprint_applications")
          .select("status")
          .eq("sprint_id", sprintData.id)
          .eq("user_id", user.id)
          .maybeSingle();
        setApplicationStatus(myApp?.status || null);
      }
    }

    setLoading(false);
  };

  const handleCommit = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to commit funds" });
      return;
    }
    toast({ title: "Commit Funds", description: "Investment feature coming soon!" });
  };

  const canJoinSprint = sprint && ["draft", "active"].includes(sprint.status || "");

  const renderBuilderCTA = () => {
    if (!sprint) return (
      <Button className="w-full" variant="builder" disabled>
        <Clock className="w-4 h-4 mr-2" /> Sprint Not Available
      </Button>
    );

    // Check application status first
    switch (applicationStatus) {
      case "pending":
        return (
          <Button className="w-full" variant="outline" disabled>
            <CheckCircle2 className="w-4 h-4 mr-2 text-yellow-600" /> Applied ✅
          </Button>
        );
      case "accepted":
        return (
          <Link to={`/builder-workspace/${sprint.id}`} className="block">
            <Button className="w-full" variant="builder">
              <Rocket className="w-4 h-4 mr-2" /> View Sprint Workspace
            </Button>
          </Link>
        );
      case "rejected":
        return (
          <Button className="w-full" variant="outline" disabled>
            <XCircle className="w-4 h-4 mr-2 text-destructive" /> Application Rejected
          </Button>
        );
      default:
        // Check if sprint allows joining
        if (!canJoinSprint) {
          return (
            <Button className="w-full" variant="outline" disabled>
              <Lock className="w-4 h-4 mr-2" /> Sprint {sprint.status} — Joining Closed
            </Button>
          );
        }
        return (
          <Button className="w-full" variant="builder" onClick={() => setShowApplicationForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Apply to Join Sprint
          </Button>
        );
    }
  };

  if (loading || authLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto py-16">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{error}</h1>
            <p className="text-muted-foreground mb-6">This idea may be private or no longer available.</p>
            <Link to="/discover"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Discover</Button></Link>
          </div>
        </div>
      </main>
    );
  }

  if (!idea) return null;

  const stageColors: Record<string, string> = {
    idea: "bg-muted text-muted-foreground",
    validation: "bg-yellow-500/10 text-yellow-600",
    prototype: "bg-builder/10 text-builder",
    mvp: "bg-founder/10 text-founder",
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <Link to="/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Discover
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className={stageColors[idea.stage || "idea"]}>{idea.stage || "Idea"}</Badge>
              {idea.readiness_status === "published" && (
                <Badge variant="outline" className="border-builder text-builder"><Eye className="w-3 h-3 mr-1" />Published</Badge>
              )}
              {idea.industry?.map((ind) => <Badge key={ind} variant="outline">{ind}</Badge>)}
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">{idea.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{idea.pitch}</p>

            {founder && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-founder/10 flex items-center justify-center text-founder font-bold">
                  {founder.full_name?.charAt(0) || founder.email.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{founder.full_name || founder.email.split("@")[0]}</span>
                    {founder.is_verified && <Verified className="w-4 h-4 text-builder" />}
                    {founder.execution_score && founder.execution_score > 70 && (
                      <Badge variant="secondary" className="text-xs">{founder.execution_score}% Execution</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {founder.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{founder.location}</span>}
                    {founder.sprints_completed && founder.sprints_completed > 0 && (
                      <span className="flex items-center gap-1"><Rocket className="w-3 h-3" />{founder.sprints_completed} sprints</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {idea.problem_statement && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-founder" /> Problem Statement
                  </h2>
                  <p className="text-muted-foreground">{idea.problem_statement}</p>
                </motion.div>
              )}

              {idea.target_users && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-builder" /> Target Users
                  </h2>
                  <p className="text-muted-foreground">{idea.target_users}</p>
                </motion.div>
              )}

              {idea.competitive_analysis_summary && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-backer" /> Competitive Landscape
                  </h2>
                  <p className="text-muted-foreground">{idea.competitive_analysis_summary}</p>
                </motion.div>
              )}

              {idea.required_roles && idea.required_roles.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-builder" /> Looking For
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {idea.required_roles.map((role) => (
                      <Badge key={role} className="bg-builder/10 text-builder border-0 px-3 py-1">{role}</Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Team & Backers Section */}
              <IdeaTeamSection ideaId={idea.id} sprintId={sprint?.id} />

              {/* Founder Application Manager */}
              {isOwner && sprint && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <FounderApplicationManager sprintId={sprint.id} />
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 border border-border/50">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Sprint Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" />Duration</span>
                    <span className="font-medium">{idea.sprint_duration || 14} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" />Commitment</span>
                    <span className="font-medium">{idea.weekly_commitment || 10} hrs/week</span>
                  </div>
                  {sprint && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2"><Rocket className="w-4 h-4" />Status</span>
                        <Badge variant="outline" className="capitalize">{sprint.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" />Applicants</span>
                        <span className="font-medium text-builder">{applicationCount}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  {!user ? (
                    <>
                      <div className="text-sm text-center text-muted-foreground mb-3 p-3 rounded-lg bg-muted/50">
                        <Lock className="w-4 h-4 inline mr-2" />Log in to join this startup
                      </div>
                      <Link to="/auth" className="block">
                        <Button className="w-full" variant="founder">Log In to Apply</Button>
                      </Link>
                    </>
                  ) : isOwner ? (
                    sprint ? (
                      <Link to={`/sprint/${sprint.id}`}>
                        <Button className="w-full" variant="founder"><Rocket className="w-4 h-4 mr-2" />Go to Sprint Workspace</Button>
                      </Link>
                    ) : (
                      <Link to={`/idea/${idea.id}/edit`}>
                        <Button className="w-full" variant="founder">Manage Idea</Button>
                      </Link>
                    )
                  ) : userRole === "builder" ? (
                    renderBuilderCTA()
                  ) : userRole === "backer" ? (
                    <Button className="w-full" variant="backer" onClick={handleCommit}>
                      <DollarSign className="w-4 h-4 mr-2" />Commit Funds
                    </Button>
                  ) : userRole === "founder" ? (
                    <Button className="w-full" variant="outline" disabled>
                      <Eye className="w-4 h-4 mr-2" />Viewing as Founder
                    </Button>
                  ) : (
                    <Link to="/auth" className="block">
                      <Button className="w-full" variant="founder">Log In to Apply</Button>
                    </Link>
                  )}
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-founder">{idea.required_roles?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Roles Needed</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-builder">{applicationCount}</div>
                    <div className="text-xs text-muted-foreground">Applied</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Dialog */}
      {sprint && idea && (
        <ApplicationFormDialog
          open={showApplicationForm}
          onOpenChange={setShowApplicationForm}
          sprintId={sprint.id}
          ideaTitle={idea.title}
          requiredRoles={idea.required_roles || []}
          onApplicationSubmitted={() => {
            setApplicationStatus("pending");
            setApplicationCount((c) => c + 1);
          }}
        />
      )}

      <Footer />
    </main>
  );
}
