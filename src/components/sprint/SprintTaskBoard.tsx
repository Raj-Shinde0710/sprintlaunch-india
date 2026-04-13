import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateSprintProgress, logSprintEvent } from "@/lib/sprint-logic";
import { SmartAssignment } from "@/components/sprint/SmartAssignment";
import {
  Plus,
  Clock,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Calendar,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: number;
  assignee_id: string | null;
  hours_estimated: number | null;
  hours_logged: number;
  due_date: string | null;
  created_by: string | null;
  assignee?: {
    full_name: string | null;
  };
}

interface Member {
  user_id: string;
  full_name: string | null;
  role: string;
}

interface SprintTaskBoardProps {
  sprintId: string;
  isFounder: boolean;
  isMember: boolean;
  sprintStatus: string;
  onProgressUpdate: () => void;
}

const columns = [
  { id: "todo", title: "To Do", icon: Circle, color: "text-muted-foreground" },
  { id: "in_progress", title: "In Progress", icon: Loader2, color: "text-yellow-600" },
  { id: "done", title: "Done", icon: CheckCircle2, color: "text-green-600" },
];

const priorityLabels: Record<number, { label: string; className: string }> = {
  3: { label: "High", className: "bg-red-500/10 text-red-600 border-red-500/30" },
  2: { label: "Medium", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  1: { label: "Low", className: "bg-green-500/10 text-green-600 border-green-500/30" },
};

export function SprintTaskBoard({
  sprintId,
  isFounder,
  isMember,
  sprintStatus,
  onProgressUpdate,
}: SprintTaskBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    hours_estimated: "",
    priority: "2",
    assignee_id: "",
    due_date: "",
  });

  const canEdit = (isFounder || isMember) && ["active", "draft"].includes(sprintStatus);
  const canManageTasks = isFounder;

  useEffect(() => {
    fetchTasks();
    fetchMembers();

    // Realtime subscription for task updates
    const channel = supabase
      .channel(`tasks-${sprintId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `sprint_id=eq.${sprintId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sprintId]);

  const fetchTasks = async () => {
    // Fetch tasks separately, then enrich with profiles
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .eq("sprint_id", sprintId)
      .order("priority", { ascending: false });

    if (tasksData) {
      // Get unique assignee IDs
      const assigneeIds = [...new Set(tasksData.filter(t => t.assignee_id).map(t => t.assignee_id!))];
      
      let profilesMap: Record<string, { full_name: string | null }> = {};
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", assigneeIds);
        
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.id, { full_name: p.full_name }]));
        }
      }

      const enrichedTasks = tasksData.map(t => ({
        ...t,
        status: t.status as "todo" | "in_progress" | "done",
        hours_logged: t.hours_logged || 0,
        priority: t.priority || 2,
        assignee: t.assignee_id ? profilesMap[t.assignee_id] || { full_name: null } : undefined,
      }));

      setTasks(enrichedTasks);
    }
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data: membersData } = await supabase
      .from("sprint_members")
      .select("user_id")
      .eq("sprint_id", sprintId)
      .is("left_at", null);

    if (membersData) {
      const userIds = membersData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profiles) {
        // Get roles from members
        const { data: rolesData } = await supabase
          .from("sprint_members")
          .select("user_id, role")
          .eq("sprint_id", sprintId)
          .is("left_at", null);

        const roleMap = Object.fromEntries((rolesData || []).map(r => [r.user_id, r.role]));

        setMembers(profiles.map(p => ({
          user_id: p.id,
          full_name: p.full_name,
          role: roleMap[p.id] || "Member",
        })));
      }
    }
  };

  const isOverdue = (task: Task) => {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    const insertData: any = {
      sprint_id: sprintId,
      title: newTask.title,
      description: newTask.description || null,
      hours_estimated: newTask.hours_estimated ? parseInt(newTask.hours_estimated) : null,
      priority: parseInt(newTask.priority),
      assignee_id: newTask.assignee_id || null,
      due_date: newTask.due_date || null,
      created_by: user?.id || null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({ title: "Error adding task", variant: "destructive" });
      return;
    }

    await supabase
      .from("sprints")
      .update({ tasks_assigned: true, last_activity_at: new Date().toISOString() })
      .eq("id", sprintId);

    await logSprintEvent(sprintId, "task_created", { task_title: newTask.title }, user?.id);
    toast({ title: "Task added" });
    setNewTask({ title: "", description: "", hours_estimated: "", priority: "2", assignee_id: "", due_date: "" });
    setShowAddTask(false);
    fetchTasks();
  };

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        ...(newStatus === "done" ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error updating task", variant: "destructive" });
      return;
    }

    setTasks(tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    await calculateSprintProgress(sprintId);
    await supabase
      .from("sprints")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", sprintId);

    await logSprintEvent(
      sprintId,
      newStatus === "done" ? "task_completed" : "task_status_changed",
      { task_title: task.title, old_status: task.status, new_status: newStatus },
      user?.id
    );

    onProgressUpdate();
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      toast({ title: "Error deleting task", variant: "destructive" });
      return;
    }

    setTasks(tasks.filter((t) => t.id !== taskId));
    await calculateSprintProgress(sprintId);
    if (task) {
      await logSprintEvent(sprintId, "task_deleted", { task_title: task.title }, user?.id);
    }
    onProgressUpdate();
    toast({ title: "Task deleted" });
  };

  const handleAssign = async (taskId: string, assigneeId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ assignee_id: assigneeId || null })
      .eq("id", taskId);

    if (!error) {
      const task = tasks.find(t => t.id === taskId);
      await logSprintEvent(sprintId, "task_assigned", { task_title: task?.title }, user?.id);
      fetchTasks();
    }
  };

  const handleLogHours = async (taskId: string, hours: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newHours = (task.hours_logged || 0) + hours;
    const { error } = await supabase
      .from("tasks")
      .update({ hours_logged: newHours })
      .eq("id", taskId);

    if (error) return;

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, hours_logged: newHours } : t)));

    if (user) {
      const { data: member } = await supabase
        .from("sprint_members")
        .select("hours_logged")
        .eq("sprint_id", sprintId)
        .eq("user_id", user.id)
        .single();

      if (member) {
        await supabase
          .from("sprint_members")
          .update({ hours_logged: (member.hours_logged || 0) + hours })
          .eq("sprint_id", sprintId)
          .eq("user_id", user.id);
      }
    }

    await logSprintEvent(sprintId, "hours_logged", { task_title: task.title, hours }, user?.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const overdueTasks = tasks.filter(isOverdue);

  return (
    <div className="space-y-6">
      {/* Overdue Warning */}
      {overdueTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border-2 border-red-500/30 bg-red-500/5"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-600">
                {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {overdueTasks.map(t => t.title).join(", ")}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Task Button */}
      {canManageTasks && (
        <div className="flex justify-end">
          <Button variant="founder" onClick={() => setShowAddTask(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      )}

      {/* Add Task Form */}
      {showAddTask && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={2}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="3">High</option>
                      <option value="2">Medium</option>
                      <option value="1">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Assign to</label>
                    <select
                      value={newTask.assignee_id}
                      onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.full_name || "Anonymous"} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Est. Hours</label>
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={newTask.hours_estimated}
                      onChange={(e) => setNewTask({ ...newTask, hours_estimated: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="founder" onClick={handleAddTask}>
                    <Save className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTask(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <SmartAssignment
                    sprintId={sprintId}
                    taskTitle={newTask.title}
                    taskDescription={newTask.description}
                    onAssign={(userId) => setNewTask({ ...newTask, assignee_id: userId })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          const Icon = column.icon;

          return (
            <Card key={column.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className={`w-5 h-5 ${column.color}`} />
                  {column.title}
                  <Badge variant="secondary" className="ml-auto">
                    {columnTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[200px]">
                {columnTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                ) : (
                  columnTasks.map((task) => {
                    const overdue = isOverdue(task);
                    const prio = priorityLabels[task.priority] || priorityLabels[2];

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-3 rounded-lg border transition-shadow hover:shadow-md ${
                          overdue ? "border-red-500/50 bg-red-500/5" : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            {overdue && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                <span className="text-xs text-red-600 font-medium">Overdue</span>
                              </div>
                            )}
                          </div>
                          {canManageTasks && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <Badge className={`text-xs border ${prio.className}`}>{prio.label}</Badge>
                          {task.hours_estimated && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.hours_logged}/{task.hours_estimated}h
                            </Badge>
                          )}
                          {task.due_date && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </Badge>
                          )}
                        </div>

                        {/* Assignee */}
                        {canManageTasks ? (
                          <select
                            value={task.assignee_id || ""}
                            onChange={(e) => handleAssign(task.id, e.target.value)}
                            className="w-full text-xs rounded border border-border bg-background px-2 py-1 mb-2"
                          >
                            <option value="">Unassigned</option>
                            {members.map((m) => (
                              <option key={m.user_id} value={m.user_id}>
                                {m.full_name || "Anonymous"}
                              </option>
                            ))}
                          </select>
                        ) : task.assignee?.full_name ? (
                          <Badge variant="secondary" className="text-xs mb-2">
                            <User className="w-3 h-3 mr-1" />
                            {task.assignee.full_name}
                          </Badge>
                        ) : null}

                        {/* Status Change - Always visible */}
                        <div className="flex gap-1 mt-1">
                          {task.status === "todo" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-xs h-8 w-full"
                              onClick={() => handleStatusChange(task.id, "in_progress")}
                            >
                              ▶ Start Task
                            </Button>
                          )}
                          {task.status === "in_progress" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8"
                                onClick={() => handleStatusChange(task.id, "todo")}
                              >
                                ← Back
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="text-xs h-8 flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleStatusChange(task.id, "done")}
                              >
                                ✓ Mark as Done
                              </Button>
                            </>
                          )}
                          {task.status === "done" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleStatusChange(task.id, "in_progress")}
                            >
                              ← Reopen
                            </Button>
                          )}
                        </div>

                        {/* Log Hours */}
                        {canEdit && column.id === "in_progress" && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                            <span className="text-xs text-muted-foreground">Log:</span>
                            {[1, 2, 4].map((h) => (
                              <Button
                                key={h}
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => handleLogHours(task.id, h)}
                              >
                                +{h}h
                              </Button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
