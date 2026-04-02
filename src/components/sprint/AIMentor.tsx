import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logSprintEvent } from "@/lib/sprint-logic";
import {
  Brain,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Send,
  Bot,
  User,
  RefreshCw,
  Zap,
  Target,
  Users,
  Code2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface AIMentorProps {
  sprintId: string;
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface SprintAnalysis {
  suggestions: string[];
  risks: string[];
  improvements: string[];
}

interface SprintData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  totalMembers: number;
  memberRoles: string[];
  totalCommits: number;
  progress: number;
  status: string;
  daysRemaining: number;
  sprintName: string;
}

const QUICK_QUESTIONS = [
  { label: "Next Steps", question: "What should we do next? Give me step-by-step actionable advice." },
  { label: "Check Risks", question: "What are the current risks in our sprint? How do we mitigate them?" },
  { label: "Improve Product", question: "How can we improve our product? What features should we prioritize?" },
  { label: "Team Issues", question: "Are there any team issues? Who needs help and what roles are missing?" },
  { label: "Priority Tasks", question: "Which tasks are most critical right now and in what order should we complete them?" },
  { label: "Sprint Status", question: "Give me a detailed status update on our sprint progress." },
];

export function AIMentor({ sprintId }: AIMentorProps) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<SprintAnalysis>({
    suggestions: [],
    risks: [],
    improvements: [],
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sprintData, setSprintData] = useState<SprintData | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAndAnalyze();
  }, [sprintId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchSprintData = async (): Promise<SprintData | null> => {
    const [
      { data: sprint },
      { data: tasks },
      { data: members },
      { data: commits },
    ] = await Promise.all([
      supabase.from("sprints").select("name, status, progress, end_date, duration_days").eq("id", sprintId).single(),
      supabase.from("tasks").select("status, assignee_id, title, priority").eq("sprint_id", sprintId),
      supabase.from("sprint_members").select("role, user_id, hours_logged, is_founder").eq("sprint_id", sprintId).is("left_at", null),
      supabase.from("code_commits").select("id").eq("sprint_id", sprintId),
    ]);

    if (!sprint) return null;

    const endDate = sprint.end_date ? new Date(sprint.end_date) : null;
    const daysRemaining = endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))
      : sprint.duration_days || 14;

    const taskList = tasks || [];
    const memberList = members || [];

    return {
      totalTasks: taskList.length,
      completedTasks: taskList.filter((t) => t.status === "done").length,
      inProgressTasks: taskList.filter((t) => t.status === "in_progress").length,
      todoTasks: taskList.filter((t) => t.status === "todo").length,
      totalMembers: memberList.length,
      memberRoles: memberList.map((m) => m.role),
      totalCommits: (commits || []).length,
      progress: sprint.progress || 0,
      status: sprint.status || "draft",
      daysRemaining,
      sprintName: sprint.name,
    };
  };

  const analyzeSprintData = (data: SprintData): SprintAnalysis => {
    const suggestions: string[] = [];
    const risks: string[] = [];
    const improvements: string[] = [];

    // Detailed suggestions
    if (data.totalTasks === 0) {
      suggestions.push("🎯 Create and assign tasks to get started. Use the AI Sprint Planner to auto-generate a structured task list.");
    } else {
      if (data.todoTasks > data.completedTasks && data.totalTasks > 0) {
        suggestions.push(`📋 ${data.todoTasks} tasks are pending vs ${data.completedTasks} completed. Focus on completing existing tasks before adding new ones.`);
      }
      if (data.inProgressTasks === 0 && data.todoTasks > 0) {
        suggestions.push("⚡ No tasks are in progress. Pick up the highest-priority pending task and start working on it immediately.");
      }
      if (data.completedTasks > 0 && data.todoTasks > 0) {
        suggestions.push(`✅ Great momentum! ${data.completedTasks} tasks done. Complete the remaining ${data.todoTasks} tasks to stay on track.`);
      }
      if (data.totalCommits === 0 && data.status === "active") {
        suggestions.push("💻 No code commits yet. Start committing code to the repository to track development progress.");
      }
      if (data.daysRemaining <= 5 && data.todoTasks > 3) {
        suggestions.push(`⏰ Only ${data.daysRemaining} days left with ${data.todoTasks} pending tasks. Prioritize critical tasks and consider reducing scope.`);
      }
    }

    // Detailed risks
    const completionRate = data.totalTasks > 0 ? (data.completedTasks / data.totalTasks) * 100 : 0;
    if (data.daysRemaining <= 3 && completionRate < 50) {
      risks.push(`🚨 Critical: Only ${data.daysRemaining} days remaining with ${completionRate.toFixed(0)}% completion. Sprint is at high risk of failure.`);
    }
    if (data.todoTasks > data.totalTasks * 0.7 && data.status === "active") {
      risks.push(`⚠️ Over 70% of tasks (${data.todoTasks}/${data.totalTasks}) are still pending. Team velocity needs immediate improvement.`);
    }
    if (data.totalMembers < 2) {
      risks.push("⚠️ Solo team detected. Consider adding members to distribute workload and avoid burnout.");
    }
    if (data.totalCommits === 0 && data.status === "active") {
      risks.push("⚠️ No code activity detected. Development may be stalled — verify team is actively working.");
    }
    if (data.status === "paused") {
      risks.push("⚠️ Sprint is paused. Resume soon to avoid falling behind schedule.");
    }

    // Gap detection
    const roles = data.memberRoles.map((r) => r.toLowerCase());
    const hasFrontend = roles.some((r) => r.includes("frontend") || r.includes("front-end") || r.includes("ui") || r.includes("fullstack"));
    const hasBackend = roles.some((r) => r.includes("backend") || r.includes("back-end") || r.includes("fullstack") || r.includes("server"));
    const hasDesigner = roles.some((r) => r.includes("design") || r.includes("ui/ux") || r.includes("ux"));

    if (!hasFrontend) risks.push("⚠️ No frontend developer assigned. UI development may be blocked.");
    if (!hasBackend) risks.push("⚠️ No backend developer assigned. API and database work may be blocked.");

    // Detailed improvements
    if (!hasDesigner) {
      improvements.push("🎨 Add a UI/UX designer to improve user experience and create a polished product.");
    }
    if (data.totalCommits < data.completedTasks && data.completedTasks > 0) {
      improvements.push("📝 Commit code more frequently — aim for at least one commit per completed task.");
    }
    improvements.push("📅 Schedule daily 15-minute standups to keep everyone aligned and unblock issues quickly.");
    if (data.progress < 50 && data.daysRemaining > 5) {
      improvements.push("🔨 Break large tasks into smaller subtasks (2-4 hours each) for faster delivery and clearer progress.");
    }
    if (data.totalMembers >= 3) {
      improvements.push("👥 Implement peer code reviews to maintain quality and share knowledge across the team.");
    }
    improvements.push("📊 Use the AI Mentor chat to get personalized advice on priorities and blockers.");

    return { suggestions, risks, improvements };
  };

  const fetchAndAnalyze = async () => {
    setLoading(true);
    const data = await fetchSprintData();
    if (data) {
      setSprintData(data);
      setAnalysis(analyzeSprintData(data));

      if (user) {
        await logSprintEvent(sprintId, "ai_mentor_analysis", {}, user.id);
      }
    }
    setLoading(false);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || chatInput.trim();
    if (!text || !sprintData) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: {
          action: "mentor_chat",
          sprintId,
          question: text,
          chatHistory: chatMessages.slice(-6),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const aiMessage: ChatMessage = {
        role: "ai",
        content: data.response || "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (e: any) {
      // Fallback to local response
      const aiMessage: ChatMessage = {
        role: "ai",
        content: generateLocalResponse(text, sprintData),
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    }

    setChatLoading(false);

    if (user) {
      await logSprintEvent(sprintId, "ai_mentor_chat", { question: text.substring(0, 100) }, user.id);
    }
  };

  const generateLocalResponse = (question: string, data: SprintData): string => {
    const q = question.toLowerCase();

    if (q.includes("behind") || q.includes("delayed") || q.includes("slow") || q.includes("why")) {
      const reasons: string[] = [];
      if (data.todoTasks > data.completedTasks) reasons.push(`• ${data.todoTasks} tasks pending vs ${data.completedTasks} completed`);
      if (data.totalCommits < 3) reasons.push("• Very few code commits have been made");
      if (data.totalMembers < 3) reasons.push("• Team size is small for the workload");
      return reasons.length > 0
        ? `Here's why progress may be slow:\n\n${reasons.join("\n")}\n\n**Next steps:** Prioritize high-priority tasks, ensure all team members are actively contributing, and commit code regularly.`
        : "Your sprint seems on track! Keep the current pace.";
    }

    if (q.includes("next") || q.includes("should") || q.includes("do")) {
      if (data.totalTasks === 0) return "**Step 1:** Create tasks using the AI Sprint Planner\n**Step 2:** Assign tasks to team members\n**Step 3:** Start with high-priority items";
      if (data.todoTasks > 0 && data.inProgressTasks === 0) return "**Immediate action:** Pick up the highest-priority pending task and move it to 'In Progress'. Focus on one task at a time.";
      if (data.inProgressTasks > 0) return `You have **${data.inProgressTasks} task(s) in progress**. Complete those before starting new ones. Check if any are blocked.`;
      return "Great progress! Review completed work, prepare for the sprint demo, and document your learnings.";
    }

    return `Sprint "${data.sprintName}": **${data.progress}% complete** • ${data.completedTasks}/${data.totalTasks} tasks done • ${data.daysRemaining} days remaining • ${data.totalMembers} members • ${data.totalCommits} commits.\n\nAsk about risks, priorities, improvements, or team issues for detailed advice.`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display">AI Mentor</h2>
                <p className="text-sm text-muted-foreground">
                  Your intelligent sprint advisor — powered by AI
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAndAnalyze}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Quick Stats */}
          {sprintData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm">{sprintData.progress}% done</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">{sprintData.completedTasks}/{sprintData.totalTasks} tasks</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm">{sprintData.totalMembers} members</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                <Code2 className="w-4 h-4 text-purple-600" />
                <span className="text-sm">{sprintData.totalCommits} commits</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="risks">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Risks
            {analysis.risks.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0">{analysis.risks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="improvements">
            <TrendingUp className="w-4 h-4 mr-2" />
            Improve
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab (now default) */}
        <TabsContent value="chat">
          <Card className="flex flex-col" style={{ height: "520px" }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-5 h-5 text-primary" />
                Chat with AI Mentor
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {/* Quick Question Buttons */}
              {chatMessages.length === 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <Button
                        key={q.label}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleSendMessage(q.question)}
                        disabled={chatLoading}
                      >
                        {q.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 pr-4 mb-3">
                <div className="space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 p-3 rounded-xl bg-muted/50 max-w-[85%]">
                        <p className="text-sm">
                          Hi! I'm your AI Mentor. I analyze your sprint data in real-time to give you actionable advice. Ask me anything about your sprint — priorities, risks, next steps, or team issues.
                        </p>
                      </div>
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === "user" ? "bg-builder/10" : "bg-primary/10"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-4 h-4 text-builder" />
                        ) : (
                          <Bot className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div
                        className={`flex-1 p-3 rounded-xl max-w-[85%] ${
                          msg.role === "user"
                            ? "bg-builder/10 text-foreground ml-auto"
                            : "bg-muted/50"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Analyzing sprint data...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Actions (visible when chat has messages) */}
              {chatMessages.length > 0 && (
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                    <Button
                      key={q.label}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => handleSendMessage(q.question)}
                      disabled={chatLoading}
                    >
                      {q.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about priorities, risks, next steps..."
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  disabled={chatLoading}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || chatLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Next Step Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.suggestions.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  Everything looks great! No specific suggestions at this time.
                </p>
              ) : (
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <Zap className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.risks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No risks detected. Sprint is healthy!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.risks.map((risk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm">{risk}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.improvements.map((improvement, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-sm">{improvement}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
