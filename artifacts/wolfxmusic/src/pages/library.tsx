import { useRef, useState } from "react";
import {
  useGetFavorites,
  useGetPlaylists,
  useCreatePlaylist,
  getGetPlaylistsQueryKey,
} from "@workspace/api-client-react";
import { TrackRow } from "@/components/ui/track-row";
import { Link } from "wouter";
import { Heart, Plus, ListMusic, Upload, Link2, X } from "lucide-react";
import { Track } from "@workspace/api-client-react/src/generated/api.schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/use-page-meta";

export function Library() {
  usePageMeta({
    title: "Your Library",
    description: "Your liked songs and playlists on wolfXmusic.",
  });

  const [activeTab, setActiveTab] = useState<"favorites" | "playlists">("favorites");
  const { data: favorites, isLoading: favLoading } = useGetFavorites();
  const { data: playlists, isLoading: plLoading } = useGetPlaylists();

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Library</h1>
        <div className="flex items-center gap-2">
          <TabButton active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")}>
            <Heart size={14} className="mr-1.5 inline" /> Liked Songs
          </TabButton>
          <TabButton active={activeTab === "playlists"} onClick={() => setActiveTab("playlists")}>
            <ListMusic size={14} className="mr-1.5 inline" /> Playlists
          </TabButton>
        </div>
      </div>

      {activeTab === "favorites" && (
        <div>
          {favLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-secondary/50 rounded-md animate-pulse" />)}
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="flex flex-col gap-1">
              {favorites.map((fav, i) => {
                const track: Track = {
                  id: fav.trackId, title: fav.title, artist: fav.artist,
                  album: fav.album, thumbnail: fav.thumbnail, duration: fav.duration,
                  duration_ms: fav.duration_ms, preview_url: fav.previewUrl,
                  url: fav.spotifyUrl, explicit: false,
                };
                return <TrackRow key={fav.id} track={track} index={i} queue={favorites.map(f => ({
                  id: f.trackId, title: f.title, artist: f.artist, album: f.album,
                  thumbnail: f.thumbnail, duration: f.duration, duration_ms: f.duration_ms,
                  preview_url: f.previewUrl, url: f.spotifyUrl, explicit: false,
                }))} />;
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Heart size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Songs you like will appear here</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "playlists" && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <CreatePlaylistDialog />
          </div>

          {plLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-secondary/50 rounded-xl animate-pulse" />)}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map(pl => (
                <Link key={pl.id} href={`/playlist/${pl.id}`}>
                  <div className="group flex flex-col gap-2 p-3 sm:p-4 rounded-xl bg-card border border-border hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="aspect-square rounded-md overflow-hidden bg-secondary flex items-center justify-center shadow-md">
                      <img
                        src={pl.thumbnail || "/thumbnail-default.svg"}
                        alt={pl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm truncate">{pl.name}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{pl.trackCount} tracks</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <ListMusic size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Create your first playlist</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
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
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPlaylist = useCreatePlaylist();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleUrlChange(url: string) {
    setImageUrl(url);
    setImagePreview(url || null);
  }

  function clearImage() {
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose(v: boolean) {
    setOpen(v);
    if (!v) {
      setName(""); setDesc(""); setImagePreview(null); setImageUrl("");
      setImageMode("upload");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const thumbnail = imagePreview || null;

    createPlaylist.mutate(
      { data: { name: name.trim(), description: desc.trim() } as Parameters<typeof createPlaylist.mutate>[0]["data"] & { thumbnail?: string } },
      {
        onSuccess: async (created) => {
          if (thumbnail && created?.id) {
            await fetch(`/api/playlists/${created.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ thumbnail }),
            });
          }
          queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
          handleClose(false);
          toast({ title: "Playlist created" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg font-semibold gap-2">
          <Plus size={16} /> New Playlist
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Create Playlist</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          {/* Image picker */}
          <div className="flex gap-4 items-start">
            {/* Preview */}
            <div className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-secondary border border-border">
              <img
                src={imagePreview || "/thumbnail-default.svg"}
                alt="Playlist cover"
                className="w-full h-full object-cover"
              />
              {imagePreview && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center hover:bg-black transition-colors"
                >
                  <X size={10} className="text-white" />
                </button>
              )}
            </div>

            {/* Image source toggles + input */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    imageMode === "upload"
                      ? "text-black font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={imageMode === "upload" ? { background: "#00ff00" } : { background: "rgba(255,255,255,0.06)" }}
                >
                  <Upload size={11} /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    imageMode === "url"
                      ? "text-black font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={imageMode === "url" ? { background: "#00ff00" } : { background: "rgba(255,255,255,0.06)" }}
                >
                  <Link2 size={11} /> URL
                </button>
              </div>

              {imageMode === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-9 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload size={13} />
                    {imagePreview ? "Change image" : "Choose file"}
                  </button>
                  <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WebP — defaults to wXm logo</p>
                </div>
              ) : (
                <div>
                  <Input
                    placeholder="https://example.com/cover.jpg"
                    value={imageUrl}
                    onChange={e => handleUrlChange(e.target.value)}
                    className="bg-background border-border focus-visible:ring-primary h-9 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Paste any image URL</p>
                </div>
              )}
            </div>
          </div>

          {/* Name + description */}
          <Input
            placeholder="Playlist name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-background border-border focus-visible:ring-primary h-11"
            autoFocus
          />
          <Input
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="bg-background border-border focus-visible:ring-primary h-11"
          />

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={!name.trim() || createPlaylist.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
            >
              {createPlaylist.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
