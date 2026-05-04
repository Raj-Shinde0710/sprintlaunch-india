import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  GitCommitHorizontal,
  Upload,
  FileArchive,
  User,
  Clock,
  Trophy,
  Loader2,
  Eye,
  Download,
} from "lucide-react";

interface Commit {
  id: string;
  user_id: string;
  commit_message: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
  user_name?: string;
}

interface ContributorStat {
  userId: string;
  name: string;
  commits: number;
  totalSize: number;
}

interface SprintRepositoryProps {
  sprintId: string;
  departmentId?: string | null;
}

export function SprintRepository({ sprintId }: SprintRepositoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [commits, setCommits] = useState<Commit[]>([]);
  const [contributors, setContributors] = useState<ContributorStat[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommits();
  }, [sprintId]);

  const fetchCommits = async () => {
    const { data } = await supabase
      .from("sprint_commits")
      .select("*")
      .eq("sprint_id", sprintId)
      .order("created_at", { ascending: false });

    const rows = (data || []) as Commit[];

    // Hydrate user names
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const nameMap = new Map(
        (profiles || []).map((p) => [p.id, p.full_name || "Anonymous"])
      );

      rows.forEach((r) => {
        r.user_name = nameMap.get(r.user_id) || "Anonymous";
      });

      // Build contributor stats
      const statsMap = new Map<string, ContributorStat>();
      rows.forEach((r) => {
        const existing = statsMap.get(r.user_id);
        if (existing) {
          existing.commits += 1;
          existing.totalSize += r.file_size || 0;
        } else {
          statsMap.set(r.user_id, {
            userId: r.user_id,
            name: r.user_name || "Anonymous",
            commits: 1,
            totalSize: r.file_size || 0,
          });
        }
      });
      setContributors(
        [...statsMap.values()].sort((a, b) => b.commits - a.commits)
      );
    }

    setCommits(rows);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !commitMessage.trim() || !user) return;

    setUploading(true);
    try {
      const filePath = `${sprintId}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("sprint-files")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("sprint-files")
        .getPublicUrl(filePath);

      await supabase.from("sprint_commits").insert({
        sprint_id: sprintId,
        user_id: user.id,
        commit_message: commitMessage.trim(),
        file_name: selectedFile.name,
        file_url: urlData.publicUrl || filePath,
        file_size: selectedFile.size,
      });

      // Log to timeline
      const { logSprintEvent } = await import("@/lib/sprint-logic");
      await logSprintEvent(sprintId, "file_uploaded", { file_name: selectedFile.name }, user.id);

      toast({ title: "Commit pushed!", description: selectedFile.name });
      setCommitMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchCommits();
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Commit Timeline */}
      <div className="lg:col-span-2 space-y-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-builder" />
              Push a Commit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Commit message (e.g. 'Add landing page design')"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.rar,.tar,.gz,.js,.ts,.tsx,.jsx,.py,.html,.css,.json,.md,.pdf,.doc,.docx,.png,.jpg,.fig,.sketch"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-builder/10 file:text-builder hover:file:bg-builder/20 cursor-pointer"
              />
              <Button
                variant="default"
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !commitMessage.trim()}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <GitCommitHorizontal className="w-4 h-4 mr-2" />
                )}
                {uploading ? "Pushing..." : "Push"}
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({formatSize(selectedFile.size)})
              </p>
            )}
          </CardContent>
        </Card>

        {/* Commit History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCommitHorizontal className="w-5 h-5 text-foreground" />
              Commit History
              <Badge variant="secondary" className="ml-auto">
                {commits.length} commits
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : commits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No commits yet. Push your first file!
              </p>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                  <div className="space-y-1">
                    {commits.map((commit) => (
                      <div
                        key={commit.id}
                        className="relative pl-10 py-3 hover:bg-muted/30 rounded-lg transition-colors"
                      >
                        {/* Dot */}
                        <div className="absolute left-[11px] top-5 w-2.5 h-2.5 rounded-full bg-builder border-2 border-background" />

                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">
                              {commit.commit_message}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {commit.user_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(commit.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileArchive className="w-3 h-3" />
                                {commit.file_name}
                              </span>
                              <span>{formatSize(commit.file_size)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(commit.file_url, "_blank")}
                            >
                              <Eye className="w-3 h-3 mr-1" /> View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={commit.file_url} download={commit.file_name} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3 mr-1" /> Download
                              </a>
                            </Button>
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {commit.id.slice(0, 7)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contributors Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributors.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">
                No contributions yet
              </p>
            ) : (
              <div className="space-y-3">
                {contributors.map((c, i) => (
                  <div
                    key={c.userId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-builder/10 text-builder flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(c.totalSize)} uploaded
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{c.commits} commits</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Repository Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Commits</span>
              <span className="font-medium">{commits.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contributors</span>
              <span className="font-medium">{contributors.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Size</span>
              <span className="font-medium">
                {formatSize(
                  commits.reduce((sum, c) => sum + (c.file_size || 0), 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
