import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Upload, Eye, Clock, TrendingUp, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockDecks = [
  {
    id: "1",
    name: "Series A Deck - Q2 2026",
    views: 24,
    avgTime: "4:32",
    slideData: [
      { slide: "Problem", time: 45 },
      { slide: "Solution", time: 38 },
      { slide: "Market", time: 62 },
      { slide: "Traction", time: 85 },
      { slide: "Team", time: 30 },
      { slide: "Financials", time: 72 },
      { slide: "Ask", time: 55 },
    ],
    topInsight: "Investors spend most time on Traction & Financials slides",
  },
  {
    id: "2",
    name: "Seed Pitch - Jan 2026",
    views: 12,
    avgTime: "3:15",
    slideData: [
      { slide: "Problem", time: 35 },
      { slide: "Solution", time: 50 },
      { slide: "Demo", time: 90 },
      { slide: "Ask", time: 40 },
    ],
    topInsight: "Demo slide gets the most attention — keep it strong",
  },
];

export default function InvestorTracker() {
  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Investor Tracker</h1>
            <p className="text-muted-foreground text-sm">Track pitch deck engagement and investor interest</p>
          </div>
          <Button className="gap-2"><Upload className="h-4 w-4" /> Upload Deck</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Eye className="h-5 w-5 text-founder" />
              <div>
                <p className="text-2xl font-bold">36</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">4:02</p>
                <p className="text-xs text-muted-foreground">Avg View Time</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Active Decks</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {mockDecks.map((deck) => (
          <Card key={deck.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{deck.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{deck.views} views</Badge>
                  <Badge variant="secondary">Avg {deck.avgTime}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-founder" />
                  {deck.topInsight}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Time per Slide (seconds)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deck.slideData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="slide" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="time" fill="hsl(24, 95%, 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
