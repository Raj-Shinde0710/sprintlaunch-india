import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, MessageSquare, FileText, Send } from "lucide-react";
import { useState } from "react";

interface SprintSOPSectionProps {
  ideaPitch: string;
  ideaTitle: string;
}

const defaultSOPs = [
  { id: "1", title: "Sprint Execution Playbook", category: "Engineering" },
  { id: "2", title: "Team Onboarding Process", category: "HR" },
  { id: "3", title: "Code Review Guidelines", category: "Engineering" },
  { id: "4", title: "Customer Discovery Process", category: "Product" },
  { id: "5", title: "Investor Pitch Preparation", category: "Finance" },
];

export function SprintSOPSection({ ideaPitch, ideaTitle }: SprintSOPSectionProps) {
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);

  const filtered = defaultSOPs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAsk = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      const q = userMsg.toLowerCase();
      let answer: string;
      if (q.includes("onboard")) {
        answer = `For "${ideaTitle}", here's a recommended onboarding process:\n\n1. Send welcome message with project context\n2. Share the sprint goals and timeline\n3. Grant access to repository and tools\n4. Assign an onboarding buddy from the team\n5. Schedule first sync within 48 hours`;
      } else if (q.includes("build") || q.includes("feature")) {
        answer = `Based on your idea "${ideaTitle}":\n\n1. Start by defining the MVP scope\n2. Break down into user stories\n3. Prioritize by impact vs effort\n4. Create tasks in the Sprint Planner\n5. Assign to team members based on skills\n6. Set up code review process`;
      } else if (q.includes("user") || q.includes("customer")) {
        answer = `Customer discovery for "${ideaTitle}":\n\n1. Define your target user persona\n2. Prepare 5–10 discovery questions\n3. Reach out via LinkedIn, communities\n4. Conduct 15-min interviews\n5. Document patterns and insights\n6. Validate problem-solution fit`;
      } else {
        answer = `Here's guidance for "${ideaTitle}":\n\n• Review existing SOPs for relevant procedures\n• Consider creating a new SOP for this process\n• Use the AI Mentor for specific tactical advice\n• Keep documentation updated as processes evolve`;
      }
      setChatMessages((prev) => [...prev, { role: "ai", content: answer }]);
    }, 400);
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
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
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
            <MessageSquare className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-sm">Ask AI about your startup</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Ask startup-specific questions</p>
                <p className="text-xs mt-1">e.g., "How to build this feature?" or "How to onboard users?"</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-line ${msg.role === "user" ? "bg-founder text-white" : "bg-muted"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Input placeholder="Ask about your startup..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAsk()} />
            <Button onClick={handleAsk} size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
