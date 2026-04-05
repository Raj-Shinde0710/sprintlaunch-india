import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, MousePointer, Mail, TrendingUp, Plus, Eye } from "lucide-react";
import { useState } from "react";

const mockPages = [
  {
    id: "1",
    title: "AI Writing Assistant",
    clicks: 342,
    signups: 48,
    conversionRate: 14.0,
    demandScore: 82,
    status: "active",
  },
  {
    id: "2",
    title: "Freelancer CRM Tool",
    clicks: 128,
    signups: 12,
    conversionRate: 9.4,
    demandScore: 54,
    status: "active",
  },
  {
    id: "3",
    title: "Pet Health Tracker",
    clicks: 67,
    signups: 3,
    conversionRate: 4.5,
    demandScore: 28,
    status: "paused",
  },
];

export default function Validation() {
  const [showForm, setShowForm] = useState(false);

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Validation</h1>
            <p className="text-muted-foreground text-sm">Fake door tests to validate demand before building</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> New Test
          </Button>
        </div>

        {showForm && (
          <Card className="border-2 border-dashed border-founder/30">
            <CardContent className="p-5 space-y-4">
              <Input placeholder="Product / Feature name" />
              <Textarea placeholder="One-line value proposition..." />
              <Input placeholder="CTA button text (e.g., 'Get Early Access')" />
              <div className="flex gap-2">
                <Button size="sm">Create Landing Page</Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={MousePointer} label="Total Clicks" value="537" />
          <StatCard icon={Mail} label="Total Signups" value="63" />
          <StatCard icon={TrendingUp} label="Avg Conversion" value="11.7%" />
        </div>

        <div className="grid gap-4">
          {mockPages.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    page.demandScore > 70 ? "bg-green-100" : page.demandScore > 40 ? "bg-yellow-100" : "bg-red-100"
                  }`}>
                    <Target className={`h-5 w-5 ${
                      page.demandScore > 70 ? "text-green-600" : page.demandScore > 40 ? "text-yellow-600" : "text-red-600"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{page.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {page.clicks} clicks · {page.signups} signups · {page.conversionRate}% conversion
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold">{page.demandScore}</p>
                    <p className="text-xs text-muted-foreground">Demand Score</p>
                  </div>
                  <Badge variant={page.status === "active" ? "default" : "secondary"}>
                    {page.status}
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

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-founder" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
