import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Plus, MessageSquare, FileText, Send } from "lucide-react";
import { useState } from "react";

const mockSOPs = [
  { id: "1", title: "Onboarding New Team Members", category: "HR", updated: "2 days ago" },
  { id: "2", title: "Sprint Execution Playbook", category: "Engineering", updated: "1 week ago" },
  { id: "3", title: "Customer Refund Process", category: "Support", updated: "3 days ago" },
  { id: "4", title: "Code Review Guidelines", category: "Engineering", updated: "5 days ago" },
  { id: "5", title: "Investor Pitch Preparation", category: "Finance", updated: "1 day ago" },
];

export default function SOPPlaybook() {
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);

  const filtered = mockSOPs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAsk = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      const answer = generateSOPAnswer(userMsg);
      setChatMessages((prev) => [...prev, { role: "ai", content: answer }]);
    }, 500);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">SOP / Playbook</h1>
            <p className="text-muted-foreground text-sm">Internal knowledge base with AI search</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add SOP</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SOPs List */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SOPs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {filtered.map((sop) => (
              <Card key={sop.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{sop.title}</p>
                    <p className="text-xs text-muted-foreground">{sop.category} · Updated {sop.updated}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Chat */}
          <Card className="flex flex-col h-[500px]">
            <div className="p-4 border-b flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <span className="font-semibold text-sm">Ask AI about SOPs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Ask a question about your SOPs</p>
                  <p className="text-xs mt-1">e.g., "How to handle refund?"</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-founder text-white"
                      : "bg-muted"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <Input
                placeholder="Ask about SOPs..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              />
              <Button onClick={handleAsk} size="icon"><Send className="h-4 w-4" /></Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function generateSOPAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("refund")) return "According to the Customer Refund Process SOP:\n\n1. Verify the refund request within 24 hours\n2. Check eligibility criteria\n3. Process refund through the payment gateway\n4. Notify customer with confirmation email";
  if (q.includes("onboard")) return "The Onboarding Playbook says:\n\n1. Send welcome email with team intro\n2. Grant access to tools (Slack, GitHub, etc.)\n3. Assign an onboarding buddy\n4. Schedule first 1-on-1 within 48 hours";
  if (q.includes("code review") || q.includes("review")) return "Code Review Guidelines:\n\n1. All PRs require at least 1 approval\n2. Check for test coverage > 80%\n3. Review for security vulnerabilities\n4. Provide constructive feedback within 24 hours";
  return "I found relevant information in your SOPs. Here's a summary:\n\n• Check your existing playbooks for detailed procedures\n• Consider creating a new SOP if this process isn't documented yet\n• Keep SOPs updated as processes evolve";
}
