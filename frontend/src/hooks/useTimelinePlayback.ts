import { useEffect, useRef } from "react";
import { usePlaybackStore } from "../stores/PlaybackStore";

/**
 * Playback loop. Advances the playhead via requestAnimationFrame while the
 * preview is recomputing the loop stays paused and cannot be started.
 */
export function useTimelinePlayback() {
  const playing = usePlaybackStore((state) => state.playing);
  const computing = usePlaybackStore((state) => state.computing);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);
  const totalMs = usePlaybackStore((state) => state.totalMs);
  const seek = usePlaybackStore((state) => state.seek);
  const play = usePlaybackStore((state) => state.play);
  const pause = usePlaybackStore((state) => state.pause);
  const togglePlay = usePlaybackStore((state) => state.togglePlay);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || computing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      const state = usePlaybackStore.getState();
      if (!state.playing || state.computing) return;
      const next = state.currentTimeMs + delta;
      if (state.totalMs > 0 && next >= state.totalMs) {
        state.seek(state.totalMs);
        state.pause();
        return;
      }
      state.seek(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, computing]);

  return { playing, computing, currentTimeMs, totalMs, seek, play, pause, togglePlay };
}
