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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sprintId, messages: clientMessages, userId } = await req.json();

    if (!sprintId || !clientMessages || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch sprint context
    const [
      { data: sprint },
      { data: tasks },
      { data: members },
      { data: commits },
      { data: timeline },
    ] = await Promise.all([
      supabase.from("sprints").select("name, status, progress, end_date, duration_days, goal, start_date, idea:ideas(title, pitch, industry, required_roles, problem_statement, target_users)").eq("id", sprintId).single(),
      supabase.from("tasks").select("title, status, priority, assignee_id, due_date, hours_estimated, hours_logged, description").eq("sprint_id", sprintId),
      supabase.from("sprint_members").select("user_id, role, hours_logged, hours_committed, is_founder, peer_rating").eq("sprint_id", sprintId).is("left_at", null),
      supabase.from("code_commits").select("commit_message, language, lines_of_code, created_at").eq("sprint_id", sprintId).order("created_at", { ascending: false }).limit(10),
      supabase.from("sprint_timeline").select("event_type, event_data, created_at").eq("sprint_id", sprintId).order("created_at", { ascending: false }).limit(15),
    ]);

    if (!sprint) {
      return new Response(JSON.stringify({ error: "Sprint not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get member profiles
    const memberList = members || [];
    const memberIds = memberList.map(m => m.user_id);
    let profilesMap: Record<string, string> = {};
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", memberIds);
      profilesMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name || "Anonymous"]));
    }

    const taskList = tasks || [];
    const commitList = commits || [];
    const timelineList = timeline || [];
    const endDate = sprint.end_date ? new Date(sprint.end_date) : null;
    const startDate = sprint.start_date ? new Date(sprint.start_date) : null;
    const daysRemaining = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000)) : sprint.duration_days || 14;
    const daysElapsed = startDate ? Math.ceil((Date.now() - startDate.getTime()) / 86400000) : 0;

    const completedTasks = taskList.filter(t => t.status === "done").length;
    const inProgressTasks = taskList.filter(t => t.status === "in_progress").length;
    const todoTasks = taskList.filter(t => t.status === "todo").length;
    const overdueTasks = taskList.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done");
    const highPriorityPending = taskList.filter(t => t.priority === 3 && t.status !== "done");

    const sprintContext = `SPRINT CONTEXT (Real-time data):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT:
- Name: "${sprint.name}"
- Idea: "${sprint.idea?.title}" 
- Problem: ${sprint.idea?.problem_statement || sprint.idea?.pitch || "Not specified"}
- Target Users: ${sprint.idea?.target_users || "Not specified"}
- Industry: ${JSON.stringify(sprint.idea?.industry || [])}
- Goal: ${sprint.goal || "Not defined"}

STATUS:
- Sprint Status: ${sprint.status} | Progress: ${sprint.progress || 0}%
- Timeline: Day ${daysElapsed} of ${sprint.duration_days} (${daysRemaining} days remaining)
- Started: ${sprint.start_date || "Not started"}

TASKS (${taskList.length} total):
- Completed: ${completedTasks} | In Progress: ${inProgressTasks} | To Do: ${todoTasks}
- Overdue: ${overdueTasks.length} ${overdueTasks.length > 0 ? `(${overdueTasks.map(t => `"${t.title}"`).join(", ")})` : ""}
- High Priority Pending: ${highPriorityPending.length} ${highPriorityPending.length > 0 ? `(${highPriorityPending.map(t => `"${t.title}"`).join(", ")})` : ""}
- All pending tasks: ${taskList.filter(t => t.status !== "done").map(t => `"${t.title}" [P${t.priority}/${t.status}]`).join(", ") || "None"}

TEAM (${memberList.length} members):
${memberList.map(m => `- ${profilesMap[m.user_id] || "Anonymous"}: ${m.role}${m.is_founder ? " [Founder]" : ""} | ${m.hours_logged || 0}/${m.hours_committed || 0}h logged`).join("\n")}
- Required roles: ${JSON.stringify(sprint.idea?.required_roles || [])}

DEVELOPMENT:
- Total commits: ${commitList.length}
- Recent: ${commitList.slice(0, 5).map(c => `"${c.commit_message}" (${c.lines_of_code} lines, ${c.language})`).join("; ") || "None"}

RECENT ACTIVITY:
${timelineList.slice(0, 10).map(e => `- ${e.event_type}: ${JSON.stringify(e.event_data)} (${new Date(e.created_at).toLocaleDateString()})`).join("\n") || "No recent activity"}`;

    const systemPrompt = `You are an expert AI Startup Mentor embedded in a sprint management platform. You provide detailed, actionable, data-driven advice based on real sprint data.

${sprintContext}

YOUR ROLE:
- Analyze sprint data to give specific, contextual advice
- Reference actual task names, team members, and metrics
- Provide step-by-step actionable guidance
- Detect risks proactively and suggest mitigations
- Help with startup strategy, product decisions, and team management

RESPONSE GUIDELINES:
- Always ground responses in the actual sprint data above
- Use markdown formatting (bold, lists, headers) for clarity
- Be concise but thorough (aim for 150-300 words)
- When suggesting actions, be specific: which task, which person, what deadline
- If data is missing (e.g., no tasks), guide the user to set things up
- Reference specific numbers: completion rates, days remaining, team size
- For risk questions, calculate velocity and project completion likelihood`;

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...clientMessages.map((m: any) => ({
        role: m.role === "ai" || m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    // Stream response
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
