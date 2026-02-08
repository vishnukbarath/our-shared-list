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
        .maybeSingle();
      
      if (fetchError) {
        console.error("Couple fetch error:", fetchError);
        setError(fetchError.message);
      }
      
      setCouple(data || null);
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

  // Real-time subscription for couple changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`couple-${user.id}`, { config: { broadcast: { self: true } } })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couples",
          filter: `user1_id=eq.${user.id},user2_id=eq.${user.id}`,
        },
        () => {
          fetchCouple(false);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime subscribed to couple updates");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCouple]);

  const createCouple = async () => {
    if (!user) return { error: "Not authenticated" };
    
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

  const joinCouple = async (inviteCode: string) => {
    if (!user) return { error: "Not authenticated" };
    
    try {
      setError(null);
      const { data: existing, error: findError } = await supabase
        .from("couples")
        .select("*")
        .eq("invite_code", inviteCode)
        .maybeSingle();
      
      if (findError) {
        console.error("Couple find error:", findError);
        setError(findError.message);
        return { error: findError.message };
      }
      
      if (!existing) {
        const msg = "Invalid invite code";
        setError(msg);
        return { error: msg };
      }
      
      if (existing.user2_id) {
        const msg = "This couple is already paired";
        setError(msg);
        return { error: msg };
      }
      
      if (existing.user1_id === user.id) {
        const msg = "You can't join your own couple";
        setError(msg);
        return { error: msg };
      }

      const { data, error: updateError } = await supabase
        .from("couples")
        .update({ user2_id: user.id })
        .eq("id", existing.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("Couple join error:", updateError);
        setError(updateError.message);
        return { error: updateError.message };
      }
      
      setCouple(data as Couple);
      return { data: data as Couple, error: null };
    } catch (err) {
      console.error("Couple join exception:", err);
      const errMsg = "Failed to join couple";
      setError(errMsg);
      return { error: errMsg };
    }
  };

  return { couple, loading, error, createCouple, joinCouple };
}
