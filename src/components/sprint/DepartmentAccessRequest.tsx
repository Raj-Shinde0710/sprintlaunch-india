import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";
import type { Department } from "@/hooks/useDepartments";

interface Props {
  sprintId: string;
  departments: Department[];
  accessibleIds: Set<string>;
}

export function DepartmentAccessRequest({ sprintId, departments, accessibleIds }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [deptId, setDeptId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const candidates = departments.filter((d) => !accessibleIds.has(d.id));
  if (candidates.length === 0) return null;

  const submit = async () => {
    if (!deptId || !user) return;
    setBusy(true);
    const { error } = await supabase.from("department_access_requests").insert({
      department_id: deptId,
      sprint_id: sprintId,
      user_id: user.id,
      message: message.trim() || null,
      status: "pending",
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent" });
      setOpen(false);
      setDeptId("");
      setMessage("");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <KeyRound className="w-4 h-4 mr-2" /> Request Access
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Department Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Department</Label>
            <Select value={deptId} onValueChange={setDeptId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose department" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </div>
          <Button onClick={submit} disabled={busy || !deptId} className="w-full">
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
