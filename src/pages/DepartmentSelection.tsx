import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartments } from "@/hooks/useDepartments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DepartmentAccessRequest } from "@/components/sprint/DepartmentAccessRequest";
import {
  ArrowLeft,
  Building2,
  Code2,
  Megaphone,
  Palette,
  Boxes,
  ShoppingCart,
  Headphones,
  Settings,
  Wallet,
  Users,
  Lock,
} from "lucide-react";

const ICONS: Record<string, any> = {
  development: Code2,
  marketing: Megaphone,
  design: Palette,
  "design (ui/ux)": Palette,
  product: Boxes,
  "product / management": Boxes,
  sales: ShoppingCart,
  "customer support": Headphones,
  operations: Settings,
  finance: Wallet,
  executive: Users,
  hr: Users,
};

function iconFor(name: string) {
  return ICONS[name.toLowerCase()] || Building2;
}

export default function DepartmentSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sprint, setSprint] = useState<{ id: string; name: string; idea: { id: string; title: string; founder_id: string } } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const isFounder = sprint?.idea.founder_id === user?.id;
  const { departments, visibleDepartments, accessibleIds } = useDepartments(id, !!isFounder);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from("sprints")
        .select("id, name, idea:ideas(id, title, founder_id)")
        .eq("id", id)
        .single();
      setSprint(data as any);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!id || departments.length === 0) return;
      const { data } = await supabase
        .from("department_members")
        .select("department_id")
        .eq("sprint_id", id);
      const c: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        c[r.department_id] = (c[r.department_id] || 0) + 1;
      });
      setCounts(c);
    })();
  }, [id, departments.length]);

  if (loading || !sprint) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-founder"></div>
      </div>
    );
  }

  const showEmpty = !isFounder && visibleDepartments.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold">{sprint.name}</h1>
            <Link to={`/idea/${sprint.idea.id}`} className="text-xs text-muted-foreground hover:text-foreground">
              {sprint.idea.title}
            </Link>
          </div>
        </div>
        {!isFounder && (
          <DepartmentAccessRequest sprintId={sprint.id} departments={departments} accessibleIds={accessibleIds} />
        )}
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Select a Department</h2>
          <p className="text-sm text-muted-foreground">
            Choose a department to enter its dedicated workspace.
          </p>
        </div>

        {showEmpty ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">You are not assigned to any department</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Request access from the founder to start working in a department.
              </p>
              <DepartmentAccessRequest sprintId={sprint.id} departments={departments} accessibleIds={accessibleIds} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleDepartments.map((d, i) => {
              const Icon = iconFor(d.name);
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    onClick={() => navigate(`/sprint/${sprint.id}/department/${d.id}`)}
                    className="cursor-pointer hover:border-founder/50 hover:shadow-lg transition-all group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-founder/10 group-hover:bg-founder/20 transition-colors">
                          <Icon className="w-6 h-6 text-founder" />
                        </div>
                        {d.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{d.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {counts[d.id] || 0} member{(counts[d.id] || 0) === 1 ? "" : "s"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
