import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Brain,
  Bot,
  CheckSquare,
  Clock,
  GitBranch,
  BookOpen,
  Workflow,
  DollarSign,
  PieChart,
  MessageSquare,
  ShieldCheck,
  Video,
  TrendingUp,
  FileText,
} from "lucide-react";

interface SprintWorkspaceSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isFounder: boolean;
  sprintStatus: string;
}

const sections = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard, group: "core" },
  { id: "planner", label: "Sprint Planner", icon: Brain, group: "core", founderOnly: true },
  { id: "mentor", label: "AI Mentor", icon: Bot, group: "core" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, group: "execution" },
  { id: "timeline", label: "Timeline", icon: Clock, group: "execution" },
  { id: "repository", label: "Repository", icon: GitBranch, group: "execution" },
  { id: "chat", label: "Team Chat", icon: MessageSquare, group: "execution" },
  { id: "sop", label: "SOP Assistant", icon: BookOpen, group: "tools" },
  { id: "automation", label: "Automation", icon: Workflow, group: "tools" },
  { id: "finance", label: "Finance", icon: DollarSign, group: "tools", founderOnly: true },
  { id: "equity", label: "Equity", icon: PieChart, group: "insights" },
  { id: "risk", label: "Risk Analysis", icon: ShieldCheck, group: "insights" },
  { id: "ranking", label: "Builder Ranking", icon: TrendingUp, group: "insights" },
  { id: "pitch", label: "Pitch Generator", icon: FileText, group: "insights", founderOnly: true },
  { id: "demo", label: "Demo Day", icon: Video, group: "insights", completedOnly: true },
];

const groupLabels: Record<string, string> = {
  core: "Core",
  execution: "Execution",
  tools: "Tools",
  insights: "Insights",
};

export function SprintWorkspaceSidebar({ activeSection, onSectionChange, isFounder, sprintStatus }: SprintWorkspaceSidebarProps) {
  const filteredSections = sections.filter((s) => {
    if (s.founderOnly && !isFounder) return false;
    if (s.completedOnly && sprintStatus !== "completed") return false;
    return true;
  });

  const groups = ["core", "execution", "tools", "insights"];

  return (
    <aside className="w-56 shrink-0 border-r border-border/50 bg-background/50 flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {groups.map((group) => {
          const items = filteredSections.filter((s) => s.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-1">
                {groupLabels[group]}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeSection === item.id
                        ? "bg-founder/10 text-founder font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
