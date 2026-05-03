import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department } from "@/hooks/useDepartments";
import { Building2 } from "lucide-react";

interface Props {
  departments: Department[];
  value: string | null;
  onChange: (id: string) => void;
}

export function DepartmentSelector({ departments, value, onChange }: Props) {
  if (departments.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
