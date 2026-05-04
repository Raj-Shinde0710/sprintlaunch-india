import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, MessageSquare, FileText, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface SprintSOPSectionProps {
  ideaPitch: string;
  ideaTitle: string;
  sprintId?: string;
  departmentId?: string | null;
  departmentName?: string;
}

const defaultSOPs = [
  { id: "1", title: "Sprint Execution Playbook", category: "Engineering" },
  { id: "2", title: "Team Onboarding Process", category: "HR" },
  { id: "3", title: "Code Review Guidelines", category: "Engineering" },
  { id: "4", title: "Customer Discovery Process", category: "Product" },
  { id: "5", title: "Investor Pitch Preparation", category: "Finance" },
];

const SOP_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-sop-chat`;

export function SprintSOPSection({ ideaPitch, ideaTitle }: SprintSOPSectionProps) {
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const filtered = defaultSOPs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAsk = async () => {
    if (!chatInput.trim() || isLoading) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsLoading(true);

    try {
      const resp = await fetch(SOP_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          question: userMsg,
          ideaTitle,
          ideaPitch,
          chatHistory: chatMessages.slice(-6),
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      while (true) {
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
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch {
      // Fallback to rule-based
      const q = userMsg.toLowerCase();
      let answer: string;
      if (q.includes("onboard")) {
        answer = `For "${ideaTitle}", here's a recommended onboarding process:\n\n1. Send welcome message with project context\n2. Share the sprint goals and timeline\n3. Grant access to repository and tools\n4. Assign an onboarding buddy\n5. Schedule first sync within 48 hours`;
      } else if (q.includes("build") || q.includes("feature")) {
        answer = `Based on your idea "${ideaTitle}":\n\n1. Define the MVP scope\n2. Break down into user stories\n3. Prioritize by impact vs effort\n4. Create tasks in Sprint Planner\n5. Assign to team members\n6. Set up code review process`;
      } else {
        answer = `Here's guidance for "${ideaTitle}":\n\n• Review existing SOPs for relevant procedures\n• Consider creating a new SOP for this process\n• Use the AI Mentor for specific tactical advice`;
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold">SOP Assistant</h2>
        <p className="text-muted-foreground text-sm">AI-powered knowledge base for your startup</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search SOPs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          {filtered.map((sop) => (
            <Card key={sop.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{sop.title}</p>
                  <p className="text-xs text-muted-foreground">{sop.category}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="flex flex-col h-[500px]">
          <div className="p-4 border-b flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Ask AI about your startup</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Ask startup-specific questions</p>
                <p className="text-xs mt-1">e.g., "How to build this feature?" or "How to onboard users?"</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && chatMessages[chatMessages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-2.5 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder="Ask about your startup..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={isLoading}
            />
            <Button onClick={handleAsk} size="icon" disabled={isLoading || !chatInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
