import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Lightbulb,
  Plus,
  Users,
  Clock,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Rocket,
} from "lucide-react";

interface Sprint {
  id: string;
  name: string;
  status: string;
  progress: number;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
}

interface Idea {
  id: string;
  title: string;
  stage: string;
  is_published: boolean;
  sprints: Sprint[];
}

interface Application {
  id: string;
  role: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function FounderDashboard() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [executionScore, setExecutionScore] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch ideas with sprints
    const { data: ideasData } = await supabase
      .from("ideas")
      .select(`
        id,
        title,
        stage,
        is_published,
        sprints (
          id,
          name,
          status,
          progress,
          duration_days,
          start_date,
          end_date
        )
      `)
      .eq("founder_id", user.id);

    if (ideasData) {
      setIdeas(ideasData);
    }

    // Fetch profile for execution score
    const { data: profileData } = await supabase
      .from("profiles")
      .select("execution_score")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setExecutionScore(profileData.execution_score || 50);
    }

    // Fetch applications for user's sprints
    if (ideasData && ideasData.length > 0) {
      const sprintIds = ideasData.flatMap((idea) => idea.sprints.map((s) => s.id));
      
      if (sprintIds.length > 0) {
        const { data: applicationsData } = await supabase
          .from("sprint_applications")
          .select(`
            id,
            role,
            status,
            created_at,
            user_id
          `)
          .in("sprint_id", sprintIds)
          .eq("status", "pending")
          .limit(5);

        if (applicationsData) {
          // Fetch profiles separately
          const userIds = applicationsData.map(a => a.user_id);
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);
          
          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          const appsWithProfiles = applicationsData.map(app => ({
            ...app,
            profiles: profilesMap.get(app.user_id) || null
          }));
          
          setApplications(appsWithProfiles as Application[]);
        }
      }
    }

    setLoading(false);
  };

  const activeSprints = ideas.flatMap((idea) =>
    idea.sprints.filter((s) => s.status === "active")
  );

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">
            Founder Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your ideas, sprints, and team applications
          </p>
        </div>
        <Link to="/ideas/new">
          <Button variant="founder" size="lg" className="mt-4 md:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            New Idea
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="role-founder role-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Sprints</p>
                  <p className="text-3xl font-bold text-foreground">{activeSprints.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-founder/10">
                  <Rocket className="w-6 h-6 text-founder" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="role-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ideas</p>
                  <p className="text-3xl font-bold text-foreground">{ideas.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <Lightbulb className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="role-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Applications</p>
                  <p className="text-3xl font-bold text-foreground">{applications.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="role-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Execution Score</p>
                  <p className="text-3xl font-bold text-foreground">{executionScore}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <TrendingUp className="w-6 h-6 text-foreground" />
                </div>
              </div>
              <Progress value={executionScore} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Sprints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-founder" />
                Active Sprints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSprints.length === 0 ? (
                <div className="text-center py-8">
                  <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No active sprints yet</p>
                  <Link to="/ideas/new">
                    <Button variant="outline">Start Your First Sprint</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSprints.map((sprint) => (
                    <Link
                      key={sprint.id}
                      to={`/sprint/${sprint.id}`}
                      className="block p-4 rounded-xl border border-border hover:border-founder/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{sprint.name}</h3>
                        <Badge variant="secondary" className="bg-founder/10 text-founder">
                          <Clock className="w-3 h-3 mr-1" />
                          {getDaysRemaining(sprint.end_date)} days left
                        </Badge>
                      </div>
                      <Progress value={sprint.progress} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">
                        {sprint.progress}% complete
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-builder" />
                Pending Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-builder/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-builder" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {app.profiles?.full_name || "Anonymous"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Applied as {app.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Ideas List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-founder" />
                Your Ideas
              </CardTitle>
              <Link to="/ideas/new">
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ideas.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Share your first idea to start building
                </p>
                <Link to="/ideas/new">
                  <Button variant="founder">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Idea
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {ideas.map((idea) => (
                  <Link
                    key={idea.id}
                    to={`/idea/${idea.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-founder/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-founder/10">
                        <Lightbulb className="w-5 h-5 text-founder" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{idea.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {idea.stage}
                          </Badge>
                          {idea.is_published ? (
                            <Badge className="bg-green-500/10 text-green-600 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
