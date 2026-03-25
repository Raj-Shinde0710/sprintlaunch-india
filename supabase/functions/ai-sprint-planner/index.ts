import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callAI(apiKey: string, messages: any[], tools?: any[], toolChoice?: any) {
  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages,
  };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: "Rate limited. Please try again in a moment." };
    if (response.status === 402) throw { status: 402, message: "AI credits exhausted. Please add funds." };
    const t = await response.text();
    console.error("AI error:", response.status, t);
    throw { status: 500, message: "AI gateway error" };
  }

  return response.json();
}

function extractToolResult(aiData: any) {
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) return JSON.parse(toolCall.function.arguments);
  const content = aiData.choices?.[0]?.message?.content || "";
  return JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, "").trim());
}

function extractContent(aiData: any) {
  return aiData.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, sprintId, ideaDescription, industry, sprintDuration, sprintPlan } = body;

    // ========== GENERATE PLAN ==========
    if (action === "generate_plan") {
      const prompt = `You are a startup sprint planning expert. Generate a structured sprint plan for this startup idea.

Idea: ${ideaDescription}
Industry: ${industry || "General"}
Sprint Duration: ${sprintDuration || 14} days

Generate 3-5 roles, 4 phases (Planning, Development, Testing, Launch), 4-6 milestones, and 5-8 deliverables. Be specific to the idea and industry.`;

      const aiData = await callAI(LOVABLE_API_KEY, [
        { role: "system", content: "You are a startup sprint planning AI. Always respond with valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ], [{
        type: "function",
        function: {
          name: "create_sprint_plan",
          description: "Create a structured sprint plan",
          parameters: {
            type: "object",
            properties: {
              roles: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } }, required: ["title", "description", "priority"] } },
              phases: { type: "array", items: { type: "object", properties: { name: { type: "string" }, startDay: { type: "number" }, endDay: { type: "number" }, description: { type: "string" }, deliverables: { type: "array", items: { type: "string" } } }, required: ["name", "startDay", "endDay", "description", "deliverables"] } },
              milestones: { type: "array", items: { type: "object", properties: { title: { type: "string" }, day: { type: "number" }, description: { type: "string" } }, required: ["title", "day", "description"] } },
              deliverables: { type: "array", items: { type: "string" } },
              riskFactors: { type: "array", items: { type: "string" } },
            },
            required: ["roles", "phases", "milestones", "deliverables", "riskFactors"],
          },
        },
      }], { type: "function", function: { name: "create_sprint_plan" } });

      const plan = extractToolResult(aiData);
      if (sprintId) {
        await supabase.from("sprint_plans").insert({ sprint_id: sprintId, plan_data: plan, status: "draft" });
      }

      return new Response(JSON.stringify({ plan }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== GENERATE TASKS ==========
    if (action === "generate_tasks") {
      const prompt = `You are a startup task planning AI. Generate specific, actionable tasks for this sprint.

Idea: ${ideaDescription}
Sprint Duration: ${sprintDuration || 14} days
Sprint Plan: ${JSON.stringify(sprintPlan)}

Generate 8-15 tasks. Each task must have: title, description, suggestedRole, priority (high/medium/low), estimatedHours (1-20), dueDay (1-${sprintDuration || 14}).`;

      const aiData = await callAI(LOVABLE_API_KEY, [
        { role: "system", content: "You are a startup task planning AI." },
        { role: "user", content: prompt },
      ], [{
        type: "function",
        function: {
          name: "create_tasks",
          description: "Create sprint tasks",
          parameters: {
            type: "object",
            properties: {
              tasks: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, suggestedRole: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] }, estimatedHours: { type: "number" }, dueDay: { type: "number" } }, required: ["title", "description", "suggestedRole", "priority", "estimatedHours", "dueDay"] } },
            },
            required: ["tasks"],
          },
        },
      }], { type: "function", function: { name: "create_tasks" } });

      return new Response(JSON.stringify(extractToolResult(aiData)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== ANALYZE RISK ==========
    if (action === "analyze_risk") {
      const { data: sprint } = await supabase.from("sprints").select("*, idea:ideas(title, pitch)").eq("id", sprintId).single();
      if (!sprint) throw new Error("Sprint not found");

      const { data: tasks } = await supabase.from("tasks").select("status, due_date, hours_logged, hours_estimated").eq("sprint_id", sprintId);
      const { data: members } = await supabase.from("sprint_members").select("hours_logged, hours_committed, is_founder").eq("sprint_id", sprintId).is("left_at", null);

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

      let riskLevel: "healthy" | "slow" | "at_risk" = "healthy";
      const suggestions: string[] = [];

      if (overdueTasks > totalTasks * 0.3 || (completionRate < expectedProgress * 0.5 && daysElapsed > 3)) riskLevel = "at_risk";
      else if (overdueTasks > 0 || completionRate < expectedProgress * 0.75) riskLevel = "slow";

      if (totalHoursCommitted > 0 && totalHoursLogged < totalHoursCommitted * 0.3 && daysElapsed > totalDays * 0.3) {
        riskLevel = riskLevel === "healthy" ? "slow" : "at_risk";
        suggestions.push("Team activity is low. Encourage members to log more hours.");
      }
      if (overdueTasks > 0) suggestions.push(`${overdueTasks} task(s) are overdue. Reassign or reprioritize.`);
      if (totalTasks < 3) suggestions.push("Too few tasks defined. Add more tasks to track progress.");
      if (completionRate < 0.2 && daysElapsed > totalDays * 0.5) suggestions.push("Less than 20% complete past halfway. Consider reducing scope.");

      return new Response(JSON.stringify({
        riskLevel, completionRate: Math.round(completionRate * 100), overdueTasks, totalTasks, completedTasks,
        totalHoursLogged, totalHoursCommitted, daysRemaining, daysElapsed, suggestions,
        message: riskLevel === "healthy" ? "Sprint is progressing well." : riskLevel === "slow" ? "Sprint is progressing slower than expected." : "Sprint is at risk due to low activity or overdue tasks.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== EXECUTION GAPS ==========
    if (action === "detect_gaps") {
      const { data: tasks } = await supabase.from("tasks").select("*").eq("sprint_id", sprintId);
      const { data: members } = await supabase.from("sprint_members").select("user_id, role, hours_logged, hours_committed, is_founder").eq("sprint_id", sprintId).is("left_at", null);
      const { data: sprint } = await supabase.from("sprints").select("*, idea:ideas(title, pitch, required_roles, industry)").eq("id", sprintId).single();

      if (!sprint) throw new Error("Sprint not found");

      const totalTasks = tasks?.length || 0;
      const unassignedTasks = tasks?.filter(t => !t.assignee_id).length || 0;
      const overdueTasks = tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length || 0;
      const pendingTasks = tasks?.filter(t => t.status === "todo").length || 0;
      const memberRoles = members?.map(m => m.role.toLowerCase()) || [];
      const requiredRoles = (sprint.idea?.required_roles || []).map((r: string) => r.toLowerCase());

      const gaps: Array<{ title: string; description: string; severity: "high" | "medium" | "low" }> = [];

      // Missing roles
      for (const role of requiredRoles) {
        if (!memberRoles.some(mr => mr.includes(role) || role.includes(mr))) {
          gaps.push({ title: `Missing: ${role}`, description: `No team member fills the "${role}" role. This may block progress.`, severity: "high" });
        }
      }

      // Unassigned tasks
      if (totalTasks > 0 && unassignedTasks > totalTasks * 0.4) {
        gaps.push({ title: "Too many unassigned tasks", description: `${unassignedTasks} of ${totalTasks} tasks have no assignee. Assign tasks to track accountability.`, severity: "medium" });
      }

      // Overdue tasks
      if (overdueTasks > 2) {
        gaps.push({ title: "Multiple overdue tasks", description: `${overdueTasks} tasks are past their due date. Bottleneck detected.`, severity: "high" });
      } else if (overdueTasks > 0) {
        gaps.push({ title: "Overdue tasks detected", description: `${overdueTasks} task(s) overdue. Review and reprioritize.`, severity: "medium" });
      }

      // High pending ratio
      if (totalTasks > 3 && pendingTasks > totalTasks * 0.7) {
        gaps.push({ title: "Most tasks still pending", description: `${pendingTasks} of ${totalTasks} tasks are still in "To Do". Execution velocity is low.`, severity: "high" });
      }

      // Low member activity
      const inactiveMembers = members?.filter(m => !m.is_founder && (m.hours_logged || 0) === 0) || [];
      if (inactiveMembers.length > 0) {
        gaps.push({ title: "Inactive team members", description: `${inactiveMembers.length} member(s) have logged zero hours. Follow up on participation.`, severity: "medium" });
      }

      // Too few tasks
      if (totalTasks < 3 && members && members.length >= 2) {
        gaps.push({ title: "Insufficient tasks", description: "Very few tasks defined for the team size. Create more tasks to distribute work.", severity: "low" });
      }

      return new Response(JSON.stringify({ gaps }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== SMART TASK ASSIGNMENT ==========
    if (action === "suggest_assignee") {
      const { taskTitle, taskDescription } = body;
      const { data: members } = await supabase.from("sprint_members").select("user_id, role, hours_logged, hours_committed").eq("sprint_id", sprintId).is("left_at", null);
      
      if (!members || members.length === 0) {
        return new Response(JSON.stringify({ suggestions: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, skills, execution_score, tasks_completed").in("id", userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.id] = p; });

      const memberInfo = members.map(m => ({
        user_id: m.user_id,
        role: m.role,
        name: profileMap[m.user_id]?.full_name || "Unknown",
        skills: profileMap[m.user_id]?.skills || [],
        execution_score: profileMap[m.user_id]?.execution_score || 50,
        tasks_completed: profileMap[m.user_id]?.tasks_completed || 0,
        hours_logged: m.hours_logged || 0,
        hours_committed: m.hours_committed || 0,
      }));

      const aiData = await callAI(LOVABLE_API_KEY, [
        { role: "system", content: "You are a team assignment optimizer. Suggest the best team member for a task based on skills, role, and performance." },
        { role: "user", content: `Task: "${taskTitle}"\nDescription: "${taskDescription || 'N/A'}"\n\nTeam members:\n${JSON.stringify(memberInfo, null, 2)}\n\nRank the top 3 best-fit members for this task. Consider role match, skills, execution score, and workload balance.` },
      ], [{
        type: "function",
        function: {
          name: "suggest_assignees",
          description: "Suggest ranked assignees for a task",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    user_id: { type: "string" },
                    name: { type: "string" },
                    reason: { type: "string" },
                    match_score: { type: "number", description: "0-100 match score" },
                  },
                  required: ["user_id", "name", "reason", "match_score"],
                },
              },
            },
            required: ["suggestions"],
          },
        },
      }], { type: "function", function: { name: "suggest_assignees" } });

      return new Response(JSON.stringify(extractToolResult(aiData)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== BUILDER RANKING ==========
    if (action === "rank_builders") {
      const { ideaId } = body;
      const { data: idea } = await supabase.from("ideas").select("title, pitch, industry, required_roles").eq("id", ideaId).single();
      if (!idea) throw new Error("Idea not found");

      // Get builders (users with builder role)
      const { data: builderRoles } = await supabase.from("user_roles").select("user_id").eq("role", "builder");
      if (!builderRoles || builderRoles.length === 0) {
        return new Response(JSON.stringify({ rankings: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const builderIds = builderRoles.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, skills, execution_score, tasks_completed, sprints_completed, availability_hours, location").in("id", builderIds);

      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ rankings: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await callAI(LOVABLE_API_KEY, [
        { role: "system", content: "You are a startup team matching AI. Rank builders by fit for a startup idea." },
        { role: "user", content: `Startup: "${idea.title}"\nPitch: "${idea.pitch}"\nIndustry: ${JSON.stringify(idea.industry)}\nRequired Roles: ${JSON.stringify(idea.required_roles)}\n\nAvailable Builders:\n${JSON.stringify(profiles.map(p => ({ id: p.id, name: p.full_name, skills: p.skills, execution_score: p.execution_score, tasks_completed: p.tasks_completed, sprints_completed: p.sprints_completed, availability: p.availability_hours })), null, 2)}\n\nRank the top 5 best-fit builders. Consider skill match, execution score, and experience.` },
      ], [{
        type: "function",
        function: {
          name: "rank_builders",
          description: "Rank builders by fit",
          parameters: {
            type: "object",
            properties: {
              rankings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    user_id: { type: "string" },
                    name: { type: "string" },
                    match_score: { type: "number" },
                    reason: { type: "string" },
                    best_role: { type: "string" },
                  },
                  required: ["user_id", "name", "match_score", "reason", "best_role"],
                },
              },
            },
            required: ["rankings"],
          },
        },
      }], { type: "function", function: { name: "rank_builders" } });

      return new Response(JSON.stringify(extractToolResult(aiData)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== WEEKLY REPORT ==========
    if (action === "generate_report") {
      const { data: sprint } = await supabase.from("sprints").select("*, idea:ideas(title, pitch)").eq("id", sprintId).single();
      if (!sprint) throw new Error("Sprint not found");

      const { data: tasks } = await supabase.from("tasks").select("*").eq("sprint_id", sprintId);
      const { data: members } = await supabase.from("sprint_members").select("user_id, role, hours_logged, hours_committed, is_founder").eq("sprint_id", sprintId).is("left_at", null);
      const { data: timeline } = await supabase.from("sprint_timeline").select("*").eq("sprint_id", sprintId).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("created_at", { ascending: false });

      const userIds = members?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.id] = p.full_name || "Anonymous"; });

      const totalTasks = tasks?.length || 0;
      const doneTasks = tasks?.filter(t => t.status === "done").length || 0;
      const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length || 0;
      const overdueTasks = tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length || 0;

      const prompt = `Generate a concise weekly sprint report summary in 3-5 paragraphs.

Sprint: ${sprint.name}
Startup: ${sprint.idea?.title}
Progress: ${sprint.progress || 0}%
Tasks: ${doneTasks}/${totalTasks} completed, ${inProgressTasks} in progress, ${overdueTasks} overdue
Team: ${members?.map(m => `${nameMap[m.user_id]} (${m.role}, ${m.hours_logged || 0}h logged)`).join(", ")}
Recent activity: ${timeline?.length || 0} events this week

Write a professional, actionable summary highlighting achievements, blockers, and next steps. Be specific.`;

      const aiData = await callAI(LOVABLE_API_KEY, [
        { role: "system", content: "You are a project management report writer. Write clear, professional weekly reports." },
        { role: "user", content: prompt },
      ]);

      const report = extractContent(aiData);

      return new Response(JSON.stringify({
        report,
        stats: { totalTasks, doneTasks, inProgressTasks, overdueTasks, teamSize: members?.length || 0, totalHoursLogged: members?.reduce((s, m) => s + (m.hours_logged || 0), 0) || 0 },
        generatedAt: new Date().toISOString(),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== PITCH GENERATOR ==========
    if (action === "generate_pitch") {
      const { ideaId } = body;
      const { data: idea } = await supabase.from("ideas").select("*").eq("id", ideaId).single();
      if (!idea) throw new Error("Idea not found");

      const { data: sprints } = await supabase.from("sprints").select("id, name, status, progress, duration_days").eq("idea_id", ideaId).order("created_at", { ascending: false }).limit(1);
      const sprint = sprints?.[0];

      let teamInfo = "";
      if (sprint) {
        const { data: members } = await supabase.from("sprint_members").select("role, is_founder, hours_logged").eq("sprint_id", sprint.id).is("left_at", null);
        teamInfo = `Team: ${members?.length || 0} members (${members?.map(m => m.role).join(", ")})`;
      }

      const prompt = `Generate a compelling startup pitch for investors based on this data:

Title: ${idea.title}
Pitch: ${idea.pitch}
Problem: ${idea.problem_statement || "Not specified"}
Target Users: ${idea.target_users || "Not specified"}
Industry: ${JSON.stringify(idea.industry)}
Stage: ${idea.stage}
${sprint ? `Sprint Progress: ${sprint.progress}%\n${teamInfo}` : ""}

Create a structured pitch with these sections:
1. Problem - What pain point are you solving?
2. Solution - How does your product solve it?
3. Market - Who are the target users and market size?
4. Product - What have you built so far?
5. Team - Who is building this?
6. Traction - What progress has been made?

Make it compelling, specific, and investor-ready. Each section should be 2-3 sentences.`;

      const aiData = await callAI(LOVABLE_API_KEY, [
        { role: "system", content: "You are a startup pitch expert. Create compelling, investor-ready pitches." },
        { role: "user", content: prompt },
      ], [{
        type: "function",
        function: {
          name: "create_pitch",
          description: "Create a structured startup pitch",
          parameters: {
            type: "object",
            properties: {
              sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                  },
                  required: ["title", "content"],
                },
              },
              tagline: { type: "string", description: "One-line elevator pitch" },
            },
            required: ["sections", "tagline"],
          },
        },
      }], { type: "function", function: { name: "create_pitch" } });

      return new Response(JSON.stringify(extractToolResult(aiData)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("Sprint planner error:", e);
    const status = e.status || 500;
    const message = e.message || (e instanceof Error ? e.message : "Unknown error");
    return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
