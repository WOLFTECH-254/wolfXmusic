import { useSearchMusic, getSearchMusicQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Play } from "lucide-react";
import { Track } from "@workspace/api-client-react/src/generated/api.schemas";
import { usePlayer } from "@/contexts/PlayerContext";

export function Home() {
  const { playTrack } = usePlayer();
  const artists = ["Drake", "The Weeknd", "Taylor Swift", "Kendrick Lamar", "Bad Bunny"];
  
  // Use localStorage for recently played
  const historyStr = localStorage.getItem("wolfXmusic_history");
  const history: Track[] = historyStr ? JSON.parse(historyStr) : [];

  return (
    <div className="flex flex-col gap-10">
      <section className="relative -mx-6 md:-mx-10 -mt-6 md:-mt-10 px-6 md:px-10 py-20 bg-gradient-to-br from-primary/20 via-background to-background border-b border-border">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Discover <span className="text-primary">New</span> Music
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Dive into a world of endless sound. Your next favorite track is just a click away.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          Featured Artists
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {artists.map((artist) => (
            <ArtistCard key={artist} name={artist} />
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Recently Played</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {history.slice(0, 5).map((track, i) => (
              <div 
                key={`${track.id}-${i}`}
                className="group relative p-4 rounded-xl bg-card border border-border hover:bg-accent/5 transition-all duration-300 cursor-pointer"
                onClick={() => playTrack(track, history)}
              >
                <div className="aspect-square rounded-md overflow-hidden mb-4 shadow-lg relative">
                  <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all">
                      <Play size={24} fill="currentColor" className="ml-1" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-sm truncate">{track.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ArtistCard({ name }: { name: string }) {
  const { data } = useSearchMusic({ q: name, type: "artist", limit: 1 }, { query: { queryKey: getSearchMusicQueryKey({ q: name, type: "artist", limit: 1 }) } });
  
  if (!data || !data.results || data.results.length === 0) return null;
  const artist = data.results[0] as any;

  return (
    <Link href={`/artist/${artist.id}`}>
      <div className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-center">
        <div className="w-32 h-32 rounded-full overflow-hidden shadow-xl mb-2">
          <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
        <h3 className="font-bold text-sm tracking-wide">{artist.name}</h3>
      </div>
    </Link>
  );
}
