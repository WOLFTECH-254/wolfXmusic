import { Link, useLocation } from "wouter";
import { Home, Search, Library, Disc3, Radio, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Discover", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/library", label: "Library", icon: Library },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0" style={{ borderColor: "rgba(0,255,0,0.15)" }}>
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: "rgba(0,255,0,0.1)" }}>
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(0,255,0,0.06)", border: "1px solid rgba(0,255,0,0.25)", boxShadow: "0 0 16px rgba(0,255,0,0.15)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <div className="font-orbitron font-black text-sm tracking-widest" style={{ letterSpacing: "0.12em" }}>
              <span style={{ color: "#00ff00" }}>WOLF</span><span className="text-foreground">X</span><span className="text-foreground/60">music</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono" style={{ color: "rgba(0,255,0,0.5)" }}>// stream anything</div>
          </div>
        </Link>
      </div>

      {/* Nav label */}
      <div className="px-6 pt-5 pb-2">
        <span className="text-[10px] font-mono tracking-widest" style={{ color: "rgba(0,255,0,0.4)" }}>// NAVIGATION</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-mono font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "text-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={isActive ? {
                background: "#00ff00",
                boxShadow: "0 0 20px rgba(0,255,0,0.35)",
              } : {}}
              data-testid={`nav-${link.label.toLowerCase()}`}
            >
              {!isActive && (
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md" style={{ background: "rgba(0,255,0,0.06)" }} />
              )}
              <link.icon size={18} className={cn("shrink-0 relative z-10", isActive ? "text-black" : "text-current")} />
              <span className="relative z-10">{link.label}</span>
              {isActive && (
                <span className="ml-auto relative z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom panel */}
      <div className="p-4 m-3 rounded-lg" style={{ background: "rgba(0,255,0,0.04)", border: "1px solid rgba(0,255,0,0.12)" }}>
        <div className="text-[10px] font-mono mb-2" style={{ color: "rgba(0,255,0,0.45)" }}>// SYSTEM STATUS</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ background: "#00ff00", boxShadow: "0 0 8px rgba(0,255,0,0.8)" }} />
          <span className="text-xs font-mono" style={{ color: "#00ff00" }}>ONLINE</span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">API v1</span>
        </div>
      </div>
    </div>
  );
}
