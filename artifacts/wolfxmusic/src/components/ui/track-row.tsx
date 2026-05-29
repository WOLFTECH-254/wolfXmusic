import { Link } from "wouter";
import { Track } from "@workspace/api-client-react/src/generated/api.schemas";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Pause, Heart, MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface TrackRowProps {
  track: Track;
  index: number;
  queue: Track[];
  showAlbum?: boolean;
  onRemove?: () => void;
}

export function TrackRow({ track, index, queue, showAlbum = true, onRemove }: TrackRowProps) {
  const { currentTrack, isPlaying, isFetching, playTrack, pause } = usePlayer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites } = useGetFavorites();
  const { data: playlists } = useGetPlaylists();

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addToPlaylist = useAddTrackToPlaylist();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isThisFetching = isCurrentTrack && isFetching;
  const isFavorited = favorites?.some(f => f.trackId === track.id);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      playTrack(track, queue);
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorited) {
      removeFavorite.mutate(
        { trackId: track.id },
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
            trackId: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            thumbnail: track.thumbnail,
            duration: track.duration,
            duration_ms: track.duration_ms,
            previewUrl: track.preview_url,
            spotifyUrl: track.url,
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
  };

  const handleAddToPlaylist = (playlistId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToPlaylist.mutate(
      {
        id: playlistId,
        data: {
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          thumbnail: track.thumbnail,
          duration: track.duration,
          duration_ms: track.duration_ms,
          previewUrl: track.preview_url,
          spotifyUrl: track.url,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
          toast({ title: "Added to playlist" });
        },
        onError: () => {
          toast({ title: "Failed to add to playlist", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 cursor-pointer",
        "hover:bg-primary/5",
        isCurrentTrack ? "bg-primary/8" : ""
      )}
      style={isCurrentTrack ? { background: "rgba(0,255,0,0.06)" } : {}}
      onClick={handlePlayPause}
      data-testid={`track-row-${track.id}`}
    >
      {/* Index / Playing indicator */}
      <div className="w-8 text-center text-muted-foreground text-sm font-mono shrink-0">
        {isThisFetching ? (
          <Loader2 size={14} className="animate-spin mx-auto" style={{ color: "#00ff00" }} />
        ) : isCurrentTrack && isPlaying ? (
          <div className="flex items-end justify-center gap-0.5 h-4">
            <div className="w-0.5 rounded-full animate-[bounce_0.8s_infinite]" style={{ background: "#00ff00", height: "100%" }} />
            <div className="w-0.5 rounded-full animate-[bounce_1s_infinite]" style={{ background: "#00ff00", height: "60%" }} />
            <div className="w-0.5 rounded-full animate-[bounce_0.7s_infinite]" style={{ background: "#00ff00", height: "85%" }} />
            <div className="w-0.5 rounded-full animate-[bounce_1.1s_infinite]" style={{ background: "#00ff00", height: "45%" }} />
          </div>
        ) : (
          <>
            <span className="group-hover:hidden font-mono">{index + 1}</span>
            <button className="hidden group-hover:flex items-center justify-center w-full" onClick={handlePlayPause}>
              {isCurrentTrack && isPlaying
                ? <Pause size={14} fill="currentColor" style={{ color: "#00ff00" }} />
                : <Play size={14} fill="currentColor" style={{ color: "#00ff00" }} />
              }
            </button>
          </>
        )}
      </div>

      {/* Thumbnail + Info */}
      <div className="flex-1 flex items-center gap-3 overflow-hidden min-w-0">
        <div className="relative shrink-0">
          <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded object-cover shadow-sm" />
          {!track.preview_url && !isThisFetching && (
            <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
              <span className="text-[8px] font-mono text-muted-foreground leading-tight text-center px-0.5">NO PREVIEW</span>
            </div>
          )}
        </div>
        <div className="flex flex-col truncate">
          <span className={cn("text-sm font-medium truncate transition-colors", isCurrentTrack ? "glow-green" : "text-foreground group-hover:text-white")}
            style={isCurrentTrack ? { color: "#00ff00", textShadow: "0 0 12px rgba(0,255,0,0.4)" } : {}}>
            {track.title}
          </span>
          <Link
            href={`/artist/${track.artists?.[0] ?? track.artist}`}
            className="text-xs text-muted-foreground hover:underline truncate"
            onClick={e => e.stopPropagation()}
          >
            {track.artist}
          </Link>
        </div>
      </div>

      {/* Album */}
      {showAlbum && (
        <div className="flex-1 hidden lg:flex items-center text-sm text-muted-foreground truncate pr-4">
          <Link href={`/album/${track.album}`} className="hover:underline truncate font-mono text-xs" onClick={e => e.stopPropagation()}>
            {track.album}
          </Link>
        </div>
      )}

      {/* Duration */}
      <div className="w-14 text-right text-xs text-muted-foreground font-mono shrink-0">
        {formatDuration(track.duration_ms)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={toggleFavorite}
          className={cn("p-1.5 rounded transition-colors", isFavorited ? "" : "text-muted-foreground hover:text-white")}
          style={isFavorited ? { color: "#00ff00", filter: "drop-shadow(0 0 4px rgba(0,255,0,0.6))" } : {}}
          data-testid={`button-favorite-${track.id}`}
        >
          <Heart size={15} className={cn(isFavorited && "fill-current")} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button className="p-1.5 rounded text-muted-foreground hover:text-white transition-colors" data-testid={`button-more-${track.id}`}>
              <MoreHorizontal size={15} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={6} className="w-52 bg-card border-border font-mono text-sm z-[200]">
            {/* Flat playlist list — no sub-menu that can overflow off screen */}
            <div className="px-2 pt-2 pb-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 px-1 flex items-center gap-1.5">
                <Plus className="h-3 w-3" /> Add to Playlist
              </p>
              {!playlists?.length ? (
                <p className="text-xs text-muted-foreground px-1 py-1">No playlists yet</p>
              ) : (
                <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                  {playlists.map(p => (
                    <button
                      key={p.id}
                      onClick={e => handleAddToPlaylist(p.id, e)}
                      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-xs hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {onRemove && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={e => { e.stopPropagation(); onRemove(); }}
                  className="text-destructive hover:bg-destructive/10 cursor-pointer font-mono text-xs"
                >
                  Remove from playlist
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
