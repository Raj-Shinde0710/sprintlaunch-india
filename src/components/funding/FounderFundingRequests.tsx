import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Phone, DollarSign, CheckCircle2, XCircle, Sparkles, Globe } from "lucide-react";

interface Props { sprintId: string; }

export function FounderFundingRequests({ sprintId }: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  const [brandings, setBrandings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("funding_requests")
      .select("*")
      .eq("sprint_id", sprintId)
      .order("created_at", { ascending: false });
    setRequests(data || []);

    const { data: brand } = await supabase
      .from("branding_partnerships")
      .select("*")
      .eq("sprint_id", sprintId);
    const map: Record<string, any> = {};
    (brand || []).forEach((b: any) => { if (b.funding_request_id) map[b.funding_request_id] = b; });
    setBrandings(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [sprintId]);

  const updateStatus = async (id: string, status: string, brandingId?: string, brandStatus?: string) => {
    const { error } = await supabase.from("funding_requests").update({ status }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    if (brandingId && brandStatus) {
      await supabase.from("branding_partnerships").update({ status: brandStatus }).eq("id", brandingId);
    }
    toast({ title: `Request ${status}` });
    load();
  };

  if (loading) return null;
  if (requests.length === 0) return (
    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No funding requests yet.</CardContent></Card>
  );

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-5 w-5 text-founder" />Funding Requests ({requests.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {requests.map((r) => {
          const branding = brandings[r.id];
          const accepted = r.status === "accepted" || r.status === "completed";
          return (
            <div key={r.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{r.investor_name}</p>
                    <Badge variant={r.investor_type === "angel" ? "default" : "secondary"}>
                      {r.investor_type === "angel" ? "Angel" : "Brand Partner"}
                    </Badge>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-founder mt-1">${Number(r.amount).toLocaleString()}</p>
                  {r.message && <p className="text-sm text-muted-foreground mt-2">"{r.message}"</p>}
                  {branding && (
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {branding.brand_name} • {branding.duration_days} days</p>
                      {branding.website_url && <p className="flex items-center gap-1"><Globe className="h-3 w-3" /> {branding.website_url}</p>}
                    </div>
                  )}
                </div>
                {accepted && (
                  <div className="text-xs text-right space-y-1 bg-muted/50 p-2 rounded">
                    <p className="flex items-center gap-1 justify-end"><Mail className="h-3 w-3" />{r.contact_email}</p>
                    {r.contact_phone && <p className="flex items-center gap-1 justify-end"><Phone className="h-3 w-3" />{r.contact_phone}</p>}
                  </div>
                )}
              </div>

              {r.status === "completed" && r.platform_fee > 0 && (
                <div className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 rounded p-2">
                  ✅ Deal complete • Platform fee (1%): ${Number(r.platform_fee).toLocaleString()}
                </div>
              )}

              <div className="flex gap-2">
                {r.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(r.id, "accepted", branding?.id, "approved")} className="gap-1">
                      <CheckCircle2 className="h-4 w-4" />Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "rejected", branding?.id, "rejected")} className="gap-1">
                      <XCircle className="h-4 w-4" />Reject
                    </Button>
                  </>
                )}
                {r.status === "accepted" && (
                  <Button size="sm" variant="default" onClick={() => updateStatus(r.id, "completed")}>
                    Mark Deal Completed
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
