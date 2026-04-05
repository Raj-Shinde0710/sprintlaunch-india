import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Workflow, Zap, CheckSquare, Users, Mail, Bot, Plus, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const automations = [
  {
    id: "1",
    title: "Task Completed → Notify Team",
    trigger: "Task marked as done",
    action: "Send notification to sprint members",
    icon: CheckSquare,
    enabled: true,
    runs: 24,
  },
  {
    id: "2",
    title: "New Signup → Start Onboarding",
    trigger: "User signs up",
    action: "Send welcome email + assign onboarding tasks",
    icon: Users,
    enabled: true,
    runs: 12,
  },
  {
    id: "3",
    title: "Sprint Stalled → AI Alert",
    trigger: "No activity for 3 days",
    action: "AI Mentor generates risk report",
    icon: Bot,
    enabled: false,
    runs: 3,
  },
  {
    id: "4",
    title: "Lead Captured → Auto-Assign",
    trigger: "New validation page signup",
    action: "Create task and assign to sales",
    icon: Mail,
    enabled: true,
    runs: 8,
  },
];

const suggestions = [
  "Consider automating weekly progress reports instead of manual updates",
  "Set up auto-escalation for overdue tasks before hiring more people",
  "Automate candidate trial room scoring to reduce manual review time",
];

export default function Automation() {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(automations.map((a) => [a.id, a.enabled]))
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Automation</h1>
            <p className="text-muted-foreground text-sm">Automate workflows before hiring</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Workflow</Button>
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
                  <Switch
                    checked={states[auto.id]}
                    onCheckedChange={(v) => setStates((s) => ({ ...s, [auto.id]: v }))}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
