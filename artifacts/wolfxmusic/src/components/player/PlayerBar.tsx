import { usePlayer } from "@/contexts/PlayerContext";
import { formatTime } from "@/lib/format";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Link } from "wouter";

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isFetching,
    pause,
    resume,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
  } = usePlayer();

  if (!currentTrack) return null;

  const progress = (currentTime / (duration || 30)) * 100;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(0,0,0,0.97)",
        borderTop: "1px solid rgba(0,255,0,0.2)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 -8px 40px rgba(0,255,0,0.08)",
      }}
    >
      {/* Progress bar */}
      <div
        className="h-0.5 cursor-pointer relative group"
        style={{ background: "rgba(0,255,0,0.1)" }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * (duration || 30));
        }}
      >
        <div
          className="h-full transition-all relative"
          style={{
            width: `${progress}%`,
            background: "#00ff00",
            boxShadow: "0 0 8px rgba(0,255,0,0.6)",
          }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 md:px-5 h-16 md:h-[72px]">
        {/* Track info */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          <div className="relative w-10 h-10 md:w-12 md:h-12 rounded shrink-0 overflow-hidden" style={{ border: "1px solid rgba(0,255,0,0.2)" }}>
            <img
              src={currentTrack.thumbnail || "https://placehold.co/100x100"}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            {isFetching && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin" style={{ color: "#00ff00" }} />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 hidden sm:flex">
            <span className="text-xs font-mono font-semibold truncate" style={{ color: "#00ff00" }}>
              {currentTrack.title}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground truncate">
              {currentTrack.artist}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={prevTrack}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-prev"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>

            <button
              onClick={() => isPlaying ? pause() : resume()}
              disabled={isFetching}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
              style={{
                background: "#00ff00",
                boxShadow: "0 0 20px rgba(0,255,0,0.4)",
                color: "#000",
              }}
              data-testid="button-play-pause"
            >
              {isFetching ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-next"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>

          {/* Time */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span className="opacity-30">—</span>
            <span>{formatTime(duration || 30)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end gap-2 w-[30%] min-w-0">
          <button
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            data-testid="button-volume"
          >
            {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <div className="w-16 md:w-24 hidden sm:block">
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={([v]) => setVolume(v)}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
