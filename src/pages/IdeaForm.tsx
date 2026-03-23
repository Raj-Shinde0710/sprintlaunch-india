import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { checkIdeaReadiness } from "@/lib/sprint-logic";
import {
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Target,
  Users,
  Clock,
} from "lucide-react";

const industries = [
  "FinTech",
  "EdTech",
  "HealthTech",
  "E-commerce",
  "SaaS",
  "AI/ML",
  "Logistics",
  "AgriTech",
  "CleanTech",
  "Social",
  "Gaming",
  "Other",
];

const roleOptions = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile Developer",
  "UI/UX Designer",
  "Product Manager",
  "Data Scientist",
  "DevOps Engineer",
  "Marketing Lead",
  "Growth Hacker",
  "Business Analyst",
  "Other",
];

export default function IdeaForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    pitch: "",
    problem_statement: "",
    target_users: "",
    industry: [] as string[],
    stage: "idea" as "idea" | "validation" | "prototype" | "mvp",
    required_roles: [] as string[],
    sprint_duration: 14,
    weekly_commitment: 10,
    validation_proof: "",
    has_user_interviews: false,
    has_problem_validation: false,
    competitive_analysis_summary: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchIdea();
    }
  }, [id, user]);

  const fetchIdea = async () => {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", id)
      .eq("founder_id", user?.id)
      .single();

    if (error || !data) {
      toast({ title: "Idea not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    setFormData({
      title: data.title || "",
      pitch: data.pitch || "",
      problem_statement: data.problem_statement || "",
      target_users: data.target_users || "",
      industry: data.industry || [],
      stage: data.stage || "idea",
      required_roles: data.required_roles || [],
      sprint_duration: data.sprint_duration || 14,
      weekly_commitment: data.weekly_commitment || 10,
      validation_proof: data.validation_proof || "",
      has_user_interviews: data.has_user_interviews || false,
      has_problem_validation: data.has_problem_validation || false,
      competitive_analysis_summary: data.competitive_analysis_summary || "",
    });
  };

  const readiness = checkIdeaReadiness({
    validation_proof: formData.validation_proof,
    has_user_interviews: formData.has_user_interviews,
    has_problem_validation: formData.has_problem_validation,
    competitive_analysis_summary: formData.competitive_analysis_summary,
  });

  const handleSave = async (publish: boolean = false) => {
    if (!user) return;

    if (publish && !readiness.ready) {
      toast({
        title: "Cannot publish",
        description: `Missing: ${readiness.missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const ideaData = {
      ...formData,
      founder_id: user.id,
      is_published: publish,
      readiness_status: publish ? "published" : readiness.ready ? "ready" : "draft",
    };

    let result;
    if (isEditing) {
      result = await supabase
        .from("ideas")
        .update(ideaData)
        .eq("id", id)
        .eq("founder_id", user.id)
        .select()
        .single();
    } else {
      result = await supabase.from("ideas").insert(ideaData).select().single();
    }

    setSaving(false);

    if (result.error) {
      toast({ title: "Error saving idea", description: result.error.message, variant: "destructive" });
      return;
    }

    // Auto-create a sprint if new idea
    if (!isEditing) {
      await supabase.from("sprints").insert({
        idea_id: result.data.id,
        name: `${formData.title} Sprint`,
        duration_days: formData.sprint_duration || 14,
        status: "draft",
      });

      // Add founder as sprint member
      const { data: sprintRow } = await supabase
        .from("sprints")
        .select("id")
        .eq("idea_id", result.data.id)
        .single();

      if (sprintRow) {
        await supabase.from("sprint_members").insert({
          user_id: user.id,
          sprint_id: sprintRow.id,
          role: "Founder",
          is_founder: true,
        });
      }
    }

    toast({
      title: publish ? "Idea published!" : "Idea saved",
      description: publish
        ? "Your idea is now visible to builders and backers"
        : "You can continue editing later",
    });

    navigate(`/idea/${result.data.id}`);
  };

  const toggleIndustry = (ind: string) => {
    setFormData((prev) => ({
      ...prev,
      industry: prev.industry.includes(ind)
        ? prev.industry.filter((i) => i !== ind)
        : [...prev.industry, ind],
    }));
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      required_roles: prev.required_roles.includes(role)
        ? prev.required_roles.filter((r) => r !== role)
        : [...prev.required_roles, role],
    }));
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-founder"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-display">
                {isEditing ? "Edit Idea" : "Create New Idea"}
              </h1>
              <p className="text-muted-foreground">
                Step {step} of 3 -{" "}
                {step === 1 && "Basic Info"}
                {step === 2 && "Team & Sprint"}
                {step === 3 && "Validation"}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  s <= step ? "bg-founder" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-founder" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Idea Title *</Label>
                  <Input
                    id="title"
                    placeholder="A catchy name for your startup idea"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="pitch">One-Line Pitch *</Label>
                  <Input
                    id="pitch"
                    placeholder="Describe your idea in one sentence"
                    value={formData.pitch}
                    onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="problem">Problem Statement</Label>
                  <Textarea
                    id="problem"
                    placeholder="What problem are you solving? Who has this problem?"
                    value={formData.problem_statement}
                    onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                    className="mt-1.5"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="target">Target Users</Label>
                  <Input
                    id="target"
                    placeholder="Who are your ideal users/customers?"
                    value={formData.target_users}
                    onChange={(e) => setFormData({ ...formData, target_users: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Industry Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {industries.map((ind) => (
                      <Badge
                        key={ind}
                        variant={formData.industry.includes(ind) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          formData.industry.includes(ind)
                            ? "bg-founder text-white"
                            : "hover:bg-founder/10"
                        }`}
                        onClick={() => toggleIndustry(ind)}
                      >
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Current Stage</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {[
                      { value: "idea", label: "Idea", desc: "Just an idea" },
                      { value: "validation", label: "Validation", desc: "Testing the concept" },
                      { value: "prototype", label: "Prototype", desc: "Have a demo" },
                      { value: "mvp", label: "MVP", desc: "Working product" },
                    ].map((stage) => (
                      <button
                        key={stage.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, stage: stage.value as any })}
                        className={`p-3 rounded-xl border-2 text-left transition-colors ${
                          formData.stage === stage.value
                            ? "border-founder bg-founder/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <p className="font-medium">{stage.label}</p>
                        <p className="text-xs text-muted-foreground">{stage.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Team & Sprint */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-builder" />
                  Team & Sprint Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Required Roles</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select the roles you need for your sprint team
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.map((role) => (
                      <Badge
                        key={role}
                        variant={formData.required_roles.includes(role) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          formData.required_roles.includes(role)
                            ? "bg-builder text-white"
                            : "hover:bg-builder/10"
                        }`}
                        onClick={() => toggleRole(role)}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Sprint Duration</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[14, 21, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setFormData({ ...formData, sprint_duration: days })}
                        className={`p-4 rounded-xl border-2 text-center transition-colors ${
                          formData.sprint_duration === days
                            ? "border-founder bg-founder/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <p className="text-2xl font-bold">{days}</p>
                        <p className="text-sm text-muted-foreground">days</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="commitment">Weekly Commitment (hours)</Label>
                  <Input
                    id="commitment"
                    type="number"
                    min={5}
                    max={40}
                    value={formData.weekly_commitment}
                    onChange={(e) =>
                      setFormData({ ...formData, weekly_commitment: parseInt(e.target.value) || 10 })
                    }
                    className="mt-1.5 w-32"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Expected hours per week from each team member
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Validation */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-founder" />
                  Startup Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  className={`p-4 rounded-xl border-2 ${
                    readiness.ready
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-yellow-500/50 bg-yellow-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {readiness.ready ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-medium">
                      {readiness.ready ? "Ready to publish!" : "Validation required"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {readiness.ready
                      ? "Your idea meets the readiness requirements"
                      : `Complete at least one: ${readiness.missing.join(", ")}`}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="interviews"
                      checked={formData.has_user_interviews}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, has_user_interviews: checked as boolean })
                      }
                    />
                    <div>
                      <Label htmlFor="interviews" className="cursor-pointer">
                        I have conducted user interviews
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Talked to potential users about the problem
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="validation"
                      checked={formData.has_problem_validation}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, has_problem_validation: checked as boolean })
                      }
                    />
                    <div>
                      <Label htmlFor="validation" className="cursor-pointer">
                        I have validated the problem exists
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Evidence that real users face this problem
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="proof">Validation Proof (optional)</Label>
                  <Textarea
                    id="proof"
                    placeholder="Share links to surveys, interview notes, landing page stats, or other validation evidence..."
                    value={formData.validation_proof}
                    onChange={(e) => setFormData({ ...formData, validation_proof: e.target.value })}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="competitive">Competitive Analysis</Label>
                  <Textarea
                    id="competitive"
                    placeholder="Who are your competitors? How is your approach different?"
                    value={formData.competitive_analysis_summary}
                    onChange={(e) =>
                      setFormData({ ...formData, competitive_analysis_summary: e.target.value })
                    }
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>

              {step < 3 ? (
                <Button
                  variant="founder"
                  onClick={() => setStep((s) => Math.min(3, s + 1))}
                  disabled={step === 1 && (!formData.title || !formData.pitch)}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="founder"
                  onClick={() => handleSave(true)}
                  disabled={saving || !readiness.ready}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Publish Idea
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
