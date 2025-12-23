import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calculator, Users, Clock, Coins, TrendingUp, Info, Lightbulb, Code2, Wallet } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: "founder" | "builder" | "backer";
  hoursPerWeek: number;
  weeksCommitted: number;
  skillLevel: number; // 1-5
  cashInvested: number;
}

const defaultMembers: TeamMember[] = [
  { id: "1", name: "Priya (Founder)", role: "founder", hoursPerWeek: 40, weeksCommitted: 12, skillLevel: 3, cashInvested: 0 },
  { id: "2", name: "Arjun (Dev)", role: "builder", hoursPerWeek: 20, weeksCommitted: 8, skillLevel: 5, cashInvested: 0 },
  { id: "3", name: "Kavitha (Design)", role: "builder", hoursPerWeek: 15, weeksCommitted: 8, skillLevel: 4, cashInvested: 0 },
  { id: "4", name: "Rajesh (Backer)", role: "backer", hoursPerWeek: 2, weeksCommitted: 12, skillLevel: 2, cashInvested: 500000 },
];

export default function EquityCalculator() {
  const [members, setMembers] = useState<TeamMember[]>(defaultMembers);
  const [ideaWeight, setIdeaWeight] = useState([20]); // 0-100, weight given to the idea itself
  const [cashWeight, setCashWeight] = useState([30]); // 0-100, weight given to cash investment

  const updateMember = (id: string, field: keyof TeamMember, value: number) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Calculate equity based on contributions
  const calculateEquity = () => {
    const totalHours = members.reduce((sum, m) => sum + (m.hoursPerWeek * m.weeksCommitted), 0);
    const totalCash = members.reduce((sum, m) => sum + m.cashInvested, 0);
    const totalSkillPoints = members.reduce((sum, m) => sum + (m.hoursPerWeek * m.weeksCommitted * m.skillLevel), 0);

    const timeWeight = (100 - ideaWeight[0] - cashWeight[0]) / 100;
    const cashWeightValue = cashWeight[0] / 100;
    const ideaWeightValue = ideaWeight[0] / 100;

    return members.map(m => {
      const isFounder = m.role === "founder";
      const hours = m.hoursPerWeek * m.weeksCommitted;
      const skillPoints = hours * m.skillLevel;
      
      // Time contribution (weighted by skill)
      const timeContrib = totalSkillPoints > 0 ? (skillPoints / totalSkillPoints) * timeWeight * 100 : 0;
      
      // Cash contribution
      const cashContrib = totalCash > 0 ? (m.cashInvested / totalCash) * cashWeightValue * 100 : 0;
      
      // Idea bonus (only for founder)
      const ideaBonus = isFounder ? ideaWeightValue * 100 : 0;
      
      return {
        ...m,
        equity: Math.round((timeContrib + cashContrib + ideaBonus) * 10) / 10,
        timeContrib: Math.round(timeContrib * 10) / 10,
        cashContrib: Math.round(cashContrib * 10) / 10,
        ideaBonus: Math.round(ideaBonus * 10) / 10,
      };
    });
  };

  const equityResults = calculateEquity();
  const totalEquity = equityResults.reduce((sum, m) => sum + m.equity, 0);

  const getColorClass = (role: string) => {
    if (role === "founder") return "founder";
    if (role === "builder") return "builder";
    return "backer";
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-backer/10 text-backer text-sm font-medium mb-4">
              <Calculator className="w-4 h-4" />
              Live Equity Calculator
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fair Equity Distribution
            </h1>
            <p className="text-muted-foreground text-lg">
              Calculate contribution-based equity splits in real-time. Adjust weights and see how equity changes dynamically.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Team Members */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-builder" />
                  Team Contributions
                </h2>

                <div className="space-y-6">
                  {members.map((member, index) => {
                    const colorClass = getColorClass(member.role);
                    const result = equityResults.find(r => r.id === member.id)!;
                    
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-5 rounded-xl border-2 border-border hover:border-${colorClass}/30 transition-colors`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-${colorClass}/10 flex items-center justify-center`}>
                              {member.role === "founder" && <Lightbulb className={`w-5 h-5 text-${colorClass}`} />}
                              {member.role === "builder" && <Code2 className={`w-5 h-5 text-${colorClass}`} />}
                              {member.role === "backer" && <Wallet className={`w-5 h-5 text-${colorClass}`} />}
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{member.name}</h3>
                              <span className={`text-xs text-${colorClass} font-medium capitalize`}>{member.role}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-display text-2xl font-bold text-${colorClass}`}>
                              {result.equity}%
                            </div>
                            <div className="text-xs text-muted-foreground">equity</div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Hours/Week</Label>
                            <Input
                              type="number"
                              value={member.hoursPerWeek}
                              onChange={(e) => updateMember(member.id, "hoursPerWeek", parseInt(e.target.value) || 0)}
                              className="mt-1 h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Weeks</Label>
                            <Input
                              type="number"
                              value={member.weeksCommitted}
                              onChange={(e) => updateMember(member.id, "weeksCommitted", parseInt(e.target.value) || 0)}
                              className="mt-1 h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Skill Level (1-5)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={member.skillLevel}
                              onChange={(e) => updateMember(member.id, "skillLevel", Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                              className="mt-1 h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Cash Invested (₹)</Label>
                            <Input
                              type="number"
                              value={member.cashInvested}
                              onChange={(e) => updateMember(member.id, "cashInvested", parseInt(e.target.value) || 0)}
                              className="mt-1 h-9"
                            />
                          </div>
                        </div>

                        {/* Breakdown */}
                        <div className="mt-4 pt-4 border-t border-border flex gap-4 text-xs">
                          <span className="text-muted-foreground">
                            Time: <span className="text-foreground font-medium">{result.timeContrib}%</span>
                          </span>
                          <span className="text-muted-foreground">
                            Cash: <span className="text-foreground font-medium">{result.cashContrib}%</span>
                          </span>
                          {result.ideaBonus > 0 && (
                            <span className="text-muted-foreground">
                              Idea: <span className="text-founder font-medium">{result.ideaBonus}%</span>
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Weights & Visualization */}
            <div className="space-y-6">
              {/* Weights */}
              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-founder" />
                  Equity Weights
                </h2>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">Idea Value Weight</Label>
                      <span className="text-sm font-medium text-founder">{ideaWeight[0]}%</span>
                    </div>
                    <Slider
                      value={ideaWeight}
                      onValueChange={setIdeaWeight}
                      max={50}
                      step={5}
                      className="py-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Bonus equity for the founder's original idea
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">Cash Investment Weight</Label>
                      <span className="text-sm font-medium text-backer">{cashWeight[0]}%</span>
                    </div>
                    <Slider
                      value={cashWeight}
                      onValueChange={setCashWeight}
                      max={50}
                      step={5}
                      className="py-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Weight given to monetary contributions
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Time/Skill Weight</span>
                      <span className="text-sm font-medium text-builder">
                        {100 - ideaWeight[0] - cashWeight[0]}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Remaining weight distributed by time × skill level
                    </p>
                  </div>
                </div>
              </div>

              {/* Equity Chart */}
              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-backer" />
                  Equity Split
                </h2>

                <div className="space-y-3">
                  {equityResults.map((member) => {
                    const colorClass = getColorClass(member.role);
                    return (
                      <div key={member.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{member.name}</span>
                          <span className={`text-sm font-bold text-${colorClass}`}>{member.equity}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(member.equity / 100) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={`h-full rounded-full bg-${colorClass}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className={`text-lg font-bold ${Math.abs(totalEquity - 100) < 0.1 ? 'text-builder' : 'text-destructive'}`}>
                      {Math.round(totalEquity * 10) / 10}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 rounded-xl bg-builder/10 border border-builder/20">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-builder flex-shrink-0" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">Dynamic Calculation</p>
                    <p className="text-muted-foreground">
                      This calculator updates in real-time during sprints based on actual contributions tracked on the platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
