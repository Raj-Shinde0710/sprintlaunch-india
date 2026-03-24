import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, IndianRupee, Verified, Rocket } from "lucide-react";

interface Member {
  id: string;
  role: string;
  is_founder: boolean;
  hours_logged: number;
  profile: {
    full_name: string | null;
    execution_score: number | null;
    is_verified: boolean | null;
  } | null;
}

interface BackerInfo {
  id: string;
  amount: number;
  status: string;
  profile: {
    full_name: string | null;
  } | null;
}

interface IdeaTeamSectionProps {
  ideaId: string;
  sprintId?: string;
}

export function IdeaTeamSection({ ideaId, sprintId }: IdeaTeamSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [backers, setBackers] = useState<BackerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, [ideaId, sprintId]);

  const fetchTeamData = async () => {
    if (!sprintId) {
      // Try to find a sprint for this idea
      const { data: sprintData } = await supabase
        .from("sprints")
        .select("id")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sprintData) {
        setLoading(false);
        return;
      }
      await fetchForSprint(sprintData.id);
    } else {
      await fetchForSprint(sprintId);
    }
  };

  const fetchForSprint = async (sid: string) => {
    const { data: membersData } = await supabase
      .from("sprint_members")
      .select("id, user_id, role, is_founder, hours_logged")
      .eq("sprint_id", sid)
      .is("left_at", null);

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, execution_score, is_verified")
        .in("id", userIds);

      const enriched: Member[] = membersData.map((m) => {
        const p = profiles?.find((pr) => pr.id === m.user_id) || null;
        return {
          id: m.id,
          role: m.role,
          is_founder: m.is_founder || false,
          hours_logged: m.hours_logged || 0,
          profile: p ? { full_name: p.full_name, execution_score: p.execution_score, is_verified: p.is_verified } : null,
        };
      });
      setMembers(enriched);
    }

    // Fetch backers for this sprint - only get backer profiles
    const { data: commitData } = await supabase
      .from("commitments")
      .select("id, amount, status, backer_id")
      .eq("sprint_id", sid);

    if (commitData && commitData.length > 0) {
      const backerIds = commitData.map((c) => c.backer_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", backerIds);

      const backerInfos: BackerInfo[] = commitData.map((c) => ({
        id: c.id,
        amount: c.amount,
        status: c.status || "pending",
        profile: profiles?.find((p) => p.id === c.backer_id) ? { full_name: profiles.find((p) => p.id === c.backer_id)?.full_name || null } : null,
      }));
      setBackers(backerInfos);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (members.length === 0 && backers.length === 0) return null;

  const getCommitmentRange = (amount: number) => {
    if (amount >= 500000) return "₹5L+";
    if (amount >= 100000) return "₹1–5L";
    if (amount >= 50000) return "₹50K–1L";
    return "< ₹50K";
  };

  return (
    <div className="space-y-6">
      {/* Team Members */}
      {members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-builder" />
              Team ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${m.is_founder ? "bg-founder/10 text-founder" : "bg-builder/10 text-builder"}`}>
                    {m.profile?.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.profile?.full_name || "Anonymous"}</span>
                      {m.profile?.is_verified && <Verified className="w-3.5 h-3.5 text-builder" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  {m.is_founder ? (
                    <Badge className="bg-founder/10 text-founder text-xs">Founder</Badge>
                  ) : (
                    <Badge className="bg-builder/10 text-builder text-xs">Active</Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Score: {m.profile?.execution_score || 50}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Backers */}
      {backers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-backer" />
              Backers ({backers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {backers.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-backer/10 flex items-center justify-center text-sm font-bold text-backer">
                    {b.profile?.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <span className="font-medium text-sm">{b.profile?.full_name || "Anonymous Backer"}</span>
                    <p className="text-xs text-muted-foreground">{getCommitmentRange(b.amount)}</p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize text-xs">{b.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
