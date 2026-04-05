import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageSquare, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AIMentorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: sprints = [] } = useQuery({
    queryKey: ["user-sprints-mentor", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: memberOf } = await supabase
        .from("sprint_members")
        .select("sprint_id")
        .eq("user_id", user.id)
        .is("left_at", null);
      
      const { data: founded } = await supabase
        .from("sprints")
        .select("id, name, status, progress, ideas(title)")
        .in("idea_id", (await supabase.from("ideas").select("id").eq("founder_id", user.id)).data?.map((i: any) => i.id) || []);

      const memberSprintIds = memberOf?.map((m: any) => m.sprint_id) || [];
      const foundedIds = founded?.map((s: any) => s.id) || [];
      const allIds = [...new Set([...memberSprintIds, ...foundedIds])];

      if (allIds.length === 0) return [];

      const { data } = await supabase
        .from("sprints")
        .select("id, name, status, progress, ideas(title)")
        .in("id", allIds)
        .order("created_at", { ascending: false });

      return data || [];
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">AI Mentor</h1>
          <p className="text-muted-foreground text-sm">Get AI-powered guidance for your sprints</p>
        </div>

        {sprints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Join or create a sprint to access AI Mentor</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sprints.map((sprint: any) => (
              <Card key={sprint.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/sprint/${sprint.id}`)}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{sprint.name}</p>
                      <p className="text-xs text-muted-foreground">{sprint.ideas?.title} · {sprint.status} · {sprint.progress}%</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Open Mentor <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
