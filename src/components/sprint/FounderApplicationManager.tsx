import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface Application {
  id: string;
  user_id: string;
  role: string;
  status: string;
  message: string | null;
  availability_hours: number | null;
  resume_url: string | null;
  portfolio_links: string[] | null;
  answers: Record<string, string> | null;
  created_at: string | null;
  profile: {
    full_name: string | null;
    email: string;
    skills: string[] | null;
    execution_score: number | null;
  } | null;
}

interface SprintQuestion {
  id: string;
  question: string;
  sort_order: number;
}

interface FounderApplicationManagerProps {
  sprintId: string;
}

export function FounderApplicationManager({ sprintId }: FounderApplicationManagerProps) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [questions, setQuestions] = useState<SprintQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [sprintId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch applications
    const { data: apps } = await supabase
      .from("sprint_applications")
      .select("*")
      .eq("sprint_id", sprintId)
      .order("created_at", { ascending: false });

    if (apps) {
      const userIds = apps.map((a) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, skills, execution_score")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      setApplications(
        apps.map((a) => ({
          ...a,
          answers: a.answers as Record<string, string> | null,
          profile: profileMap.get(a.user_id) || null,
        }))
      );
    }

    // Fetch questions
    const { data: qs } = await supabase
      .from("sprint_questions")
      .select("*")
      .eq("sprint_id", sprintId)
      .order("sort_order");
    if (qs) setQuestions(qs);

    setLoading(false);
  };

  const handleAccept = async (app: Application) => {
    setProcessing(app.id);

    // Update application status
    const { error: updateError } = await supabase
      .from("sprint_applications")
      .update({ status: "accepted" })
      .eq("id", app.id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      setProcessing(null);
      return;
    }

    // Add to sprint_members
    const { error: memberError } = await supabase.from("sprint_members").insert({
      user_id: app.user_id,
      sprint_id: sprintId,
      role: app.role,
      hours_committed: app.availability_hours || 10,
      is_founder: false,
    });

    if (memberError) {
      toast({ title: "Error adding member", description: memberError.message, variant: "destructive" });
      setProcessing(null);
      return;
    }

    // Auto-activate sprint if minimum team formed (founder + 1 builder)
    const { count: memberCount } = await supabase
      .from("sprint_members")
      .select("*", { count: "exact", head: true })
      .eq("sprint_id", sprintId)
      .is("left_at", null);

    if (memberCount && memberCount >= 2) {
      const { data: currentSprint } = await supabase
        .from("sprints")
        .select("status")
        .eq("id", sprintId)
        .single();

      if (currentSprint?.status === "draft") {
        const now = new Date();
        const { data: sprintInfo } = await supabase
          .from("sprints")
          .select("duration_days")
          .eq("id", sprintId)
          .single();

        const durationDays = sprintInfo?.duration_days || 14;
        const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await supabase.from("sprints").update({
          status: "active",
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          team_formed: true,
        }).eq("id", sprintId);
      }
    }

    toast({ title: "Application accepted! ✅", description: `${app.profile?.full_name || "Builder"} has been added to the sprint` });
    setProcessing(null);
    fetchData();
  };

  const handleReject = async (app: Application) => {
    setProcessing(app.id);
    const { error } = await supabase
      .from("sprint_applications")
      .update({ status: "rejected" })
      .eq("id", app.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Application rejected" });
    }
    setProcessing(null);
    fetchData();
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    if (questions.length >= 5) {
      toast({ title: "Maximum 5 questions", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("sprint_questions").insert({
      sprint_id: sprintId,
      question: newQuestion.trim(),
      sort_order: questions.length,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewQuestion("");
    fetchData();
  };

  const removeQuestion = async (id: string) => {
    await supabase.from("sprint_questions").delete().eq("id", id);
    fetchData();
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    accepted: "bg-green-500/10 text-green-600",
    rejected: "bg-destructive/10 text-destructive",
    withdrawn: "bg-muted text-muted-foreground",
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Application Questions Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-founder" />
            Application Questions ({questions.length}/5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <span className="text-sm flex-1">{q.question}</span>
              <Button size="icon" variant="ghost" onClick={() => removeQuestion(q.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
          {questions.length < 5 && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a question for applicants..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuestion()}
              />
              <Button size="sm" variant="outline" onClick={addQuestion}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-builder" />
            Applications ({applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-4 rounded-xl border border-border space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-builder/10 flex items-center justify-center text-builder font-bold text-sm">
                        {app.profile?.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{app.profile?.full_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.role} · {app.availability_hours || 10} hrs/week
                          {app.profile?.execution_score && (
                            <> · Score: {app.profile.execution_score}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[app.status || "pending"]}>{app.status}</Badge>
                  </div>

                  {/* Skills */}
                  {app.profile?.skills && app.profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {app.profile.skills.slice(0, 5).map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Message */}
                  {app.message && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{app.message}</p>
                  )}

                  {/* Resume */}
                  {app.resume_url && (
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-builder" />
                      <a
                        href={app.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-builder hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Resume
                      </a>
                      <a
                        href={app.resume_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-builder hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                  )}

                  {/* Portfolio Links */}
                  {app.portfolio_links && app.portfolio_links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {app.portfolio_links.map((link, i) => (
                        <a
                          key={i}
                          href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-builder hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> {(() => { try { return new URL(link.startsWith("http") ? link : `https://${link}`).hostname; } catch { return link; } })()}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Answers */}
                  {app.answers && questions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      {questions.map((q) => (
                        <div key={q.id}>
                          <p className="text-xs font-medium text-muted-foreground">{q.question}</p>
                          <p className="text-sm">{app.answers?.[q.id] || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {app.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="builder"
                        onClick={() => handleAccept(app)}
                        disabled={processing === app.id}
                      >
                        {processing === app.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(app)}
                        disabled={processing === app.id}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
