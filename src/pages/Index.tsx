import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import CoupleSetup from "@/components/CoupleSetup";
import Dashboard from "@/components/Dashboard";
import { Heart } from "lucide-react";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading, createCouple, joinCouple } = useCouple();

  if (authLoading || coupleLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Heart className="w-8 h-8 text-primary animate-heart-beat" />
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!couple) return <CoupleSetup createCouple={createCouple} joinCouple={joinCouple} />;

  return <Dashboard couple={couple} />;
}
