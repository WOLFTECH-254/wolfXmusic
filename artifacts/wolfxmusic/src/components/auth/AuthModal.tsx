import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ open, onOpenChange, defaultTab = "register" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  function reset() {
    setEmail(""); setDisplayName(""); setPassword(""); setLoading(false);
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "register") {
        await register(email, displayName, password);
        toast({ title: `Welcome, ${displayName}!` });
      } else {
        await login(email, password);
        toast({ title: "Signed in" });
      }
      handleClose(false);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <span style={{ color: "#00ff00" }}>wolf</span><span>X</span><span className="text-muted-foreground">music</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["register", "login"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
              style={tab === t ? { background: "#00ff00", color: "#000" } : { color: "var(--muted-foreground)" }}
            >
              {t === "register" ? "Create Account" : "Sign In"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-background border-border h-11"
            autoFocus
          />
          {tab === "register" && (
            <Input
              placeholder="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              minLength={2}
              className="bg-background border-border h-11"
            />
          )}
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-background border-border h-11"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-semibold rounded-lg"
            style={{ background: "#00ff00", color: "#000" }}
          >
            {loading ? "…" : tab === "register" ? "Create Account" : "Sign In"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {tab === "register" ? "Already have an account? " : "No account? "}
            <button type="button" className="underline text-foreground" onClick={() => setTab(tab === "register" ? "login" : "register")}>
              {tab === "register" ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
