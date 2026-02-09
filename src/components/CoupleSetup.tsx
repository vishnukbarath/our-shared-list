import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Couple } from "@/hooks/useCouple";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, UserPlus, LogOut, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CoupleSetupProps {
  createCouple: () => Promise<{ data: Couple | null; error: string | null }>;
  joinCouple: (code: string) => Promise<{ data: Couple | null; error: string | null }>;
}

export default function CoupleSetup({ createCouple, joinCouple }: CoupleSetupProps) {
  const { signOut } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    const { data, error: createError } = await createCouple();
    if (createError) {
      setError(createError);
      toast({ title: "Error", description: createError, variant: "destructive" });
    } else if (data) {
      toast({ title: "Couple created! 💕", description: `Share code: ${data.invite_code}` });
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: joinError } = await joinCouple(inviteCode.trim());
    if (joinError) {
      setError(joinError);
      toast({ title: "Error", description: joinError, variant: "destructive" });
    } else {
      toast({ title: "Paired! 💕", description: "You're now connected with your partner." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-lavender/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-love/5 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Heart className="w-8 h-8 text-primary animate-heart-beat" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Get Started Together</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">Create a new shared to-do list with your partner or join an existing one</p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Create
              </CardTitle>
              <CardDescription>Start a new shared list</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Couple List"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Join
              </CardTitle>
              <CardDescription>Enter your partner's code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Invite code"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
              />
              <Button onClick={handleJoin} disabled={loading || !inviteCode.trim()} className="w-full" variant="secondary">
                {loading ? "Joining..." : "Join Partner"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
