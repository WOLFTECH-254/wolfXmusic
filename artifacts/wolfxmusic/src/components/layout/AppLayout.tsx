import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { PlayerBar } from "../player/PlayerBar";
import { Menu } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentTrack } = usePlayer();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar onNavigate={() => {}} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`
        fixed top-0 left-0 h-full z-50 md:hidden transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <main className={`flex-1 overflow-y-auto relative min-w-0 transition-all duration-300 ${currentTrack ? "pb-28" : "pb-0"}`}>
        {/* Top mobile nav bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border md:hidden">
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="p-2 rounded-md border border-border text-primary hover:bg-primary/10 transition-colors"
            data-testid="button-hamburger"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-orbitron font-black tracking-widest text-sm">
            <span className="text-primary">wolf</span><span className="text-foreground">X</span><span className="text-foreground/70">music</span>
          </span>
        </div>

        <div className="relative z-10 p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}
