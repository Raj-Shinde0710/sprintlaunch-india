import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Download, Eye, FileCode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Repository() {
  const { user } = useAuth();

  const { data: commits = [] } = useQuery({
    queryKey: ["all-commits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("sprint_commits")
        .select("*, sprints(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Repository</h1>
          <p className="text-muted-foreground text-sm">All committed files across your sprints</p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Card className="flex-1">
            <CardContent className="flex items-center gap-3 p-4">
              <GitBranch className="h-5 w-5 text-builder" />
              <div>
                <p className="text-2xl font-bold">{commits.length}</p>
                <p className="text-xs text-muted-foreground">Total Commits</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {commits.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileCode className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No commits yet</p>
              </CardContent>
            </Card>
          ) : (
            commits.map((commit: any) => (
              <Card key={commit.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-builder/10 flex items-center justify-center shrink-0">
                      <GitBranch className="h-4 w-4 text-builder" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{commit.commit_message}</p>
                      <p className="text-xs text-muted-foreground">
                        {commit.file_name} · {commit.sprints?.name} · {format(new Date(commit.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <a href={commit.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-3 w-3 mr-1" /> View
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={commit.file_url} download={commit.file_name}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
