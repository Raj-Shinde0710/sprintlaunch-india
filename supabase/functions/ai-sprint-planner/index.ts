import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, sprintId, ideaDescription, industry, sprintDuration, sprintPlan } = await req.json();

    if (action === "generate_plan") {
      const prompt = `You are a startup sprint planning expert. Generate a structured sprint plan for this startup idea.

Idea: ${ideaDescription}
Industry: ${industry || "General"}
Sprint Duration: ${sprintDuration || 14} days

Return a JSON object with this exact structure:
{
  "roles": [{"title": "string", "description": "string", "priority": "high|medium|low"}],
  "phases": [{"name": "string", "startDay": number, "endDay": number, "description": "string", "deliverables": ["string"]}],
  "milestones": [{"title": "string", "day": number, "description": "string"}],
  "deliverables": ["string"],
  "riskFactors": ["string"]
}

Generate 3-5 roles, 4 phases (Planning, Development, Testing, Launch), 4-6 milestones, and 5-8 deliverables. Be specific to the idea and industry.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a startup sprint planning AI. Always respond with valid JSON only, no markdown." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_sprint_plan",
              description: "Create a structured sprint plan",
              parameters: {
                type: "object",
                properties: {
                  roles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["title", "description", "priority"],
                    },
                  },
                  phases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        startDay: { type: "number" },
                        endDay: { type: "number" },
                        description: { type: "string" },
                        deliverables: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "startDay", "endDay", "description", "deliverables"],
                    },
                  },
                  milestones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        day: { type: "number" },
                        description: { type: "string" },
                      },
                      required: ["title", "day", "description"],
                    },
                  },
                  deliverables: { type: "array", items: { type: "string" } },
                  riskFactors: { type: "array", items: { type: "string" } },
                },
                required: ["roles", "phases", "milestones", "deliverables", "riskFactors"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_sprint_plan" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI error:", response.status, t);
        throw new Error("AI gateway error");
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let plan;
      if (toolCall) {
        plan = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try parsing content
        const content = aiData.choices?.[0]?.message?.content || "";
        plan = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, "").trim());
      }

      // Store plan if sprintId provided
      if (sprintId) {
        await supabase.from("sprint_plans").insert({
          sprint_id: sprintId,
          plan_data: plan,
          status: "draft",
        });
      }

      return new Response(JSON.stringify({ plan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_tasks") {
      const prompt = `You are a startup task planning AI. Generate specific, actionable tasks for this sprint.

Idea: ${ideaDescription}
Sprint Duration: ${sprintDuration || 14} days
Sprint Plan: ${JSON.stringify(sprintPlan)}

Generate 8-15 tasks. Each task must have:
- title: clear, actionable task name
- description: detailed description of what to do
- suggestedRole: which role should handle this (e.g. "Frontend Developer", "Designer")
- priority: "high", "medium", or "low"
- estimatedHours: realistic hour estimate (1-20)
- dueDay: which day of the sprint (1-${sprintDuration || 14})`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a startup task planning AI. Always respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_tasks",
              description: "Create sprint tasks",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        suggestedRole: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        estimatedHours: { type: "number" },
                        dueDay: { type: "number" },
                      },
                      required: ["title", "description", "suggestedRole", "priority", "estimatedHours", "dueDay"],
                    },
                  },
                },
                required: ["tasks"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_tasks" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let tasksData;
      if (toolCall) {
        tasksData = JSON.parse(toolCall.function.arguments);
      } else {
        const content = aiData.choices?.[0]?.message?.content || "";
        tasksData = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, "").trim());
      }

      return new Response(JSON.stringify(tasksData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze_risk") {
      // Fetch sprint data from DB
      const { data: sprint } = await supabase
        .from("sprints")
        .select("*, idea:ideas(title, pitch)")
        .eq("id", sprintId)
        .single();

      if (!sprint) throw new Error("Sprint not found");

      const { data: tasks } = await supabase
        .from("tasks")
        .select("status, due_date, hours_logged, hours_estimated")
        .eq("sprint_id", sprintId);

      const { data: members } = await supabase
        .from("sprint_members")
        .select("hours_logged, hours_committed, is_founder")
        .eq("sprint_id", sprintId)
        .is("left_at", null);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === "done").length || 0;
      const overdueTasks = tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length || 0;
      const totalHoursLogged = members?.reduce((s, m) => s + (m.hours_logged || 0), 0) || 0;
      const totalHoursCommitted = members?.reduce((s, m) => s + (m.hours_committed || 0), 0) || 0;
      const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

      const endDate = sprint.end_date ? new Date(sprint.end_date) : null;
      const daysRemaining = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000)) : 0;
      const totalDays = sprint.duration_days;
      const daysElapsed = totalDays - daysRemaining;
      const expectedProgress = totalDays > 0 ? daysElapsed / totalDays : 0;

      // Determine risk level
      let riskLevel: "healthy" | "slow" | "at_risk" = "healthy";
      const suggestions: string[] = [];

      if (overdueTasks > totalTasks * 0.3 || (completionRate < expectedProgress * 0.5 && daysElapsed > 3)) {
        riskLevel = "at_risk";
      } else if (overdueTasks > 0 || completionRate < expectedProgress * 0.75) {
        riskLevel = "slow";
      }

      if (totalHoursCommitted > 0 && totalHoursLogged < totalHoursCommitted * 0.3 && daysElapsed > totalDays * 0.3) {
        riskLevel = riskLevel === "healthy" ? "slow" : "at_risk";
        suggestions.push("Team activity is low. Encourage members to log more hours.");
      }

      if (overdueTasks > 0) suggestions.push(`${overdueTasks} task(s) are overdue. Reassign or reprioritize.`);
      if (totalTasks < 3) suggestions.push("Too few tasks defined. Add more tasks to track progress.");
      if (completionRate < 0.2 && daysElapsed > totalDays * 0.5) suggestions.push("Less than 20% complete past halfway. Consider reducing scope.");

      const riskData = {
        riskLevel,
        completionRate: Math.round(completionRate * 100),
        overdueTasks,
        totalTasks,
        completedTasks,
        totalHoursLogged,
        totalHoursCommitted,
        daysRemaining,
        daysElapsed,
        suggestions,
        message: riskLevel === "healthy" 
          ? "Sprint is progressing well."
          : riskLevel === "slow"
          ? "Sprint is progressing slower than expected."
          : "Sprint is at risk due to low activity or overdue tasks.",
      };

      return new Response(JSON.stringify(riskData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Sprint planner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
