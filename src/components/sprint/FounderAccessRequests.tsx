import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, KeyRound } from "lucide-react";

interface Req {
  id: string;
  department_id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  department_name?: string;
  user_name?: string;
}

interface Props {
  sprintId: string;
  onChanged?: () => void;
}

export function FounderAccessRequests({ sprintId, onChanged }: Props) {
  const [requests, setRequests] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`dept-reqs-${sprintId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "department_access_requests", filter: `sprint_id=eq.${sprintId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sprintId]);

  const load = async () => {
    const { data } = await supabase
      .from("department_access_requests")
      .select("*")
      .eq("sprint_id", sprintId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    const rows = (data || []) as Req[];
    if (rows.length > 0) {
      const deptIds = [...new Set(rows.map((r) => r.department_id))];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const [{ data: depts }, { data: profiles }] = await Promise.all([
        supabase.from("departments").select("id, name").in("id", deptIds),
        supabase.from("profiles").select("id, full_name").in("id", userIds),
      ]);
      const dMap = new Map((depts || []).map((d) => [d.id, d.name]));
      const pMap = new Map((profiles || []).map((p) => [p.id, p.full_name || "Anonymous"]));
      rows.forEach((r) => {
        r.department_name = dMap.get(r.department_id);
        r.user_name = pMap.get(r.user_id);
      });
    }
    setRequests(rows);
  };

  const decide = async (req: Req, approve: boolean) => {
    setBusy(req.id);
    if (approve) {
      await supabase.from("department_members").insert({
        department_id: req.department_id,
        sprint_id: sprintId,
        user_id: req.user_id,
      });
    }
    await supabase
      .from("department_access_requests")
      .update({ status: approve ? "approved" : "rejected", decided_at: new Date().toISOString() })
      .eq("id", req.id);
    toast({ title: approve ? "Access granted" : "Request rejected" });
    setBusy(null);
    load();
    onChanged?.();
  };

  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-founder" />
          Department Access Requests
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="p-3 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{r.user_name}</p>
                <p className="text-xs text-muted-foreground">wants access to <strong>{r.department_name}</strong></p>
              </div>
            </div>
            {r.message && <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">{r.message}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide(r, true)} disabled={busy === r.id}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide(r, false)} disabled={busy === r.id}>
                <XCircle className="w-3 h-3 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
