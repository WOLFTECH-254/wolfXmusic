import { useState, useEffect } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { formatTime } from "@/lib/format";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Loader2, Download, Heart, ListPlus, MoreHorizontal, Check, X,
} from "lucide-react";
import {
  useAddFavorite,
  useRemoveFavorite,
  useGetFavorites,
  getGetFavoritesQueryKey,
  useGetPlaylists,
  useAddTrackToPlaylist,
  getGetPlaylistsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function PlayerBar() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    isFetching, streamUrl, pause, resume, nextTrack, prevTrack, seek, setVolume,
  } = usePlayer();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites } = useGetFavorites();
  const { data: playlists } = useGetPlaylists();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addToPlaylist = useAddTrackToPlaylist();

  const [addedToPlaylist, setAddedToPlaylist] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Re-show bar whenever a new track starts
  useEffect(() => { setDismissed(false); }, [currentTrack?.id]);

  if (!currentTrack || dismissed) return null;

  const progress = (currentTime / (duration || 1)) * 100;
  const isFavorited = favorites?.some(f => f.trackId === currentTrack.id);

  function toggleFavorite() {
    if (!currentTrack) return;
    if (isFavorited) {
      removeFavorite.mutate(
        { trackId: currentTrack.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
            toast({ title: "Removed from favorites" });
          },
        }
      );
    } else {
      addFavorite.mutate(
        {
          data: {
            trackId: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album,
            thumbnail: currentTrack.thumbnail,
            duration: currentTrack.duration,
            duration_ms: currentTrack.duration_ms,
            previewUrl: currentTrack.preview_url,
            spotifyUrl: currentTrack.url,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
            toast({ title: "Added to favorites" });
          },
        }
      );
    }
  }

  function handleAddToPlaylist(playlistId: number) {
    if (!currentTrack) return;
    addToPlaylist.mutate(
      {
        id: playlistId,
        data: {
          trackId: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          thumbnail: currentTrack.thumbnail,
          duration: currentTrack.duration,
          duration_ms: currentTrack.duration_ms,
          previewUrl: currentTrack.preview_url,
          spotifyUrl: currentTrack.url,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
          setAddedToPlaylist(playlistId);
          toast({ title: "Added to playlist" });
          setTimeout(() => setAddedToPlaylist(null), 1500);
        },
        onError: () => {
          toast({ title: "Failed to add to playlist", variant: "destructive" });
        },
      }
    );
  }

  function handleDownload() {
    if (!streamUrl || !currentTrack) return;
    const a = document.createElement("a");
    a.href = streamUrl;
    a.download = `${currentTrack.title} - ${currentTrack.artist}.mp3`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const PlaylistSubMenu = () => (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="hover:bg-primary/10 cursor-pointer font-mono text-xs gap-2">
        <ListPlus className="h-3.5 w-3.5" />
        Add to Playlist
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="bg-card border-border">
          {!playlists?.length ? (
            <div className="px-3 py-2 text-xs text-muted-foreground font-mono">No playlists yet</div>
          ) : (
            playlists.map(p => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => handleAddToPlaylist(p.id)}
                className="hover:bg-primary/10 cursor-pointer font-mono text-xs gap-2"
              >
                {addedToPlaylist === p.id
                  ? <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "#00ff00" }} />
                  : <div className="w-3.5 h-3.5 shrink-0" />
                }
                {p.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{
        background: "rgba(0,0,0,0.97)",
        borderTop: "1px solid rgba(0,255,0,0.2)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 -8px 40px rgba(0,255,0,0.08)",
      }}
    >
      {/* Progress bar — full width, click to seek */}
      <div
        className="h-0.5 cursor-pointer relative group"
        style={{ background: "rgba(0,255,0,0.1)" }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * (duration || 1));
        }}
      >
        <div
          className="h-full transition-all relative"
          style={{ width: `${progress}%`, background: "#00ff00", boxShadow: "0 0 8px rgba(0,255,0,0.6)" }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
        </div>
      </div>

      {/* ─── DESKTOP layout (sm+) ─── */}
      <div className="hidden sm:flex items-center gap-2 px-4 md:px-5 h-16 md:h-[72px]">

        {/* Left: thumbnail + track info + like + playlist */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded shrink-0 overflow-hidden" style={{ border: "1px solid rgba(0,255,0,0.2)" }}>
            <img src={currentTrack.thumbnail || "https://placehold.co/100x100"} alt={currentTrack.title} className="w-full h-full object-cover" />
            {isFetching && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin" style={{ color: "#00ff00" }} />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-mono font-semibold truncate" style={{ color: "#00ff00" }}>{currentTrack.title}</span>
            <span className="text-[11px] font-mono text-muted-foreground truncate">{currentTrack.artist}</span>
          </div>
          {/* Like button */}
          <button
            onClick={toggleFavorite}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className="shrink-0 p-1 rounded transition-colors hover:scale-110"
            style={isFavorited ? { color: "#00ff00", filter: "drop-shadow(0 0 4px rgba(0,255,0,0.6))" } : { color: "var(--muted-foreground)" }}
            data-testid="button-like"
          >
            <Heart size={16} className={isFavorited ? "fill-current" : ""} />
          </button>
          {/* Add to playlist */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title="Add to playlist"
                className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-add-playlist"
              >
                <ListPlus size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-48 bg-card border-border font-mono text-sm mb-1">
              {!playlists?.length ? (
                <div className="px-3 py-2 text-xs text-muted-foreground font-mono">No playlists yet</div>
              ) : (
                playlists.map(p => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => handleAddToPlaylist(p.id)}
                    className="hover:bg-primary/10 cursor-pointer font-mono text-xs gap-2"
                  >
                    {addedToPlaylist === p.id
                      ? <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "#00ff00" }} />
                      : <div className="w-3.5 h-3.5 shrink-0" />
                    }
                    {p.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: playback controls + time */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-5 md:gap-6">
            <button onClick={prevTrack} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-prev">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={() => isPlaying ? pause() : resume()}
              disabled={isFetching}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
              style={{ background: "#00ff00", boxShadow: "0 0 20px rgba(0,255,0,0.4)", color: "#000" }}
              data-testid="button-play-pause"
            >
              {isFetching ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-next">
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span className="opacity-30">—</span>
            <span>{formatTime(duration || 0)}</span>
          </div>
        </div>

        {/* Right: download + volume + close */}
        <div className="flex items-center justify-end gap-2 w-[30%] min-w-0">
          <button
            onClick={handleDownload}
            disabled={!streamUrl || isFetching}
            title="Download full song"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="button-download"
          >
            <Download size={17} />
          </button>
          <button
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            data-testid="button-volume"
          >
            {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <div className="w-16 md:w-24">
            <Slider value={[volume]} max={1} step={0.01} onValueChange={([v]) => setVolume(v)} className="cursor-pointer" />
          </div>
          <button
            onClick={() => setDismissed(true)}
            title="Close player"
            className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors ml-1"
            data-testid="button-close-player"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ─── MOBILE layout (< sm) ─── */}
      <div className="flex sm:hidden items-center gap-2 px-3 h-14">

        {/* Thumbnail */}
        <div className="relative w-9 h-9 rounded shrink-0 overflow-hidden" style={{ border: "1px solid rgba(0,255,0,0.2)" }}>
          <img src={currentTrack.thumbnail || "https://placehold.co/100x100"} alt={currentTrack.title} className="w-full h-full object-cover" />
          {isFetching && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin" style={{ color: "#00ff00" }} />
            </div>
          )}
        </div>

        {/* Track info — fills remaining space */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[11px] font-mono font-semibold truncate leading-tight" style={{ color: "#00ff00" }}>{currentTrack.title}</span>
          <span className="text-[10px] font-mono text-muted-foreground truncate leading-tight">{currentTrack.artist}</span>
        </div>

        {/* Like */}
        <button
          onClick={toggleFavorite}
          className="shrink-0 p-1"
          style={isFavorited ? { color: "#00ff00" } : { color: "var(--muted-foreground)" }}
        >
          <Heart size={15} className={isFavorited ? "fill-current" : ""} />
        </button>

        {/* Prev */}
        <button onClick={prevTrack} className="shrink-0 p-1 text-muted-foreground">
          <SkipBack size={17} fill="currentColor" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => isPlaying ? pause() : resume()}
          disabled={isFetching}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"
          style={{ background: "#00ff00", color: "#000" }}
        >
          {isFetching ? <Loader2 size={15} className="animate-spin" /> : isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Next */}
        <button onClick={nextTrack} className="shrink-0 p-1 text-muted-foreground">
          <SkipForward size={17} fill="currentColor" />
        </button>

        {/* Close */}
        <button
          onClick={() => setDismissed(true)}
          title="Close player"
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-close-player-mobile"
        >
          <X size={16} />
        </button>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal size={17} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 bg-card border-border font-mono text-sm mb-1">
            {/* Playlist section — flat list, no sub-menu */}
            <div className="px-2 pt-2 pb-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 px-1 flex items-center gap-1.5">
                <ListPlus className="h-3 w-3" /> Add to Playlist
              </p>
              {!playlists?.length ? (
                <p className="text-xs text-muted-foreground px-1 py-1">No playlists yet</p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {playlists.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAddToPlaylist(p.id)}
                      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-xs hover:bg-primary/10 transition-colors"
                    >
                      {addedToPlaylist === p.id
                        ? <Check className="h-3 w-3 shrink-0" style={{ color: "#00ff00" }} />
                        : <div className="w-3 h-3 shrink-0" />
                      }
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDownload}
              disabled={!streamUrl || isFetching}
              className="hover:bg-primary/10 cursor-pointer font-mono text-xs gap-2 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Download song
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 flex items-center gap-2">
              <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)} className="text-muted-foreground shrink-0">
                {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <Slider value={[volume]} max={1} step={0.01} onValueChange={([v]) => setVolume(v)} className="cursor-pointer flex-1" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
