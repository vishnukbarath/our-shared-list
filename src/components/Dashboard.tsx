import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, Task } from "@/hooks/useTasks";
import { Couple } from "@/hooks/useCouple";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, Trash2, LogOut, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-peach text-peach-foreground border-peach-foreground/20",
  low: "bg-mint text-mint-foreground border-mint-foreground/20",
};

const ASSIGNED_LABELS: Record<string, string> = {
  him: "👨 Him",
  her: "👩 Her",
  unassigned: "💕 Both",
};

export default function Dashboard({ couple }: { couple: Couple }) {
  const { user, signOut } = useAuth();
  const { tasks, loading, error, addTask, toggleTask, deleteTask } = useTasks(couple.id);
  const { toast } = useToast();

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [newAssigned, setNewAssigned] = useState<Task["assigned_to"]>("unassigned");
  const [filter, setFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast({ title: "Please enter a task title", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    await addTask(newTitle.trim(), newPriority, newAssigned);
    setNewTitle("");
    setIsSubmitting(false);
    toast({ title: "Task added! 🎉" });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(couple.invite_code);
    setCopied(true);
    toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = tasks.filter(t => {
    if (filter === "completed") return t.completed;
    if (filter === "active") return !t.completed;
    if (filter === "him" || filter === "her") return t.assigned_to === filter;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-lavender/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">Our To-Do List</h1>
          </div>
          <div className="flex items-center gap-2">
            {!couple.user2_id && (
              <Button variant="outline" size="sm" onClick={copyCode} className="text-xs gap-1">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {couple.invite_code}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-sm text-muted-foreground">
          <span>{tasks.length} tasks</span>
          <span>•</span>
          <span>{completedCount} done</span>
          {couple.user2_id ? (
            <Badge variant="secondary" className="ml-auto text-xs">💕 Paired</Badge>
          ) : (
            <Badge variant="outline" className="ml-auto text-xs">Waiting for partner...</Badge>
          )}
        </div>

        {/* Add Task */}
        <Card className="border-border/50 shadow-md shadow-primary/5">
          <CardContent className="p-4">
            {error && (
              <div className="mb-3 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="What needs to be done? 💭"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                disabled={isSubmitting}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Select value={newPriority} onValueChange={v => setNewPriority(v as Task["priority"])}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newAssigned} onValueChange={v => setNewAssigned(v as Task["assigned_to"])}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">💕 Both</SelectItem>
                    <SelectItem value="him">👨 Him</SelectItem>
                    <SelectItem value="her">👩 Her</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="icon" disabled={isSubmitting}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "completed", "him", "her"].map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize text-xs"
            >
              {f === "him" ? "👨 Him" : f === "her" ? "👩 Her" : f}
            </Button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading tasks...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Heart className="w-12 h-12 text-primary/30 mx-auto" />
              <p className="text-muted-foreground">No tasks yet — add one together! 💕</p>
            </div>
          ) : (
            filtered.map(task => (
              <Card
                key={task.id}
                className={cn(
                  "border-border/50 shadow-sm transition-all hover:shadow-md",
                  task.completed && "opacity-60"
                )}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task.id, !task.completed)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      task.completed
                        ? "bg-primary border-primary text-primary-foreground animate-check-pop"
                        : "border-muted-foreground/30 hover:border-primary"
                    )}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium truncate", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[task.priority])}>
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{ASSIGNED_LABELS[task.assigned_to]}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
