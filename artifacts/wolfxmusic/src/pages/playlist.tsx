import { useParams, Link } from "wouter";
import { useGetPlaylist, getGetPlaylistQueryKey } from "@workspace/api-client-react";
import { TrackRow } from "@/components/ui/track-row";
import { Play, ListMusic } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Track } from "@workspace/api-client-react/src/generated/api.schemas";
import { usePageMeta } from "@/hooks/use-page-meta";

export function Playlist() {
  const params = useParams();
  const id = Number(params.id);
  const { playTrack } = usePlayer();

  const { data: playlist, isLoading } = useGetPlaylist(id, { query: { enabled: !!id, queryKey: getGetPlaylistQueryKey(id) } });

  usePageMeta({
    title: playlist?.name ?? "Playlist",
    description: playlist ? `${playlist.name} · ${playlist.trackCount} tracks · Listen on wolfXmusic.` : undefined,
    image: playlist?.thumbnail ?? undefined,
  });

  if (isLoading) {
    return <div className="animate-pulse flex flex-col gap-10">
      <div className="h-64 bg-secondary rounded-xl" />
      <div className="h-40 bg-secondary rounded-xl" />
    </div>;
  }

  if (!playlist) return <div className="text-center py-20 text-muted-foreground">Playlist not found</div>;

  const tracks: Track[] = (playlist.tracks || []).map(pt => ({
    id: pt.trackId,
    title: pt.title,
    artist: pt.artist,
    album: pt.album,
    thumbnail: pt.thumbnail,
    duration: pt.duration,
    duration_ms: pt.duration_ms,
    preview_url: pt.previewUrl,
    url: pt.spotifyUrl,
    explicit: false
  }));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row items-end gap-6 pt-10 pb-6 border-b border-border/50">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-md overflow-hidden shadow-2xl shrink-0 bg-secondary flex items-center justify-center border border-border">
          <img
            src={playlist.thumbnail || "/thumbnail-default.svg"}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <span className="text-sm font-semibold tracking-wider text-primary uppercase">Playlist</span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter line-clamp-2">{playlist.name}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">{playlist.description}</p>
          <div className="text-muted-foreground text-sm flex items-center gap-2 mt-2">
            <span>{playlist.trackCount} tracks</span>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-6">
          <button 
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50"
            disabled={tracks.length === 0}
            onClick={() => {
              if (tracks.length > 0) {
                playTrack(tracks[0], tracks);
              }
            }}
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </button>
        </div>

        {tracks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>This playlist is empty.</p>
            <Link href="/search" className="text-primary hover:underline mt-2 inline-block">Find some tracks</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {tracks.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} queue={tracks} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
