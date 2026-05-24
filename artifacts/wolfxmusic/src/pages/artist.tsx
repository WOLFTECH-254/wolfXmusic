import { useParams } from "wouter";
import { useGetArtist, useGetArtistTopTracks, useGetArtistAlbums, getGetArtistQueryKey, getGetArtistTopTracksQueryKey, getGetArtistAlbumsQueryKey } from "@workspace/api-client-react";
import { TrackRow } from "@/components/ui/track-row";
import { Link } from "wouter";
import { Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

export function Artist() {
  const params = useParams();
  const id = params.id as string;
  const { playTrack } = usePlayer();

  const { data: artist, isLoading: artistLoading } = useGetArtist(id, { query: { enabled: !!id, queryKey: getGetArtistQueryKey(id) } });
  const { data: topTracks, isLoading: tracksLoading } = useGetArtistTopTracks(id, { query: { enabled: !!id, queryKey: getGetArtistTopTracksQueryKey(id) } });
  const { data: albums, isLoading: albumsLoading } = useGetArtistAlbums(id, { query: { enabled: !!id, queryKey: getGetArtistAlbumsQueryKey(id) } });

  if (artistLoading) {
    return <div className="animate-pulse flex flex-col gap-10">
      <div className="h-64 bg-secondary rounded-xl" />
      <div className="h-40 bg-secondary rounded-xl" />
    </div>;
  }

  if (!artist) return <div className="text-center py-20 text-muted-foreground">Artist not found</div>;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <section className="relative -mx-6 md:-mx-10 -mt-6 md:-mt-10 px-6 md:px-10 pt-32 pb-10 bg-secondary/20 flex flex-col md:flex-row items-end gap-6">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-0" />
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shadow-2xl relative z-10 border-4 border-background shrink-0 bg-card">
          <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 flex flex-col gap-2 w-full">
          <span className="text-sm font-semibold tracking-wider text-primary uppercase">Artist</span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter truncate">{artist.name}</h1>
          <div className="text-muted-foreground text-sm flex gap-4 mt-2">
            <span>{(artist.followers || 0).toLocaleString()} followers</span>
            {artist.genres && artist.genres.length > 0 && (
              <span className="capitalize">{artist.genres.join(" • ")}</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-6">
          <button 
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            onClick={() => {
              if (topTracks && topTracks.length > 0) {
                playTrack(topTracks[0], topTracks);
              }
            }}
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </button>
          <h2 className="text-2xl font-bold">Popular</h2>
        </div>
        
        {tracksLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-secondary/50 rounded-md animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {topTracks?.slice(0, 5).map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} queue={topTracks} showAlbum={false} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Discography</h2>
        {albumsLoading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
             {[1,2,3,4,5].map(i => <div key={i} className="aspect-square bg-secondary/50 rounded-xl animate-pulse" />)}
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {albums?.map(album => (
              <Link key={album.id} href={`/album/${album.id}`}>
                <div className="group flex flex-col gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="aspect-square rounded-md overflow-hidden shadow-xl bg-secondary relative">
                    <img src={album.thumbnail} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm truncate">{album.name}</h3>
                    <p className="text-xs text-muted-foreground truncate capitalize">{album.type || 'Album'} • {album.release_date?.substring(0, 4)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
