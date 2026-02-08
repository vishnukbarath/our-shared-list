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
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!coupleId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: false });
      
      if (fetchError) {
        console.error("Task fetch error:", fetchError);
        setError(fetchError.message);
        setTasks([]);
      } else {
        setTasks((data as Task[]) || []);
      }
    } catch (err) {
      console.error("Task fetch exception:", err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [coupleId, fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    if (!coupleId) return;
    
    const channel = supabase
      .channel(`tasks-${coupleId}`, { config: { broadcast: { self: true } } })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime subscribed to tasks:", coupleId);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, fetchTasks]);

  const addTask = async (title: string, priority: Task["priority"], assignedTo: Task["assigned_to"]) => {
    if (!coupleId || !user) {
      setError("Not authenticated or no couple selected");
      return;
    }
    
    try {
      setError(null);
      const { error: insertError } = await supabase.from("tasks").insert({
        couple_id: coupleId,
        title,
        priority,
        assigned_to: assignedTo,
        created_by: user.id,
      });

      if (insertError) {
        console.error("Task insert error:", insertError);
        setError(insertError.message);
      } else {
        // Fetch immediately to show the new task
        await fetchTasks();
      }
    } catch (err) {
      console.error("Task add exception:", err);
      setError("Failed to add task");
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ completed })
        .eq("id", taskId);

      if (updateError) {
        console.error("Task toggle error:", updateError);
        setError(updateError.message);
      } else {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Task toggle exception:", err);
      setError("Failed to toggle task");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (deleteError) {
        console.error("Task delete error:", deleteError);
        setError(deleteError.message);
      } else {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Task delete exception:", err);
      setError("Failed to delete task");
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Pick<Task, "title" | "priority" | "assigned_to">>) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (updateError) {
        console.error("Task update error:", updateError);
        setError(updateError.message);
      } else {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Task update exception:", err);
      setError("Failed to update task");
    }
  };

  return { tasks, loading, error, addTask, toggleTask, deleteTask, updateTask };
}
