import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingDown, Calendar, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Finance() {
  const [cash, setCash] = useState(50000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(8000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(2000);

  const netBurn = monthlyExpenses - monthlyRevenue;
  const runwayMonths = netBurn > 0 ? Math.floor(cash / netBurn) : Infinity;

  const chartData = useMemo(() => {
    const data = [];
    let balance = cash;
    for (let i = 0; i <= Math.min(runwayMonths + 2, 24); i++) {
      data.push({
        month: `M${i}`,
        balance: Math.max(0, balance),
      });
      balance -= netBurn;
    }
    return data;
  }, [cash, netBurn, runwayMonths]);

  const deathDate = useMemo(() => {
    if (netBurn <= 0) return "Never (profitable!)";
    const d = new Date();
    d.setMonth(d.getMonth() + runwayMonths);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [netBurn, runwayMonths]);

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Finance & Runway</h1>
          <p className="text-muted-foreground text-sm">Track your burn rate and runway</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Cash on Hand</span>
              </div>
              <p className="text-2xl font-bold">${cash.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Net Burn / Month</span>
              </div>
              <p className="text-2xl font-bold text-red-600">${netBurn > 0 ? netBurn.toLocaleString() : 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Runway</span>
              </div>
              <p className="text-2xl font-bold">{runwayMonths === Infinity ? "∞" : `${runwayMonths} months`}</p>
            </CardContent>
          </Card>
          <Card className={runwayMonths < 6 && runwayMonths !== Infinity ? "border-red-200 bg-red-50/50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-4 w-4 ${runwayMonths < 6 ? "text-red-500" : "text-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground">Death Date</span>
              </div>
              <p className="text-lg font-bold">{deathDate}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Cash Runway Projection</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Balance"]} />
                    <Area type="monotone" dataKey="balance" stroke="hsl(24, 95%, 53%)" fill="hsl(24, 95%, 53%)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Adjust Inputs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Cash on Hand ($)</Label>
                <Input type="number" value={cash} onChange={(e) => setCash(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Monthly Expenses ($)</Label>
                <Input type="number" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Monthly Revenue ($)</Label>
                <Input type="number" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} />
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Try adjusting expenses to see how hiring affects your runway
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
