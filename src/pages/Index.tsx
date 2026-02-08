import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import CoupleSetup from "@/components/CoupleSetup";
import Dashboard from "@/components/Dashboard";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();

  if (authLoading || coupleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!couple) return <CoupleSetup />;

  return <Dashboard couple={couple} />;
}
