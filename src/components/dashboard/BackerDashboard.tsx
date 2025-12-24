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
  TrendingUp,
  Search,
  Wallet,
  Eye,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  Briefcase,
} from "lucide-react";

interface Commitment {
  id: string;
  amount: number;
  unlock_milestone: string | null;
  status: string;
  created_at: string;
  sprint: {
    id: string;
    name: string;
    status: string;
    progress: number;
    idea: {
      title: string;
      industry: string[];
    };
  };
}

export function BackerDashboard() {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data: commitmentsData } = await supabase
      .from("commitments")
      .select(`
        id,
        amount,
        unlock_milestone,
        status,
        created_at,
        sprint:sprints (
          id,
          name,
          status,
          progress,
          idea:ideas (
            title,
            industry
          )
        )
      `)
      .eq("backer_id", user.id)
      .order("created_at", { ascending: false });

    if (commitmentsData) {
      setCommitments(commitmentsData as unknown as Commitment[]);
    }

    setLoading(false);
  };

  const totalCommitted = commitments.reduce((acc, c) => acc + Number(c.amount), 0);
  const lockedAmount = commitments
    .filter((c) => c.status === "locked")
    .reduce((acc, c) => acc + Number(c.amount), 0);
  const releasedAmount = commitments
    .filter((c) => c.status === "released")
    .reduce((acc, c) => acc + Number(c.amount), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "locked":
        return <Lock className="w-4 h-4" />;
      case "released":
        return <CheckCircle className="w-4 h-4" />;
      case "refunded":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600";
      case "locked":
        return "bg-blue-500/10 text-blue-600";
      case "released":
        return "bg-green-500/10 text-green-600";
      case "refunded":
        return "bg-red-500/10 text-red-600";
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
            Backer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your investments and track sprint progress
          </p>
        </div>
        <Link to="/discover">
          <Button variant="backer" size="lg" className="mt-4 md:mt-0">
            <Search className="w-4 h-4 mr-2" />
            Discover Sprints
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
          <Card className="role-backer role-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Committed</p>
                  <p className="text-3xl font-bold text-foreground flex items-center">
                    <IndianRupee className="w-6 h-6" />
                    {totalCommitted.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-backer/10">
                  <Wallet className="w-6 h-6 text-backer" />
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
                  <p className="text-sm text-muted-foreground">Locked Funds</p>
                  <p className="text-3xl font-bold text-foreground flex items-center">
                    <IndianRupee className="w-6 h-6" />
                    {lockedAmount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <Lock className="w-6 h-6 text-foreground" />
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
                  <p className="text-sm text-muted-foreground">Released</p>
                  <p className="text-3xl font-bold text-foreground flex items-center">
                    <IndianRupee className="w-6 h-6" />
                    {releasedAmount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <CheckCircle className="w-6 h-6 text-green-600" />
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
                  <p className="text-sm text-muted-foreground">Active Investments</p>
                  <p className="text-3xl font-bold text-foreground">
                    {commitments.filter((c) => c.status === "locked").length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <Briefcase className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Commitments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-backer" />
              Your Commitments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commitments.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No commitments yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Browse sprints and commit funds to promising teams. Your investment
                  unlocks only when milestones are met.
                </p>
                <Link to="/discover">
                  <Button variant="backer" size="lg">
                    <Search className="w-4 h-4 mr-2" />
                    Discover Sprints
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {commitments.map((commitment) => (
                  <div
                    key={commitment.id}
                    className="p-6 rounded-xl border border-border hover:border-backer/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-foreground">
                            {commitment.sprint.idea.title}
                          </h3>
                          <Badge className={getStatusColor(commitment.status)}>
                            {getStatusIcon(commitment.status)}
                            <span className="ml-1 capitalize">{commitment.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Sprint: {commitment.sprint.name}
                        </p>
                        {commitment.sprint.idea.industry && (
                          <div className="flex flex-wrap gap-2">
                            {commitment.sprint.idea.industry.map((ind) => (
                              <Badge key={ind} variant="outline" className="text-xs">
                                {ind}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-backer flex items-center justify-end">
                          <IndianRupee className="w-5 h-5" />
                          {Number(commitment.amount).toLocaleString()}
                        </p>
                        {commitment.unlock_milestone && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Unlock: {commitment.unlock_milestone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Sprint Progress</span>
                        <span className="font-medium">{commitment.sprint.progress}%</span>
                      </div>
                      <Progress value={commitment.sprint.progress} className="h-2" />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Link to={`/sprint/${commitment.sprint.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Sprint
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Portfolio View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-backer" />
              Portfolio Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-xl bg-backer/5 border border-backer/20">
                <p className="text-4xl font-bold text-backer">{commitments.length}</p>
                <p className="text-muted-foreground mt-1">Total Investments</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-muted/30">
                <p className="text-4xl font-bold text-foreground">
                  {commitments.filter((c) => c.sprint.status === "active").length}
                </p>
                <p className="text-muted-foreground mt-1">Active Sprints</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-muted/30">
                <p className="text-4xl font-bold text-green-600">
                  {commitments.filter((c) => c.sprint.status === "completed").length}
                </p>
                <p className="text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-muted/30">
                <p className="text-4xl font-bold text-foreground">
                  {((releasedAmount / totalCommitted) * 100 || 0).toFixed(0)}%
                </p>
                <p className="text-muted-foreground mt-1">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
