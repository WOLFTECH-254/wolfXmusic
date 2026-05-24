import { useState } from "react";
import { 
  useGetFavorites, 
  useGetPlaylists, 
  useCreatePlaylist,
  getGetPlaylistsQueryKey
} from "@workspace/api-client-react";
import { TrackRow } from "@/components/ui/track-row";
import { Link } from "wouter";
import { Heart, Plus, ListMusic } from "lucide-react";
import { Track } from "@workspace/api-client-react/src/generated/api.schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function Library() {
  const [activeTab, setActiveTab] = useState<"favorites" | "playlists">("favorites");
  const { data: favorites, isLoading: favLoading } = useGetFavorites();
  const { data: playlists, isLoading: plLoading } = useGetPlaylists();

  return (
    <div className="flex flex-col gap-8 h-full animate-in fade-in duration-500">
      <div className="flex items-center gap-6 border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
        <div className="flex items-center gap-2 mt-2">
          <TabButton active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")}>
            <Heart size={16} className="mr-2 inline" /> Liked Songs
          </TabButton>
          <TabButton active={activeTab === "playlists"} onClick={() => setActiveTab("playlists")}>
            <ListMusic size={16} className="mr-2 inline" /> Playlists
          </TabButton>
        </div>
      </div>

      {activeTab === "favorites" && (
        <div>
          {favLoading ? (
            <div className="space-y-2 mt-4">
              {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-secondary/50 rounded-md animate-pulse" />)}
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="flex flex-col gap-1">
              {favorites.map((fav, i) => {
                const track: Track = {
                  id: fav.trackId,
                  title: fav.title,
                  artist: fav.artist,
                  album: fav.album,
                  thumbnail: fav.thumbnail,
                  duration: fav.duration,
                  duration_ms: fav.duration_ms,
                  preview_url: fav.previewUrl,
                  url: fav.spotifyUrl,
                  explicit: false
                };
                return <TrackRow key={fav.id} track={track} index={i} queue={favorites.map(f => ({
                  id: f.trackId,
                  title: f.title,
                  artist: f.artist,
                  album: f.album,
                  thumbnail: f.thumbnail,
                  duration: f.duration,
                  duration_ms: f.duration_ms,
                  preview_url: f.previewUrl,
                  url: f.spotifyUrl,
                  explicit: false
                }))} />;
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Heart size={48} className="mx-auto mb-4 opacity-20" />
              <p>Songs you like will appear here</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "playlists" && (
        <div>
          <div className="mb-6 flex justify-end">
            <CreatePlaylistDialog />
          </div>
          
          {plLoading ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-secondary/50 rounded-xl animate-pulse" />)}
             </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {playlists.map(pl => (
                <Link key={pl.id} href={`/playlist/${pl.id}`}>
                  <div className="group flex flex-col gap-3 p-4 rounded-xl bg-card border border-border hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="aspect-square rounded-md overflow-hidden bg-secondary flex items-center justify-center relative shadow-md">
                      {pl.thumbnail ? (
                        <img src={pl.thumbnail} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <ListMusic size={48} className="text-muted-foreground/30" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm truncate">{pl.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{pl.trackCount} tracks</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <ListMusic size={48} className="mx-auto mb-4 opacity-20" />
              <p>Create your first playlist</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active ? "bg-foreground text-background shadow-md" : "bg-card text-foreground hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function CreatePlaylistDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const createPlaylist = useCreatePlaylist();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createPlaylist.mutate({
      data: { name: name.trim(), description: desc.trim() }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
        setOpen(false);
        setName("");
        setDesc("");
        toast({ title: "Playlist created" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg font-semibold">
          <Plus size={18} className="mr-2" /> New Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input 
              placeholder="Playlist name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-background border-border focus-visible:ring-primary h-12"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Input 
              placeholder="Description (optional)" 
              value={desc} 
              onChange={e => setDesc(e.target.value)}
              className="bg-background border-border focus-visible:ring-primary"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={!name.trim() || createPlaylist.isPending} className="bg-primary hover:bg-primary/90">
              {createPlaylist.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
