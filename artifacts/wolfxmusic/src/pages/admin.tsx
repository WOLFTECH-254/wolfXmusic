import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Users, ListMusic, Play, Heart, Clock, Crown, Activity } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

interface Stats { users: number; playlists: number; plays: number; favorites: number; }
interface AdminUser { id: number; email: string; displayName: string; role: string; createdAt: string; }
interface AdminPlay { id: number; userId: number | null; trackTitle: string; trackArtist: string; thumbnail: string | null; playedAt: string; }
interface AdminPlaylist { id: number; name: string; description: string | null; trackCount: number; createdAt: string; }

function useAdminFetch<T>(path: string, token: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!token) return;
    fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [path, token]);
  return { data, loading };
}

export function Admin() {
  const { user, token, isLoading } = useAuth();
  const [, navigate] = useLocation();

  usePageMeta({ title: "Admin Dashboard" });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const { data: stats } = useAdminFetch<Stats>("/admin/stats", token);
  const { data: users, loading: usersLoading } = useAdminFetch<AdminUser[]>("/admin/users", token);
  const { data: plays, loading: playsLoading } = useAdminFetch<AdminPlay[]>("/admin/plays", token);
  const { data: playlists, loading: plsLoading } = useAdminFetch<AdminPlaylist[]>("/admin/playlists", token);

  if (isLoading || !user) return null;
  if (user.role !== "admin") return null;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.2)" }}>
          <Activity size={20} style={{ color: "#00ff00" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground font-mono">wolfXmusic // platform activity</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Total Users" value={stats?.users ?? "—"} />
        <StatCard icon={<ListMusic size={20} />} label="Playlists" value={stats?.playlists ?? "—"} />
        <StatCard icon={<Play size={20} />} label="Total Plays" value={stats?.plays ?? "—"} />
        <StatCard icon={<Heart size={20} />} label="Favorites" value={stats?.favorites ?? "—"} />
      </div>

      {/* Users + Plays row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users */}
        <Section title="Users" icon={<Users size={15} />}>
          {usersLoading ? <LoadingRows /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal">Name</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal hidden sm:table-cell">Email</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal">Role</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map(u => (
                  <tr key={u.id} className="border-b border-border/40 hover:bg-white/2 transition-colors">
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0" style={{ background: "#00ff00" }}>
                        {u.displayName[0].toUpperCase()}
                      </span>
                      <span className="truncate max-w-[100px]">{u.displayName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[140px] hidden sm:table-cell">{u.email}</td>
                    <td className="py-2.5 px-3">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-black" style={{ background: "#00ff00" }}>
                          <Crown size={9} /> admin
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">user</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!usersLoading && (users ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No users yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </Section>

        {/* Recent Plays */}
        <Section title="Recent Plays" icon={<Play size={15} />}>
          {playsLoading ? <LoadingRows /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal">Track</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal hidden sm:table-cell">Artist</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal">When</th>
                </tr>
              </thead>
              <tbody>
                {(plays ?? []).slice(0, 20).map(p => (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-white/2 transition-colors">
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      {p.thumbnail && (
                        <img src={p.thumbnail} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                      )}
                      <span className="truncate max-w-[120px] font-medium">{p.trackTitle}</span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[100px] hidden sm:table-cell">{p.trackArtist}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(p.playedAt)}</span>
                    </td>
                  </tr>
                ))}
                {!playsLoading && (plays ?? []).length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-muted-foreground text-sm">No plays yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      {/* Playlists */}
      <Section title="All Playlists" icon={<ListMusic size={15} />}>
        {plsLoading ? <LoadingRows /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal">Name</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal hidden sm:table-cell">Description</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal">Tracks</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono font-normal hidden md:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {(playlists ?? []).map(pl => (
                <tr key={pl.id} className="border-b border-border/40 hover:bg-white/2 transition-colors">
                  <td className="py-2.5 px-3 font-medium">{pl.name}</td>
                  <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px] hidden sm:table-cell">{pl.description || "—"}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{pl.trackCount}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground hidden md:table-cell">
                    {new Date(pl.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!plsLoading && (playlists ?? []).length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No playlists yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-xl p-4 border border-border" style={{ background: "rgba(0,255,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3" style={{ color: "#00ff00" }}>{icon}</div>
      <p className="text-2xl font-bold font-mono">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2" style={{ background: "rgba(0,255,0,0.03)" }}>
        <span style={{ color: "#00ff00" }}>{icon}</span>
        <h2 className="text-sm font-semibold font-mono">{title}</h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="p-4 space-y-2">
      {[1, 2, 3].map(i => <div key={i} className="h-8 bg-secondary/40 rounded animate-pulse" />)}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
