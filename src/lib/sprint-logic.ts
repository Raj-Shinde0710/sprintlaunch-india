import { supabase } from "@/integrations/supabase/client";

export interface SprintHealth {
  status: "healthy" | "warning" | "critical" | "failed";
  message: string;
  daysRemaining: number;
  daysInactive: number;
  progress: number;
}

export interface EquityDistribution {
  userId: string;
  userName: string;
  role: string;
  hoursLogged: number;
  equityShare: number;
  isFounder: boolean;
}

export interface SprintChecklist {
  teamFormed: boolean;
  goalsSet: boolean;
  tasksAssigned: boolean;
  midReviewDone: boolean;
  deliverablesSubmitted: boolean;
  sprintCompleted: boolean;
}

// Calculate sprint progress based on tasks
export async function calculateSprintProgress(sprintId: string): Promise<number> {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("status")
    .eq("sprint_id", sprintId);

  if (!tasks || tasks.length === 0) return 0;

  const completed = tasks.filter((t) => t.status === "done").length;
  const progress = Math.round((completed / tasks.length) * 100);

  // Update sprint progress
  await supabase
    .from("sprints")
    .update({ progress, last_activity_at: new Date().toISOString() })
    .eq("id", sprintId);

  return progress;
}

// Get sprint health status
export function getSprintHealth(sprint: {
  status: string;
  progress: number;
  end_date: string | null;
  last_activity_at: string | null;
  inactivity_warning_at: string | null;
}): SprintHealth {
  const now = new Date();
  const endDate = sprint.end_date ? new Date(sprint.end_date) : null;
  const lastActivity = sprint.last_activity_at ? new Date(sprint.last_activity_at) : now;

  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  if (sprint.status === "failed") {
    return {
      status: "failed",
      message: "Sprint has failed due to inactivity or founder dropout",
      daysRemaining,
      daysInactive,
      progress: sprint.progress,
    };
  }

  if (sprint.status === "completed") {
    return {
      status: "healthy",
      message: "Sprint completed successfully!",
      daysRemaining: 0,
      daysInactive,
      progress: 100,
    };
  }

  if (sprint.inactivity_warning_at || daysInactive >= 3) {
    return {
      status: "critical",
      message: `Sprint inactive for ${daysInactive} days. Action required to prevent failure.`,
      daysRemaining,
      daysInactive,
      progress: sprint.progress,
    };
  }

  if (daysRemaining <= 3 && sprint.progress < 70) {
    return {
      status: "warning",
      message: "Low progress with limited time remaining",
      daysRemaining,
      daysInactive,
      progress: sprint.progress,
    };
  }

  if (daysInactive >= 1) {
    return {
      status: "warning",
      message: "Sprint has been inactive. Consider updating tasks.",
      daysRemaining,
      daysInactive,
      progress: sprint.progress,
    };
  }

  return {
    status: "healthy",
    message: "Sprint is on track",
    daysRemaining,
    daysInactive,
    progress: sprint.progress,
  };
}

// Calculate equity distribution
export async function calculateEquityDistribution(
  sprintId: string
): Promise<EquityDistribution[]> {
  const { data: members } = await supabase
    .from("sprint_members")
    .select(`
      user_id,
      role,
      hours_logged,
      hours_committed,
      is_founder,
      commitment_deposit,
      profiles:user_id (
        full_name
      )
    `)
    .eq("sprint_id", sprintId)
    .is("left_at", null);

  if (!members || members.length === 0) return [];

  // Calculate total contribution points
  const totalContribution = members.reduce((acc, m) => {
    const contribution =
      (m.hours_logged || 0) * 1.0 +
      (m.is_founder ? 20 : 0) +
      (Number(m.commitment_deposit) || 0) / 10000;
    return acc + contribution;
  }, 0);

  if (totalContribution === 0) return [];

  return members.map((m) => {
    const contribution =
      (m.hours_logged || 0) * 1.0 +
      (m.is_founder ? 20 : 0) +
      (Number(m.commitment_deposit) || 0) / 10000;

    const equityShare = Math.round((contribution / totalContribution) * 100 * 100) / 100;

    return {
      userId: m.user_id,
      userName: (m.profiles as any)?.full_name || "Anonymous",
      role: m.role,
      hoursLogged: m.hours_logged || 0,
      equityShare,
      isFounder: m.is_founder || false,
    };
  });
}

// Get sprint checklist
export function getSprintChecklist(sprint: {
  team_formed: boolean;
  goals_defined: boolean;
  tasks_assigned: boolean;
  mid_review_done: boolean;
  deliverables_submitted: boolean;
  status: string;
}): SprintChecklist {
  return {
    teamFormed: sprint.team_formed || false,
    goalsSet: sprint.goals_defined || false,
    tasksAssigned: sprint.tasks_assigned || false,
    midReviewDone: sprint.mid_review_done || false,
    deliverablesSubmitted: sprint.deliverables_submitted || false,
    sprintCompleted: sprint.status === "completed",
  };
}

// Check if idea meets readiness requirements
export function checkIdeaReadiness(idea: {
  validation_proof: string | null;
  has_user_interviews: boolean;
  has_problem_validation: boolean;
  competitive_analysis_summary: string | null;
}): { ready: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!idea.has_user_interviews && !idea.has_problem_validation && !idea.validation_proof) {
    missing.push("User validation or interviews");
  }

  // At least one validation method required
  const hasValidation =
    idea.has_user_interviews ||
    idea.has_problem_validation ||
    (idea.validation_proof && idea.validation_proof.length > 0) ||
    (idea.competitive_analysis_summary && idea.competitive_analysis_summary.length > 0);

  if (!hasValidation) {
    missing.push("Problem validation evidence");
  }

  return {
    ready: missing.length === 0,
    missing,
  };
}

// Log sprint timeline event
export async function logSprintEvent(
  sprintId: string,
  eventType: string,
  eventData: Record<string, unknown> = {},
  userId?: string
): Promise<void> {
  await supabase.from("sprint_timeline").insert({
    sprint_id: sprintId,
    user_id: userId || null,
    event_type: eventType,
    event_data: eventData,
  });
}

// Activate sprint
export async function activateSprint(sprintId: string): Promise<{ success: boolean; error?: string }> {
  // Check minimum team requirement
  const { data: members } = await supabase
    .from("sprint_members")
    .select("id")
    .eq("sprint_id", sprintId)
    .is("left_at", null);

  if (!members || members.length < 2) {
    return { success: false, error: "Minimum 2 team members required to start sprint" };
  }

  const { data: sprint } = await supabase
    .from("sprints")
    .select("duration_days")
    .eq("id", sprintId)
    .single();

  if (!sprint) {
    return { success: false, error: "Sprint not found" };
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + sprint.duration_days);

  const { error } = await supabase
    .from("sprints")
    .update({
      status: "active",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      team_formed: true,
      last_activity_at: startDate.toISOString(),
    })
    .eq("id", sprintId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logSprintEvent(sprintId, "sprint_activated", { start_date: startDate, end_date: endDate });

  return { success: true };
}

// Complete sprint
export async function completeSprint(sprintId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("sprints")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      progress: 100,
      deliverables_submitted: true,
    })
    .eq("id", sprintId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Update execution scores for all members
  const { data: members } = await supabase
    .from("sprint_members")
    .select("user_id")
    .eq("sprint_id", sprintId)
    .is("left_at", null);

  if (members) {
    for (const member of members) {
      await supabase.rpc("calculate_execution_score", { user_uuid: member.user_id });
    }
  }

  // Release locked commitments
  await supabase
    .from("commitments")
    .update({ status: "released" })
    .eq("sprint_id", sprintId)
    .eq("status", "locked");

  await logSprintEvent(sprintId, "sprint_completed", {});

  return { success: true };
}

// Fail sprint
export async function failSprint(
  sprintId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("sprints")
    .update({
      status: "failed",
      failed_at: new Date().toISOString(),
    })
    .eq("id", sprintId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Update execution scores (penalty)
  const { data: members } = await supabase
    .from("sprint_members")
    .select("user_id")
    .eq("sprint_id", sprintId)
    .is("left_at", null);

  if (members) {
    for (const member of members) {
      await supabase.rpc("calculate_execution_score", { user_uuid: member.user_id });
    }
  }

  // Refund commitments
  await supabase
    .from("commitments")
    .update({ status: "refunded" })
    .eq("sprint_id", sprintId)
    .in("status", ["pending", "locked"]);

  await logSprintEvent(sprintId, "sprint_failed", { reason });

  return { success: true };
}

// Calculate execution score client-side (for display)
export function calculateExecutionScoreLocal(stats: {
  sprintsCompleted: number;
  sprintsFailed: number;
  tasksDelivered: number;
  tasksPromised: number;
  avgPeerRating: number;
}): number {
  let score = 50;

  // Sprint completion bonus/penalty
  const totalSprints = stats.sprintsCompleted + stats.sprintsFailed;
  if (totalSprints > 0) {
    score += stats.sprintsCompleted * 10 - stats.sprintsFailed * 15;
  }

  // Delivery ratio bonus
  if (stats.tasksPromised > 0) {
    score += Math.round((stats.tasksDelivered / stats.tasksPromised) * 20);
  }

  // Peer rating bonus
  score += Math.round((stats.avgPeerRating - 3) * 5);

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}
