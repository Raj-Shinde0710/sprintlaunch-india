import { useState, useEffect, useRef, useCallback } from "react";
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
  Target,
  Users,
  Code2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIMentorProps {
  sprintId: string;
}

interface ChatMessage {
  role: "user" | "assistant";
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

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor-chat`;

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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchAndAnalyze();
    loadChatHistory();
  }, [sprintId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadChatHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_chat_messages")
      .select("role, content, created_at")
      .eq("sprint_id", sprintId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (data && data.length > 0) {
      setChatMessages(
        data.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      );
    }
  };

  const persistMessage = async (role: string, content: string) => {
    if (!user) return;
    await supabase.from("ai_chat_messages").insert({
      sprint_id: sprintId,
      user_id: user.id,
      role,
      content,
    });
  };

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
      risks.push("⚠️ No code activity detected. Development may be stalled.");
    }

    const roles = data.memberRoles.map((r) => r.toLowerCase());
    const hasFrontend = roles.some((r) => r.includes("frontend") || r.includes("ui") || r.includes("fullstack"));
    const hasBackend = roles.some((r) => r.includes("backend") || r.includes("fullstack") || r.includes("server"));
    if (!hasFrontend) risks.push("⚠️ No frontend developer assigned.");
    if (!hasBackend) risks.push("⚠️ No backend developer assigned.");

    const hasDesigner = roles.some((r) => r.includes("design") || r.includes("ui/ux") || r.includes("ux"));
    if (!hasDesigner) improvements.push("🎨 Add a UI/UX designer to improve user experience.");
    if (data.totalCommits < data.completedTasks && data.completedTasks > 0) {
      improvements.push("📝 Commit code more frequently — aim for at least one commit per completed task.");
    }
    improvements.push("📅 Schedule daily 15-minute standups to keep everyone aligned.");
    if (data.progress < 50 && data.daysRemaining > 5) {
      improvements.push("🔨 Break large tasks into smaller subtasks (2-4 hours each) for faster delivery.");
    }

    return { suggestions, risks, improvements };
  };

  const fetchAndAnalyze = async () => {
    setLoading(true);
    const data = await fetchSprintData();
    if (data) {
      setSprintData(data);
      setAnalysis(analyzeSprintData(data));
    }
    setLoading(false);
  };

  const streamChat = useCallback(async (allMessages: ChatMessage[]) => {
    if (!user) return;

    abortRef.current = new AbortController();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          sprintId,
          userId: user.id,
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar, timestamp: new Date() }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar, timestamp: new Date() }];
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Persist assistant message
      if (assistantSoFar) {
        await persistMessage("assistant", assistantSoFar);
      }

      return assistantSoFar;
    } catch (e: any) {
      if (e.name === "AbortError") return;
      throw e;
    }
  }, [sprintId, user]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || chatInput.trim();
    if (!text || chatLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    // Persist user message
    await persistMessage("user", text);

    try {
      await streamChat(newMessages);
    } catch (e: any) {
      console.error("AI Mentor error:", e);
      // Fallback to local response
      const fallback = generateLocalResponse(text, sprintData);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: fallback, timestamp: new Date() },
      ]);
      await persistMessage("assistant", fallback);
    }

    setChatLoading(false);

    if (user) {
      await logSprintEvent(sprintId, "ai_mentor_chat", { question: text.substring(0, 100) }, user.id);
    }
  };

  const generateLocalResponse = (question: string, data: SprintData | null): string => {
    if (!data) return "I couldn't load sprint data. Please try refreshing.";
    const q = question.toLowerCase();

    if (q.includes("next") || q.includes("should") || q.includes("do")) {
      if (data.totalTasks === 0) return "**Step 1:** Create tasks using the AI Sprint Planner\n**Step 2:** Assign tasks to team members\n**Step 3:** Start with high-priority items";
      if (data.todoTasks > 0 && data.inProgressTasks === 0) return "**Immediate action:** Pick up the highest-priority pending task and move it to 'In Progress'.";
      if (data.inProgressTasks > 0) return `You have **${data.inProgressTasks} task(s) in progress**. Complete those before starting new ones.`;
      return "Great progress! Review completed work and prepare for the sprint demo.";
    }

    if (q.includes("risk") || q.includes("problem") || q.includes("issue")) {
      const issues: string[] = [];
      if (data.todoTasks > data.completedTasks) issues.push(`• ${data.todoTasks} pending vs ${data.completedTasks} completed tasks`);
      if (data.totalCommits < 3) issues.push("• Very few code commits");
      if (data.totalMembers < 3) issues.push("• Small team size");
      return issues.length > 0 ? `**Detected risks:**\n\n${issues.join("\n")}` : "No significant risks detected. Keep up the momentum!";
    }

    return `**Sprint "${data.sprintName}"**: ${data.progress}% complete • ${data.completedTasks}/${data.totalTasks} tasks done • ${data.daysRemaining} days remaining • ${data.totalMembers} members • ${data.totalCommits} commits.\n\nAsk about risks, priorities, or team issues for detailed advice.`;
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
                  Intelligent sprint advisor — powered by AI
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAndAnalyze}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

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

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="flex flex-col" style={{ height: "520px" }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-5 h-5 text-primary" />
                Chat with AI Mentor
                <Badge variant="secondary" className="ml-auto text-xs">Streaming</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
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
                          msg.role === "user" ? "bg-primary" : "bg-primary/10"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-4 h-4 text-primary-foreground" />
                        ) : (
                          <Bot className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-xl text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {chatLoading && chatMessages[chatMessages.length - 1]?.role === "user" && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your sprint..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={chatLoading}
                />
                <Button onClick={() => handleSendMessage()} disabled={chatLoading || !chatInput.trim()} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {analysis.suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No suggestions at this time. Your sprint looks good!</p>
                ) : (
                  analysis.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm">{s}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {analysis.risks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No risks detected. Great job!</p>
                ) : (
                  analysis.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm">{r}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {analysis.improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm">{imp}</p>
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
