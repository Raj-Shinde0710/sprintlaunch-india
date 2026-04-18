import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface Props { sprintId?: string; }

export function BrandingPartnersDisplay({ sprintId }: Props) {
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    if (!sprintId) return;
    const fetchPartners = async () => {
      const { data } = await supabase
        .from("branding_partnerships")
        .select("*")
        .eq("sprint_id", sprintId)
        .eq("status", "approved");
      const now = new Date();
      const active = (data || []).filter((p: any) => !p.expires_at || new Date(p.expires_at) > now);
      setPartners(active);
    };
    fetchPartners();
    const ch = supabase
      .channel(`branding-public-${sprintId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "branding_partnerships", filter: `sprint_id=eq.${sprintId}` }, () => fetchPartners())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sprintId]);

  if (partners.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> Powered by
      </h3>
      <div className="flex flex-wrap gap-4 items-center">
        {partners.map((p) => (
          <a key={p.id} href={p.website_url || "#"} target="_blank" rel="noreferrer"
             className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-muted/50 transition-colors">
            {p.logo_url ? (
              <img src={p.logo_url} alt={p.brand_name} className="h-8 w-8 object-contain rounded" />
            ) : (
              <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center text-xs font-bold">
                {p.brand_name[0]}
              </div>
            )}
            <span className="text-sm font-semibold">{p.brand_name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
