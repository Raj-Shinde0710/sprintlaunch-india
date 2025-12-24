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
  Code,
  Rocket,
  Clock,
  TrendingUp,
  Target,
  CheckCircle2,
  Search,
  Briefcase,
  Timer,
} from "lucide-react";

interface SprintMembership {
  id: string;
  role: string;
  hours_committed: number;
  hours_logged: number;
  equity_share: number;
  sprint: {
    id: string;
    name: string;
    status: string;
    progress: number;
    end_date: string | null;
  };
}

interface Application {
  id: string;
  role: string;
  status: string;
  created_at: string;
  sprint: {
    id: string;
    name: string;
    idea: {
      title: string;
    };
  };
}

export function BuilderDashboard() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<SprintMembership[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [executionScore, setExecutionScore] = useState(50);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch sprint memberships
    const { data: membershipsData } = await supabase
      .from("sprint_members")
      .select(`
        id,
        role,
        hours_committed,
        hours_logged,
        equity_share,
        sprint:sprints (
          id,
          name,
          status,
          progress,
          end_date
        )
      `)
      .eq("user_id", user.id)
      .is("left_at", null);

    if (membershipsData) {
      setMemberships(membershipsData as unknown as SprintMembership[]);
    }

    // Fetch applications
    const { data: applicationsData } = await supabase
      .from("sprint_applications")
      .select(`
        id,
        role,
        status,
        created_at,
        sprint:sprints (
          id,
          name,
          idea:ideas (
            title
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (applicationsData) {
      setApplications(applicationsData as unknown as Application[]);
    }

    // Fetch profile stats
    const { data: profileData } = await supabase
      .from("profiles")
      .select("execution_score, tasks_completed")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setExecutionScore(profileData.execution_score || 50);
      setTasksCompleted(profileData.tasks_completed || 0);
    }

    setLoading(false);
  };

  const activeSprints = memberships.filter((m) => m.sprint?.status === "active");
  const totalHoursLogged = memberships.reduce((acc, m) => acc + (m.hours_logged || 0), 0);

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-600";
      case "rejected":
        return "bg-red-500/10 text-red-600";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600";
      default:
        return "bg-muted text-muted-foreground";
    }
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
            Builder Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your sprints, contributions, and find new opportunities
          </p>
        </div>
        <Link to="/discover">
          <Button variant="builder" size="lg" className="mt-4 md:mt-0">
            <Search className="w-4 h-4 mr-2" />
            Find Sprints
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
          <Card className="role-builder role-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Sprints</p>
                  <p className="text-3xl font-bold text-foreground">{activeSprints.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-builder/10">
                  <Rocket className="w-6 h-6 text-builder" />
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
                  <p className="text-sm text-muted-foreground">Hours Logged</p>
                  <p className="text-3xl font-bold text-foreground">{totalHoursLogged}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <Timer className="w-6 h-6 text-foreground" />
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
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-3xl font-bold text-foreground">{tasksCompleted}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <CheckCircle2 className="w-6 h-6 text-foreground" />
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Joined Sprints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-builder" />
                Joined Sprints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="text-center py-8">
                  <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You haven't joined any sprints yet
                  </p>
                  <Link to="/discover">
                    <Button variant="outline">Browse Ideas</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {memberships.map((membership) => (
                    <Link
                      key={membership.id}
                      to={`/sprint/${membership.sprint.id}`}
                      className="block p-4 rounded-xl border border-border hover:border-builder/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {membership.sprint.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Role: {membership.role}
                          </p>
                        </div>
                        {membership.sprint.status === "active" && (
                          <Badge variant="secondary" className="bg-builder/10 text-builder">
                            <Clock className="w-3 h-3 mr-1" />
                            {getDaysRemaining(membership.sprint.end_date)} days left
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {membership.hours_logged}/{membership.hours_committed} hours
                        </span>
                        <span className="text-builder font-medium">
                          {membership.equity_share}% equity
                        </span>
                      </div>
                      <Progress
                        value={membership.sprint.progress}
                        className="mt-3 h-2"
                      />
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
                <Briefcase className="w-5 h-5 text-builder" />
                Your Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No applications yet
                  </p>
                  <Link to="/discover">
                    <Button variant="outline">Find Opportunities</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">
                          {app.sprint.idea.title}
                        </h3>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Applied as: {app.role}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Contribution Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-builder" />
              Contribution Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-muted/30">
                <p className="text-4xl font-bold text-builder">{totalHoursLogged}</p>
                <p className="text-muted-foreground mt-1">Total Hours</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-muted/30">
                <p className="text-4xl font-bold text-foreground">{tasksCompleted}</p>
                <p className="text-muted-foreground mt-1">Tasks Delivered</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-muted/30">
                <p className="text-4xl font-bold text-foreground">
                  {memberships.reduce((acc, m) => acc + (m.equity_share || 0), 0).toFixed(1)}%
                </p>
                <p className="text-muted-foreground mt-1">Total Equity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
