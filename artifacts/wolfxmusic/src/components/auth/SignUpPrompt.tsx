import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { X, Music2 } from "lucide-react";

const PLAY_COUNT_KEY = "wolfxmusic_play_count";
const PROMPT_SNOOZED_KEY = "wolfxmusic_prompt_snoozed";
const PROMPT_SKIPPED_KEY = "wolfxmusic_prompt_skipped";
const PLAYS_BEFORE_PROMPT = 3;

export function useSignUpPromptTrigger() {
  const { user } = useAuth();

  function recordPlay() {
    if (user) return;
    const skipped = localStorage.getItem(PROMPT_SKIPPED_KEY);
    if (skipped && Date.now() - Number(skipped) < 7 * 24 * 60 * 60 * 1000) return;
    const count = Number(localStorage.getItem(PLAY_COUNT_KEY) || "0") + 1;
    localStorage.setItem(PLAY_COUNT_KEY, String(count));
  }

  function shouldShow() {
    if (user) return false;
    const skipped = localStorage.getItem(PROMPT_SKIPPED_KEY);
    if (skipped && Date.now() - Number(skipped) < 7 * 24 * 60 * 60 * 1000) return false;
    const snoozed = localStorage.getItem(PROMPT_SNOOZED_KEY);
    if (snoozed === "session") return false;
    const count = Number(localStorage.getItem(PLAY_COUNT_KEY) || "0");
    return count >= PLAYS_BEFORE_PROMPT;
  }

  return { recordPlay, shouldShow };
}

export function SignUpPrompt() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (user) { setOpen(false); return; }
    const check = () => {
      const skipped = localStorage.getItem(PROMPT_SKIPPED_KEY);
      if (skipped && Date.now() - Number(skipped) < 7 * 24 * 60 * 60 * 1000) return;
      const snoozed = localStorage.getItem(PROMPT_SNOOZED_KEY);
      if (snoozed === "session") return;
      const count = Number(localStorage.getItem(PLAY_COUNT_KEY) || "0");
      if (count >= PLAYS_BEFORE_PROMPT) setOpen(true);
    };

    check();
    window.addEventListener("wolfxmusic:playrecorded", check);
    return () => window.removeEventListener("wolfxmusic:playrecorded", check);
  }, [user]);

  if (!open || authOpen) return null;

  function handleSignUp() {
    setOpen(false);
    setAuthOpen(true);
  }

  function handleRemindLater() {
    localStorage.setItem(PROMPT_SNOOZED_KEY, "session");
    setOpen(false);
  }

  function handleSkip() {
    localStorage.setItem(PROMPT_SKIPPED_KEY, String(Date.now()));
    setOpen(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
        <div
          className="w-full max-w-sm rounded-2xl p-6 animate-in slide-in-from-bottom-8 fade-in duration-400"
          style={{ background: "#0d0d0d", border: "1px solid rgba(0,255,0,0.2)", boxShadow: "0 0 60px rgba(0,255,0,0.1), 0 24px 48px rgba(0,0,0,0.8)" }}
        >
          <button onClick={handleSkip} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" style={{ background: "rgba(255,255,255,0.06)" }}>
            <X size={14} />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)" }}>
              <Music2 size={28} style={{ color: "#00ff00" }} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center mb-1">Enjoying the music?</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Create a free account to save your liked songs, playlists, and listening history.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleSignUp}
              className="w-full h-11 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "#00ff00", color: "#000", boxShadow: "0 0 20px rgba(0,255,0,0.3)" }}
            >
              Create Free Account
            </button>
            <button
              onClick={handleRemindLater}
              className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              Remind Me Later
            </button>
            <button
              onClick={handleSkip}
              className="w-full h-8 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Maybe not
            </button>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab="register" />
    </>
  );
}
