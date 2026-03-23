import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintId: string;
  ideaTitle: string;
  requiredRoles: string[];
  onApplicationSubmitted: () => void;
}

interface SprintQuestion {
  id: string;
  question: string;
  sort_order: number;
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  sprintId,
  ideaTitle,
  requiredRoles,
  onApplicationSubmitted,
}: ApplicationFormDialogProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [questions, setQuestions] = useState<SprintQuestion[]>([]);

  const [role, setRole] = useState(requiredRoles[0] || "Builder");
  const [availabilityHours, setAvailabilityHours] = useState(10);
  const [message, setMessage] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && sprintId) {
      fetchQuestions();
    }
  }, [open, sprintId]);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("sprint_questions")
      .select("*")
      .eq("sprint_id", sprintId)
      .order("sort_order");
    if (data) setQuestions(data);
  };

  const handleResumeUpload = async (file: File) => {
    if (!user) return;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or DOC file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("resumes").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
    setResumeUrl(urlData.publicUrl || path);
    setResumeFile(file);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!user || !sprintId) return;

    if (!resumeFile && !resumeUrl) {
      toast({ title: "Resume required", description: "Please upload your resume", variant: "destructive" });
      return;
    }

    // Validate all questions answered
    const unanswered = questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      toast({ title: "Please answer all questions", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const links = portfolioLinks
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const { error } = await supabase.from("sprint_applications").insert({
      user_id: user.id,
      sprint_id: sprintId,
      role,
      availability_hours: availabilityHours,
      message,
      resume_url: resumeUrl,
      portfolio_links: links.length > 0 ? links : null,
      answers: Object.keys(answers).length > 0 ? answers : null,
      status: "pending",
    });

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already applied", description: "You have already applied to this sprint" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }

    toast({ title: "Application submitted! ✅", description: "The founder will review your application" });
    onApplicationSubmitted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to Join Sprint</DialogTitle>
          <DialogDescription>Apply to join "{ideaTitle}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Role */}
          <div>
            <Label>Role</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {(requiredRoles.length > 0 ? requiredRoles : ["Builder"]).map((r) => (
                <Badge
                  key={r}
                  variant={role === r ? "default" : "outline"}
                  className={`cursor-pointer ${role === r ? "bg-builder text-white" : "hover:bg-builder/10"}`}
                  onClick={() => setRole(r)}
                >
                  {r}
                </Badge>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <Label htmlFor="availability">Availability (hours/week)</Label>
            <Input
              id="availability"
              type="number"
              min={5}
              max={40}
              value={availabilityHours}
              onChange={(e) => setAvailabilityHours(parseInt(e.target.value) || 10)}
              className="mt-1.5 w-32"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Short pitch / message</Label>
            <Textarea
              id="message"
              placeholder="Why do you want to join this sprint? What can you contribute?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>

          {/* Resume Upload */}
          <div>
            <Label>Resume (PDF/DOC) *</Label>
            <div className="mt-1.5">
              {resumeFile ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-builder/30 bg-builder/5">
                  <FileText className="w-5 h-5 text-builder" />
                  <span className="text-sm font-medium truncate flex-1">{resumeFile.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-builder/50 cursor-pointer transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : "Click to upload resume"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleResumeUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Portfolio Links */}
          <div>
            <Label htmlFor="portfolio">Portfolio links (optional, one per line)</Label>
            <Textarea
              id="portfolio"
              placeholder="https://github.com/username&#10;https://linkedin.com/in/username"
              value={portfolioLinks}
              onChange={(e) => setPortfolioLinks(e.target.value)}
              className="mt-1.5"
              rows={2}
            />
          </div>

          {/* Founder Questions */}
          {questions.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-sm font-medium text-foreground">Founder Questions</p>
              {questions.map((q) => (
                <div key={q.id}>
                  <Label>{q.question} *</Label>
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <Button
            className="w-full"
            variant="builder"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
