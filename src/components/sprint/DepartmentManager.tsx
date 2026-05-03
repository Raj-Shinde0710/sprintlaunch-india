import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Building2 } from "lucide-react";
import type { Department } from "@/hooks/useDepartments";

interface Props {
  sprintId: string;
  departments: Department[];
  onChanged: () => void;
}

export function DepartmentManager({ sprintId, departments, onChanged }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim() || !user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("departments")
      .insert({ sprint_id: sprintId, name: name.trim(), is_default: false, created_by: user.id })
      .select()
      .single();
    if (error) {
      toast({ title: "Failed to create", description: error.message, variant: "destructive" });
    } else if (data) {
      // Auto-add founder as a member
      await supabase.from("department_members").insert({
        department_id: data.id,
        sprint_id: sprintId,
        user_id: user.id,
      });
      toast({ title: "Department created" });
      setName("");
      onChanged();
    }
    setBusy(false);
  };

  const remove = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    const { error } = await supabase.from("departments").delete().eq("id", dept.id);
    if (error) {
      toast({ title: "Cannot delete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      onChanged();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Building2 className="w-4 h-4 mr-2" />
          Manage Departments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Departments</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded border">
                <span className="text-sm">{d.name}{d.is_default && <span className="text-xs text-muted-foreground ml-2">(default)</span>}</span>
                {!d.is_default && (
                  <Button size="icon" variant="ghost" onClick={() => remove(d)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>New department name</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Growth"
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <Button onClick={add} disabled={busy || !name.trim()}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
