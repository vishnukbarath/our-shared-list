import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Couple {
  id: string;
  invite_code: string;
  user1_id: string;
  user2_id: string | null;
  created_at: string;
}

export function useCouple() {
  const { user } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCouple = useCallback(async (isInitial = true) => {
    if (!user) { 
      if (isInitial) setLoading(false);
      return; 
    }
    
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("couples")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: true })
        .limit(1);
      
      if (fetchError) {
        console.error("Couple fetch error:", fetchError);
        setError(fetchError.message);
      }
      
      setCouple(data && data.length > 0 ? (data[0] as Couple) : null);
    } catch (err) {
      console.error("Couple fetch exception:", err);
      setError("Failed to load couple data");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCouple(true);
  }, [user, fetchCouple]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`couple-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couples",
        },
        () => {
          fetchCouple(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCouple]);

  const createCouple = async (): Promise<{ data: Couple | null; error: string | null }> => {
    if (!user) return { data: null, error: "Not authenticated" };
    
    // Check if user already has a couple
    const { data: existing } = await supabase
      .from("couples")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .limit(1);

    if (existing && existing.length > 0) {
      const c = existing[0] as Couple;
      setCouple(c);
      return { data: c, error: null };
    }

    try {
      setError(null);
      const { data, error: createError } = await supabase
        .from("couples")
        .insert({ user1_id: user.id })
        .select()
        .single();
      
      if (createError) {
        console.error("Couple create error:", createError);
        setError(createError.message);
        return { data: null, error: createError.message };
      }
      
      setCouple(data as Couple);
      return { data: data as Couple, error: null };
    } catch (err) {
      console.error("Couple create exception:", err);
      const errMsg = "Failed to create couple";
      setError(errMsg);
      return { data: null, error: errMsg };
    }
  };

  const joinCouple = async (inviteCode: string): Promise<{ data: Couple | null; error: string | null }> => {
    if (!user) return { data: null, error: "Not authenticated" };
    
    try {
      setError(null);
      const { data: existing, error: findError } = await supabase
        .from("couples")
        .select("*")
        .eq("invite_code", inviteCode)
        .maybeSingle();
      
      if (findError) return { data: null, error: findError.message };
      if (!existing) return { data: null, error: "Invalid invite code" };
      if (existing.user2_id) return { data: null, error: "This couple is already paired" };
      if (existing.user1_id === user.id) return { data: null, error: "You can't join your own couple" };

      const { data, error: updateError } = await supabase
        .from("couples")
        .update({ user2_id: user.id })
        .eq("id", existing.id)
        .select()
        .single();
      
      if (updateError) return { data: null, error: updateError.message };
      
      setCouple(data as Couple);
      return { data: data as Couple, error: null };
    } catch (err) {
      console.error("Couple join exception:", err);
      return { data: null, error: "Failed to join couple" };
    }
  };

  return { couple, loading, error, createCouple, joinCouple };
}
