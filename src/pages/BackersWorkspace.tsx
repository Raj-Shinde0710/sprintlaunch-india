import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, Upload, Eye, Clock, TrendingUp, Activity, Target, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const mockDecks = [
  {
    id: "1",
    name: "Series A Deck - Q2 2026",
    views: 24,
    avgTime: "4:32",
    slideData: [
      { slide: "Problem", time: 45 },
      { slide: "Solution", time: 38 },
      { slide: "Market", time: 62 },
      { slide: "Traction", time: 85 },
      { slide: "Team", time: 30 },
      { slide: "Financials", time: 72 },
      { slide: "Ask", time: 55 },
    ],
    topInsight: "Investors spend most time on Traction & Financials slides",
  },
];

export default function BackersWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: sprints = [] } = useQuery({
    queryKey: ["backer-sprints", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("sprints")
        .select("id, name, status, progress, ideas(title)")
        .in("status", ["active", "completed"])
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold">Backers Workspace</h1>
          <p className="text-muted-foreground text-sm">Track startup progress, execution metrics, and investor engagement</p>
        </div>

        {/* Startup Progress */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-founder" /> Active Startups
          </h2>
          {sprints.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No active sprints to track yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sprints.map((sprint: any) => (
                <Card key={sprint.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/sprint/${sprint.id}`)}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-founder/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-founder" />
                      </div>
                      <div>
                        <p className="font-semibold">{sprint.name}</p>
                        <p className="text-xs text-muted-foreground">{sprint.ideas?.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold">{sprint.progress || 0}%</p>
                        <Progress value={sprint.progress || 0} className="w-24 h-1.5" />
                      </div>
                      <Badge className={sprint.status === "active" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"}>
                        {sprint.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Investor Tracker */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" /> Investor Tracker
            </h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" /> Upload Deck
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Eye className="h-5 w-5 text-founder" />
                <div>
                  <p className="text-2xl font-bold">36</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">4:02</p>
                  <p className="text-xs text-muted-foreground">Avg View Time</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-muted-foreground">Active Decks</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {mockDecks.map((deck) => (
            <Card key={deck.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{deck.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{deck.views} views</Badge>
                    <Badge variant="secondary">Avg {deck.avgTime}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-founder" />
                    {deck.topInsight}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Time per Slide (seconds)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={deck.slideData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="slide" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="time" fill="hsl(24, 95%, 53%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppLayout>
  );
}
