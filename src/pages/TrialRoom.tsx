import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Clock, Star, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

const mockTrials = [
  {
    id: "1",
    title: "Build a REST API endpoint",
    candidate: "Alex Chen",
    role: "Backend Developer",
    deadline: "48 hours",
    status: "in_progress",
    score: null,
  },
  {
    id: "2",
    title: "Design a dashboard mockup",
    candidate: "Sarah Kim",
    role: "UI Designer",
    deadline: "24 hours",
    status: "completed",
    score: 85,
  },
  {
    id: "3",
    title: "Write unit tests for auth module",
    candidate: "James Lee",
    role: "QA Engineer",
    deadline: "24 hours",
    status: "completed",
    score: 92,
  },
];

export default function TrialRoom() {
  const [showForm, setShowForm] = useState(false);

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Trial Room</h1>
            <p className="text-muted-foreground text-sm">Validate candidates with micro-project trials</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> New Trial
          </Button>
        </div>

        {showForm && (
          <Card className="border-2 border-dashed border-founder/30">
            <CardContent className="p-5 space-y-4">
              <Input placeholder="Trial task title (e.g., Build a login page)" />
              <Textarea placeholder="Task description and requirements..." />
              <div className="flex gap-3">
                <Input placeholder="Candidate name" className="flex-1" />
                <Input placeholder="Role" className="flex-1" />
                <select className="border rounded-lg px-3 text-sm">
                  <option>24 hours</option>
                  <option>48 hours</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm">Assign Trial</Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {mockTrials.map((trial) => (
            <Card key={trial.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    trial.status === "completed" ? "bg-green-100" : "bg-orange-100"
                  }`}>
                    {trial.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{trial.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {trial.candidate} · {trial.role} · {trial.deadline}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {trial.score !== null && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-sm">{trial.score}/100</span>
                    </div>
                  )}
                  <Badge variant={trial.status === "completed" ? "default" : "secondary"}>
                    {trial.status === "completed" ? "Completed" : "In Progress"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
