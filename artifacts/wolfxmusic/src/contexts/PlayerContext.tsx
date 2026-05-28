import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Track } from "@workspace/api-client-react/src/generated/api.schemas";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isFetching: boolean;
  streamUrl: string | null;
}

interface PlayerContextType extends PlayerState {
  playTrack: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  addToQueue: (track: Track) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

async function fetchStreamUrl(title: string, artist: string): Promise<string | null> {
  try {
    const q = `${title} ${artist}`.trim();
    const res = await fetch(`/api/music/stream?q=${encodeURIComponent(q)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.stream_url ?? null;
  } catch {
    return null;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => {
    try {
      const stored = localStorage.getItem("wolfXmusic_currentTrack");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isFetching, setIsFetching] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const currentTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const pendingPlayRef = useRef(false);

  queueRef.current = queue;
  currentTrackRef.current = currentTrack;
  currentTimeRef.current = currentTime;
  isPlayingRef.current = isPlaying;

  const nextTrackStable = useCallback(() => {
    const q = queueRef.current;
    const ct = currentTrackRef.current;
    if (!ct || q.length === 0) return;
    const idx = q.findIndex(t => t.id === ct.id);
    if (idx >= 0 && idx < q.length - 1) {
      setCurrentTrack(q[idx + 1]);
      pendingPlayRef.current = true;
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
    const audio = audioRef.current;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => nextTrackStable();
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [nextTrackStable]);

  // Fires when currentTrack.id changes — fetches full stream URL
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    const audio = audioRef.current;

    localStorage.setItem("wolfXmusic_currentTrack", JSON.stringify(currentTrack));
    try {
      const historyStr = localStorage.getItem("wolfXmusic_history");
      const history: Track[] = historyStr ? JSON.parse(historyStr) : [];
      const filtered = history.filter(t => t.id !== currentTrack.id);
      localStorage.setItem("wolfXmusic_history", JSON.stringify([currentTrack, ...filtered].slice(0, 10)));
    } catch { /* ignore */ }

    audio.src = "";
    audio.pause();
    setStreamUrl(null);
    setIsFetching(true);

    const id = currentTrack.id;
    fetchStreamUrl(currentTrack.title, currentTrack.artist).then(url => {
      if (currentTrackRef.current?.id !== id) return;
      setIsFetching(false);
      if (url) {
        setStreamUrl(url);
        audio.src = url;
        audio.load();
        audio.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Fires when play/pause toggles
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) setQueue(newQueue);
    pendingPlayRef.current = true;
    setIsPlaying(true);
    if (currentTrackRef.current?.id === track.id) {
      return;
    }
    setCurrentTrack(track);
  }, []);

  const pause = useCallback(() => setIsPlaying(false), []);

  const resume = useCallback(() => {
    if (currentTrackRef.current) setIsPlaying(true);
  }, []);

  const nextTrack = nextTrackStable;

  const prevTrack = useCallback(() => {
    if (currentTimeRef.current > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const q = queueRef.current;
    const ct = currentTrackRef.current;
    if (!ct || q.length === 0) return;
    const idx = q.findIndex(t => t.id === ct.id);
    if (idx > 0) {
      setCurrentTrack(q[idx - 1]);
      setIsPlaying(true);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const v = Math.max(0, Math.min(1, vol));
    if (audioRef.current) audioRef.current.volume = v;
    setVolumeState(v);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentTrack, queue, isPlaying, currentTime, duration, volume, isFetching, streamUrl,
      playTrack, pause, resume, nextTrack, prevTrack, seek, setVolume, addToQueue,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within a PlayerProvider");
  return context;
};
