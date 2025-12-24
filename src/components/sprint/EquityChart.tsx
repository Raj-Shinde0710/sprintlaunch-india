import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type EquityDistribution } from "@/lib/sprint-logic";
import { TrendingUp, CheckCircle2, AlertCircle, User } from "lucide-react";

interface EquityChartProps {
  distribution: EquityDistribution[];
  sprintId: string;
  isFounder: boolean;
  sprintStatus: string;
}

const colors = [
  "bg-founder",
  "bg-builder",
  "bg-backer",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
];

export function EquityChart({
  distribution,
  sprintId,
  isFounder,
  sprintStatus,
}: EquityChartProps) {
  const { toast } = useToast();

  const handleFinalizeEquity = async () => {
    if (!isFounder) return;

    // Update all members with their calculated equity
    for (const member of distribution) {
      await supabase
        .from("sprint_members")
        .update({ equity_share: member.equityShare })
        .eq("sprint_id", sprintId)
        .eq("user_id", member.userId);
    }

    toast({
      title: "Equity finalized!",
      description: "All team members have been assigned their equity shares.",
    });
  };

  const totalEquity = distribution.reduce((acc, d) => acc + d.equityShare, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Equity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-founder" />
            Live Equity Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {distribution.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No team members yet
            </p>
          ) : (
            <>
              {/* Visual Bar */}
              <div className="h-8 rounded-full overflow-hidden flex mb-6">
                {distribution.map((member, i) => (
                  <div
                    key={member.userId}
                    className={`${colors[i % colors.length]} transition-all duration-500`}
                    style={{ width: `${member.equityShare}%` }}
                    title={`${member.userName}: ${member.equityShare}%`}
                  />
                ))}
              </div>

              {/* Member List */}
              <div className="space-y-3">
                {distribution.map((member, i) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full ${colors[i % colors.length]}`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.userName}</span>
                          {member.isFounder && (
                            <Badge className="bg-founder/10 text-founder text-xs">
                              Founder
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {member.role} • {member.hoursLogged}h logged
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-bold">
                      {member.equityShare.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Check */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span
                  className={`font-bold ${
                    Math.abs(totalEquity - 100) < 0.1
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {totalEquity.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Equity Rules & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Contribution-Based Equity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Dynamic Calculation</p>
                <p className="text-sm text-muted-foreground">
                  Equity updates in real-time based on hours logged, role value,
                  and founder commitment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <User className="w-5 h-5 text-founder mt-0.5" />
              <div>
                <p className="font-medium">Founder Baseline</p>
                <p className="text-sm text-muted-foreground">
                  Founders receive a 20-point baseline for idea contribution.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium">Exit Adjustment</p>
                <p className="text-sm text-muted-foreground">
                  If a member exits early, their equity is forfeited and
                  redistributed among remaining members.
                </p>
              </div>
            </div>
          </div>

          {isFounder && sprintStatus === "completed" && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Ready to finalize? This will lock in the equity distribution.
              </p>
              <Button variant="founder" onClick={handleFinalizeEquity}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalize Equity Distribution
              </Button>
            </div>
          )}

          {sprintStatus !== "completed" && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-700">
                ⚠️ Equity can only be finalized after the sprint is completed.
                Current projections may change based on contributions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
