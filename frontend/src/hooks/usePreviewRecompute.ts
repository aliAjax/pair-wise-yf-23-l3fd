import { useEffect } from "react";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useFixtureStore } from "../stores/FixtureStore";
import { usePlaybackStore } from "../stores/PlaybackStore";

/**
 * Subscribes to track/scene/fixture changes and triggers a worker recompute
 * (debounced). Any track edit immediately invalidates the current preview and
 * keeps it locked until the new frames are ready.
 */
export function usePreviewRecompute() {
  const tracks = useTimelineTrackStore((state) => state.rows);
  const scenes = useCueSceneStore((state) => state.rows);
  const fixtures = useFixtureStore((state) => state.rows);
  const recompute = usePlaybackStore((state) => state.recompute);
  const computing = usePlaybackStore((state) => state.computing);
  const computeError = usePlaybackStore((state) => state.computeError);

  useEffect(() => {
    const handle = setTimeout(() => {
      void recompute(tracks, scenes, fixtures);
    }, 250);
    return () => clearTimeout(handle);
  }, [tracks, scenes, fixtures, recompute]);

  return { computing, computeError };
}
