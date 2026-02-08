import { useState, useEffect } from "react";
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

  const fetchCouple = async (isInitial = false) => {
    if (!user) { 
      if (isInitial) setLoading(false);
      return; 
    }
    const { data } = await supabase
      .from("couples")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle();
    setCouple(data);
    if (isInitial) setLoading(false);
  };

  useEffect(() => {
    fetchCouple(true);  // Only set loading during initial fetch
  }, [user]);

  const createCouple = async () => {
    if (!user) return { error: "Not authenticated" };
    const { data, error } = await supabase
      .from("couples")
      .insert({ user1_id: user.id })
      .select()
      .single();
    if (data) {
      setCouple(data);
    }
    return { data, error };
  };

  const joinCouple = async (inviteCode: string) => {
    if (!user) return { error: "Not authenticated" };
    const { data: existing } = await supabase
      .from("couples")
      .select("*")
      .eq("invite_code", inviteCode)
      .maybeSingle();
    
    if (!existing) return { error: "Invalid invite code" };
    if (existing.user2_id) return { error: "This couple is already paired" };
    if (existing.user1_id === user.id) return { error: "You can't join your own couple" };

    const { data, error } = await supabase
      .from("couples")
      .update({ user2_id: user.id })
      .eq("id", existing.id)
      .select()
      .single();
    
    if (data) {
      setCouple(data);
    }
    return { data, error };
  };

  return { couple, loading, createCouple, joinCouple, refetch: () => fetchCouple(false) };
}
