import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Task {
  id: string;
  couple_id: string;
  title: string;
  priority: "high" | "medium" | "low";
  assigned_to: "him" | "her" | "unassigned";
  completed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useTasks(coupleId: string | undefined) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!coupleId) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });
    setTasks((data as Task[]) || []);
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`tasks-${coupleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `couple_id=eq.${coupleId}` }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [coupleId, fetchTasks]);

  const addTask = async (title: string, priority: Task["priority"], assignedTo: Task["assigned_to"]) => {
    if (!coupleId || !user) return;
    await supabase.from("tasks").insert({
      couple_id: coupleId,
      title,
      priority,
      assigned_to: assignedTo,
      created_by: user.id,
    });
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase.from("tasks").update({ completed }).eq("id", taskId);
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  const updateTask = async (taskId: string, updates: Partial<Pick<Task, "title" | "priority" | "assigned_to">>) => {
    await supabase.from("tasks").update(updates).eq("id", taskId);
  };

  return { tasks, loading, addTask, toggleTask, deleteTask, updateTask };
}
