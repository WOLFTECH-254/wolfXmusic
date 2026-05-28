import { useState, useEffect } from "react";
import { useSearchMusic, getSearchMusicQueryKey } from "@workspace/api-client-react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TrackRow } from "@/components/ui/track-row";
import { Link } from "wouter";
import { Track } from "@workspace/api-client-react/src/generated/api.schemas";
import { usePageMeta } from "@/hooks/use-page-meta";

export function Search() {
  usePageMeta({
    title: "Search",
    description: "Search for tracks, artists, and albums on wolfXmusic.",
  });
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"track" | "artist" | "album">("track");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useSearchMusic(
    { q: debouncedQuery, type: activeTab, limit: 20 },
    { query: { enabled: !!debouncedQuery, queryKey: getSearchMusicQueryKey({ q: debouncedQuery, type: activeTab, limit: 20 }) } }
  );

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pt-2 pb-4 -mx-6 px-6 md:-mx-10 md:px-10">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input 
            type="text" 
            placeholder="What do you want to listen to?" 
            className="w-full pl-12 h-14 bg-card border-border text-lg rounded-full shadow-lg focus-visible:ring-primary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        {debouncedQuery && (
          <div className="flex items-center gap-2 mt-6">
            <TabButton active={activeTab === "track"} onClick={() => setActiveTab("track")}>Tracks</TabButton>
            <TabButton active={activeTab === "artist"} onClick={() => setActiveTab("artist")}>Artists</TabButton>
            <TabButton active={activeTab === "album"} onClick={() => setActiveTab("album")}>Albums</TabButton>
          </div>
        )}
      </div>

      <div className="flex-1">
        {!debouncedQuery ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <SearchIcon size={48} className="mb-4 opacity-20" />
            <p>Search for tracks, artists, or albums</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10">No results found for "{debouncedQuery}"</div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeTab === "track" && (
              <div className="flex flex-col gap-1">
                {(data.results as Track[]).map((track, i) => (
                  <TrackRow key={track.id} track={track} index={i} queue={data.results as Track[]} />
                ))}
              </div>
            )}
            
            {activeTab === "artist" && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {(data.results as any[]).map(artist => (
                  <Link key={artist.id} href={`/artist/${artist.id}`}>
                    <div className="group flex flex-col items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-center">
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-xl mb-2 bg-secondary">
                        <img src={artist.thumbnail || "https://placehold.co/200x200?text=No+Image"} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="font-bold text-base tracking-wide">{artist.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === "album" && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {(data.results as any[]).map(album => (
                  <Link key={album.id} href={`/album/${album.id}`}>
                    <div className="group flex flex-col gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="aspect-square rounded-md overflow-hidden shadow-xl bg-secondary">
                        <img src={album.thumbnail || "https://placehold.co/300x300?text=No+Cover"} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm truncate">{album.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
