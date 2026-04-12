import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckSquare, Users, Bot, Zap, ArrowRight } from "lucide-react";
import { useState } from "react";

interface SprintAutomationSectionProps {
  sprintId: string;
}

const automations = [
  {
    id: "1",
    title: "Builder Joined → Notify Team",
    trigger: "New member joins sprint",
    action: "Send notification to all sprint members",
    icon: Users,
    enabled: true,
    runs: 5,
  },
  {
    id: "2",
    title: "Task Completed → Update Progress",
    trigger: "Task marked as done",
    action: "Auto-update sprint progress and notify founder",
    icon: CheckSquare,
    enabled: true,
    runs: 18,
  },
  {
    id: "3",
    title: "Sprint Stalled → AI Alert",
    trigger: "No activity for 3 days",
    action: "AI Mentor generates risk report",
    icon: Bot,
    enabled: true,
    runs: 2,
  },
];

const suggestions = [
  "Automate weekly progress reports to reduce manual updates",
  "Set up auto-escalation for overdue tasks",
  "Send daily digest emails to keep team aligned",
];

export function SprintAutomationSection({ sprintId }: SprintAutomationSectionProps) {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(automations.map((a) => [a.id, a.enabled]))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold">Automation</h2>
        <p className="text-muted-foreground text-sm">Automated workflows for your sprint</p>
      </div>

      {/* AI Suggestions */}
      <Card className="border-indigo-200 bg-indigo-50/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-sm text-indigo-700">AI Recommendations</span>
          </div>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                <Zap className="h-3 w-3 mt-1 shrink-0 text-indigo-500" />
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Workflow Cards */}
      <div className="grid gap-4">
        {automations.map((auto) => (
          <Card key={auto.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-founder/10 flex items-center justify-center">
                  <auto.icon className="h-5 w-5 text-founder" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{auto.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {auto.trigger} <ArrowRight className="h-3 w-3" /> {auto.action}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-xs">{auto.runs} runs</Badge>
                <Switch checked={states[auto.id]} onCheckedChange={(v) => setStates((s) => ({ ...s, [auto.id]: v }))} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
