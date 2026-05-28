import { useParams } from "wouter";
import { useGetAlbum, getGetAlbumQueryKey } from "@workspace/api-client-react";
import { TrackRow } from "@/components/ui/track-row";
import { Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/use-page-meta";

export function Album() {
  const params = useParams();
  const id = params.id as string;
  const { playTrack } = usePlayer();

  const { data: album, isLoading } = useGetAlbum(id, { query: { enabled: !!id, queryKey: getGetAlbumQueryKey(id) } });

  usePageMeta({
    title: album ? `${album.name} — ${album.artist}` : "Album",
    description: album ? `${album.name} by ${album.artist} · ${album.total_tracks} tracks · Stream on wolfXmusic.` : undefined,
    image: album?.thumbnail,
  });

  if (isLoading) {
    return <div className="animate-pulse flex flex-col gap-10">
      <div className="h-64 bg-secondary rounded-xl" />
      <div className="h-40 bg-secondary rounded-xl" />
    </div>;
  }

  if (!album) return <div className="text-center py-20 text-muted-foreground">Album not found</div>;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row items-end gap-6 pt-10 pb-6 border-b border-border/50">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-md overflow-hidden shadow-2xl shrink-0 bg-card">
          <img src={album.thumbnail} alt={album.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <span className="text-sm font-semibold tracking-wider text-primary uppercase capitalize">{album.type || 'Album'}</span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter line-clamp-2">{album.name}</h1>
          <div className="text-muted-foreground text-sm flex items-center gap-2 mt-2">
            <Link href={`/search?q=${encodeURIComponent(album.artist)}`} className="text-foreground hover:underline font-medium">
              {album.artist}
            </Link>
            <span>•</span>
            <span>{album.release_date?.substring(0, 4)}</span>
            <span>•</span>
            <span>{album.total_tracks} tracks</span>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-6">
          <button 
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            onClick={() => {
              if (album.tracks && album.tracks.length > 0) {
                playTrack(album.tracks[0], album.tracks);
              }
            }}
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {album.tracks?.map((track, i) => (
            <TrackRow key={track.id} track={{...track, thumbnail: album.thumbnail, album: album.name}} index={i} queue={album.tracks.map(t => ({...t, thumbnail: album.thumbnail, album: album.name}))} showAlbum={false} />
          ))}
        </div>
      </section>
    </div>
  );
}
