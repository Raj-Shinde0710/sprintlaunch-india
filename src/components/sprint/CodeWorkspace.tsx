import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logSprintEvent } from "@/lib/sprint-logic";
import {
  Code2,
  Play,
  GitCommitHorizontal,
  Download,
  Eye,
  Clock,
  User,
  FileCode,
  Terminal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CodeCommit {
  id: string;
  user_id: string;
  code_content: string;
  language: string;
  commit_message: string;
  lines_of_code: number;
  file_name: string;
  created_at: string;
  profile?: { full_name: string | null };
}

interface CodeWorkspaceProps {
  sprintId: string;
}

const LANGUAGE_CONFIG: Record<string, { ext: string; label: string; pistonLang: string; pistonVersion: string }> = {
  javascript: { ext: "js", label: "JavaScript", pistonLang: "javascript", pistonVersion: "18.15.0" },
  python: { ext: "py", label: "Python", pistonLang: "python", pistonVersion: "3.10.0" },
  typescript: { ext: "ts", label: "TypeScript", pistonLang: "typescript", pistonVersion: "5.0.3" },
};

export function CodeWorkspace({ sprintId }: CodeWorkspaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [code, setCode] = useState("// Write your code here\n");
  const [language, setLanguage] = useState("javascript");
  const [commitMessage, setCommitMessage] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commits, setCommits] = useState<CodeCommit[]>([]);
  const [viewingCommit, setViewingCommit] = useState<CodeCommit | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(true);

  useEffect(() => {
    fetchCommits();
  }, [sprintId]);

  const fetchCommits = useCallback(async () => {
    const { data } = await supabase
      .from("code_commits")
      .select("*")
      .eq("sprint_id", sprintId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      setCommits(
        data.map((c) => ({
          ...c,
          profile: profileMap.get(c.user_id) || { full_name: null },
        }))
      );
    }
    setLoadingCommits(false);
  }, [sprintId]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setShowOutput(true);
    setOutput("Running...");

    try {
      const config = LANGUAGE_CONFIG[language];
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: config.pistonLang,
          version: config.pistonVersion,
          files: [{ content: code }],
        }),
      });

      const result = await response.json();
      const runOutput = result.run?.output || "No output";
      const stderr = result.run?.stderr || "";
      setOutput(stderr ? `${runOutput}\n\n--- Errors ---\n${stderr}` : runOutput);
    } catch {
      setOutput("Error: Could not connect to code execution service.");
    }

    setIsRunning(false);
  };

  const handleCommit = async () => {
    if (!user || !commitMessage.trim()) {
      toast({ title: "Please enter a commit message", variant: "destructive" });
      return;
    }

    setIsCommitting(true);
    const linesOfCode = code.split("\n").filter((l) => l.trim().length > 0).length;
    const config = LANGUAGE_CONFIG[language];
    const fileName = `main.${config.ext}`;

    const { error } = await supabase.from("code_commits").insert({
      sprint_id: sprintId,
      user_id: user.id,
      code_content: code,
      language,
      commit_message: commitMessage,
      lines_of_code: linesOfCode,
      file_name: fileName,
    });

    if (error) {
      toast({ title: "Commit failed", description: error.message, variant: "destructive" });
    } else {
      await logSprintEvent(sprintId, "code_committed", {
        commit_message: commitMessage,
        language,
        lines_of_code: linesOfCode,
      }, user.id);
      toast({ title: "Code committed!" });
      setCommitMessage("");
      fetchCommits();
    }

    setIsCommitting(false);
  };

  const handleDownload = (commit: CodeCommit) => {
    const config = LANGUAGE_CONFIG[commit.language] || { ext: "txt" };
    const blob = new Blob([commit.code_content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = commit.file_name || `code.${config.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Code Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Code Workspace
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleRunCode} disabled={isRunning} variant="outline" size="sm">
                <Play className="w-4 h-4 mr-1" />
                {isRunning ? "Running..." : "Run"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono text-sm min-h-[300px] bg-muted/30 border-border resize-y"
            placeholder="Write your code here..."
            spellCheck={false}
          />

          {/* Output Console */}
          {showOutput && (
            <div className="relative">
              <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-t-lg border border-border">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Terminal className="w-4 h-4" /> Output
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowOutput(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <pre className="p-4 bg-muted/50 rounded-b-lg border border-t-0 border-border text-sm font-mono whitespace-pre-wrap max-h-[200px] overflow-auto">
                {output}
              </pre>
            </div>
          )}

          {/* Commit Section */}
          <div className="flex gap-3">
            <Input
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Enter commit message..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCommit()}
            />
            <Button onClick={handleCommit} disabled={isCommitting || !commitMessage.trim()}>
              <GitCommitHorizontal className="w-4 h-4 mr-2" />
              {isCommitting ? "Committing..." : "Commit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Viewer Modal */}
      {viewingCommit && (
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-5 h-5" />
                {viewingCommit.file_name}
                <Badge variant="outline" className="ml-2">{viewingCommit.language}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(viewingCommit)}>
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewingCommit(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              by {viewingCommit.profile?.full_name || "Anonymous"} · {formatTime(viewingCommit.created_at)} · {viewingCommit.lines_of_code} lines
            </p>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted/30 rounded-lg border border-border text-sm font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">
              {viewingCommit.code_content}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Commit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommitHorizontal className="w-5 h-5" />
            Commit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCommits ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : commits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No commits yet. Write code and commit!</p>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {commits.map((commit) => (
                  <div key={commit.id} className="relative flex gap-4">
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-card border-2 border-border text-muted-foreground">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1 p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium">{commit.commit_message}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {commit.profile?.full_name || "Anonymous"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(commit.created_at)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {commit.language}
                            </Badge>
                            <span className="text-xs">{commit.lines_of_code} lines</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setViewingCommit(commit)}>
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(commit)}>
                            <Download className="w-4 h-4 mr-1" /> Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
