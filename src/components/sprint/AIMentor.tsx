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
      supabase
        .from("sprints")
        .select("name, status, progress, end_date, duration_days")
        .eq("id", sprintId)
        .single(),
      supabase
        .from("tasks")
        .select("status, assignee_id, title, priority")
        .eq("sprint_id", sprintId),
      supabase
        .from("sprint_members")
        .select("role, user_id, hours_logged, is_founder")
        .eq("sprint_id", sprintId)
        .is("left_at", null),
      supabase
        .from("code_commits")
        .select("id")
        .eq("sprint_id", sprintId),
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

    // Suggestions based on task status
    if (data.todoTasks > data.completedTasks && data.totalTasks > 0) {
      suggestions.push("Focus on completing pending tasks before adding new ones.");
    }
    if (data.inProgressTasks === 0 && data.todoTasks > 0) {
      suggestions.push("No tasks are currently in progress. Start working on high-priority items.");
    }
    if (data.completedTasks > 0 && data.todoTasks > 0) {
      suggestions.push(`You've completed ${data.completedTasks} tasks. Keep the momentum going with the remaining ${data.todoTasks} tasks.`);
    }
    if (data.totalTasks === 0) {
      suggestions.push("Create and assign tasks to get started with your sprint.");
    }
    if (data.totalCommits === 0 && data.status === "active") {
      suggestions.push("No code commits yet. Start committing code to track progress.");
    }

    // Risks
    const completionRate = data.totalTasks > 0 ? (data.completedTasks / data.totalTasks) * 100 : 0;
    if (data.daysRemaining <= 3 && completionRate < 50) {
      risks.push(`⚠️ Only ${data.daysRemaining} days remaining with ${completionRate.toFixed(0)}% completion. Sprint is at risk.`);
    }
    if (data.todoTasks > data.totalTasks * 0.7 && data.status === "active") {
      risks.push("⚠️ More than 70% of tasks are still pending. Increase team velocity.");
    }
    if (data.totalMembers < 2) {
      risks.push("⚠️ Team is too small. Consider adding more members for better execution.");
    }
    if (data.totalCommits === 0 && data.status === "active") {
      risks.push("⚠️ No code activity detected. Development may be stalled.");
    }
    if (data.status === "paused") {
      risks.push("⚠️ Sprint is currently paused. Resume soon to avoid falling behind.");
    }

    // Gap detection
    const roles = data.memberRoles.map((r) => r.toLowerCase());
    const commonRoles = ["frontend", "backend", "designer", "ui/ux", "fullstack", "full stack", "developer"];
    const hasFrontend = roles.some((r) => r.includes("frontend") || r.includes("front-end") || r.includes("ui") || r.includes("fullstack"));
    const hasBackend = roles.some((r) => r.includes("backend") || r.includes("back-end") || r.includes("fullstack") || r.includes("server"));
    const hasDesigner = roles.some((r) => r.includes("design") || r.includes("ui/ux") || r.includes("ux"));

    if (!hasFrontend) {
      risks.push("⚠️ No frontend developer assigned. UI development may be blocked.");
    }
    if (!hasBackend) {
      risks.push("⚠️ No backend developer assigned. API development may be blocked.");
    }

    // Improvements
    if (!hasDesigner) {
      improvements.push("Consider adding a UI/UX designer to improve user experience.");
    }
    if (data.totalCommits < data.completedTasks && data.completedTasks > 0) {
      improvements.push("Commit code more frequently to maintain a clear development history.");
    }
    improvements.push("Set up regular team check-ins to maintain alignment and momentum.");
    if (data.progress < 50 && data.daysRemaining > 5) {
      improvements.push("Break down large tasks into smaller, actionable subtasks for faster delivery.");
    }
    if (data.totalMembers >= 3) {
      improvements.push("Use peer reviews to maintain code quality and knowledge sharing.");
    }

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

  const generateChatResponse = (question: string, data: SprintData): string => {
    const q = question.toLowerCase();

    if (q.includes("behind") || q.includes("delayed") || q.includes("slow") || q.includes("why")) {
      const reasons: string[] = [];
      if (data.todoTasks > data.completedTasks) {
        reasons.push(`${data.todoTasks} tasks are still pending while only ${data.completedTasks} are completed`);
      }
      if (data.totalCommits < 3) {
        reasons.push("very few code commits have been made");
      }
      if (data.totalMembers < 3) {
        reasons.push("the team size is small for the workload");
      }
      return reasons.length > 0
        ? `Based on your sprint data, here's why progress may be slow: ${reasons.join(", ")}. I recommend prioritizing critical tasks and ensuring all team members are actively contributing.`
        : "Your sprint seems to be on track! Keep maintaining the current pace.";
    }

    if (q.includes("next") || q.includes("should") || q.includes("do")) {
      if (data.totalTasks === 0) return "Start by creating tasks and assigning them to team members. Define clear deliverables for each task.";
      if (data.todoTasks > 0 && data.inProgressTasks === 0) return "Pick up pending tasks and start working on them. Focus on high-priority items first.";
      if (data.inProgressTasks > 0) return `You have ${data.inProgressTasks} task(s) in progress. Focus on completing those before starting new ones.`;
      return "Great progress! Review completed tasks, clean up any loose ends, and prepare for the sprint demo.";
    }

    if (q.includes("improve") || q.includes("better") || q.includes("tips")) {
      const tips = [
        "Break large tasks into smaller, manageable subtasks.",
        "Commit code frequently to maintain clear history.",
        "Hold daily standups to keep everyone aligned.",
        "Review and prioritize tasks at the start of each day.",
      ];
      return `Here are some tips to improve your sprint:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
    }

    if (q.includes("progress") || q.includes("status") || q.includes("how")) {
      return `Sprint "${data.sprintName}" is at ${data.progress}% progress. ${data.completedTasks}/${data.totalTasks} tasks completed, ${data.daysRemaining} days remaining, ${data.totalMembers} team members, and ${data.totalCommits} code commits.`;
    }

    if (q.includes("risk") || q.includes("problem") || q.includes("issue")) {
      const risks = analysis.risks;
      return risks.length > 0
        ? `Here are the current risks:\n\n${risks.join("\n")}`
        : "No major risks detected at the moment. Keep up the good work!";
    }

    if (q.includes("team") || q.includes("member") || q.includes("role")) {
      const roles = data.memberRoles;
      return `Your team has ${data.totalMembers} member(s) with roles: ${roles.join(", ")}. ${
        data.totalMembers < 3 ? "Consider recruiting more members for better coverage." : "Team size looks good!"
      }`;
    }

    // Default response
    return `Based on your sprint data: ${data.progress}% complete, ${data.completedTasks}/${data.totalTasks} tasks done, ${data.daysRemaining} days remaining. ${
      data.todoTasks > 0 ? `Focus on the ${data.todoTasks} pending task(s).` : "All tasks are in progress or completed!"
    } Feel free to ask about risks, progress, team, or improvements.`;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !sprintData) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    // Simulate brief thinking time
    await new Promise((r) => setTimeout(r, 500));

    const aiResponse = generateChatResponse(chatInput, sprintData);
    const aiMessage: ChatMessage = {
      role: "ai",
      content: aiResponse,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, aiMessage]);
    setChatLoading(false);

    if (user) {
      await logSprintEvent(sprintId, "ai_mentor_chat", { question: chatInput.substring(0, 100) }, user.id);
    }
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
                  Your intelligent sprint advisor
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAndAnalyze}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Analysis
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
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="suggestions">
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="risks">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Risks
          </TabsTrigger>
          <TabsTrigger value="improvements">
            <TrendingUp className="w-4 h-4 mr-2" />
            Improvements
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
        </TabsList>

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

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="flex flex-col" style={{ height: "500px" }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-5 h-5 text-primary" />
                Chat with AI Mentor
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {/* Welcome message */}
                  {chatMessages.length === 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 p-3 rounded-xl bg-muted/50 max-w-[85%]">
                        <p className="text-sm">
                          Hi! I'm your AI Mentor. I can help you with sprint strategy, risk assessment, and next steps. Try asking:
                        </p>
                        <div className="mt-2 space-y-1">
                          {[
                            "What should we do next?",
                            "Why are we behind?",
                            "What are the risks?",
                            "How can we improve?",
                          ].map((q) => (
                            <button
                              key={q}
                              onClick={() => {
                                setChatInput(q);
                              }}
                              className="block text-xs text-primary hover:underline cursor-pointer"
                            >
                              "{q}"
                            </button>
                          ))}
                        </div>
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
                          msg.role === "user"
                            ? "bg-builder/10"
                            : "bg-primary/10"
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
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your AI Mentor a question..."
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  disabled={chatLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
