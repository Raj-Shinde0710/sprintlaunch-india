import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Department {
  id: string;
  sprint_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export function useDepartments(sprintId: string | undefined, isFounder: boolean) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [accessibleIds, setAccessibleIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sprintId) return;
    const { data } = await supabase
      .from("departments")
      .select("*")
      .eq("sprint_id", sprintId)
      .order("is_default", { ascending: false })
      .order("name");
    const list = (data || []) as Department[];
    setDepartments(list);

    if (isFounder) {
      setAccessibleIds(new Set(list.map((d) => d.id)));
    } else if (user) {
      const { data: mem } = await supabase
        .from("department_members")
        .select("department_id")
        .eq("sprint_id", sprintId)
        .eq("user_id", user.id);
      setAccessibleIds(new Set((mem || []).map((m) => m.department_id)));
    }
    setLoading(false);
  }, [sprintId, isFounder, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-select first accessible dept
  useEffect(() => {
    if (departments.length === 0) return;
    if (selectedId && departments.some((d) => d.id === selectedId)) return;
    const accessible = departments.filter((d) => accessibleIds.has(d.id));
    if (accessible.length > 0) setSelectedId(accessible[0].id);
    else if (isFounder) setSelectedId(departments[0].id);
  }, [departments, accessibleIds, selectedId, isFounder]);

  const visibleDepartments = isFounder
    ? departments
    : departments.filter((d) => accessibleIds.has(d.id));

  return {
    departments,
    visibleDepartments,
    accessibleIds,
    selectedId,
    setSelectedId,
    loading,
    refresh,
  };
}
