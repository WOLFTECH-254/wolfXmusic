import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { X, Download } from "lucide-react";

const DISMISSED_KEY = "wolfxmusic_install_dismissed";

export function InstallBanner() {
  const { isInstallable, install } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isInstallable) return;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const show = setTimeout(() => setVisible(true), 1500);
    const hide = setTimeout(() => handleDismiss(), 12000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [isInstallable]);

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  }

  async function handleInstall() {
    await install();
    handleDismiss();
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500"
      role="banner"
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border"
        style={{
          background: "#0d0d0d",
          borderColor: "rgba(0,255,0,0.25)",
          boxShadow: "0 0 30px rgba(0,255,0,0.12), 0 8px 32px rgba(0,0,0,0.6)",
          maxWidth: 320,
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
          style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)" }}
        >
          <span className="font-black text-sm" style={{ color: "#00ff00" }}>wXm</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Install wolfXmusic</p>
          <p className="text-xs text-muted-foreground mt-0.5">Stream music like a native app</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black transition-all hover:scale-105"
            style={{ background: "#00ff00", boxShadow: "0 0 12px rgba(0,255,0,0.4)" }}
          >
            <Download size={12} />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
