import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../stores/hooks";
import { pause, play, setTime, stop } from "../stores/PlaybackStore";
import { PLAYBACK_TICK_MS } from "../constants/dmx";
import type { TimelineTrack } from "../types/TimelineTrack";

export interface PlaybackController {
  time_ms: number;
  playing: boolean;
  /** 重算闸门落下时为 true：播放按钮禁用、推进循环挂起 */
  recomputing: boolean;
  duration_ms: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time_ms: number) => void;
  toggle: () => void;
}

/**
 * 时间轴播放控制：
 * - 按真实流逝时间推进游标，每 PLAYBACK_TICK_MS 同步一次；
 * - recomputing（轨道改动后未算完）时推进循环挂起，store 侧也禁止 play；
 * - 到时间轴末尾自动暂停。
 */
export function useTimelinePlayback(tracks: TimelineTrack[]): PlaybackController {
  const dispatch = useAppDispatch();
  const time_ms = useAppSelector((state) => state.playback.time_ms);
  const playing = useAppSelector((state) => state.playback.playing);
  const recomputing = useAppSelector((state) => state.playback.recomputing);

  const duration_ms = useMemo(
    () => tracks.reduce((max, track) => Math.max(max, track.start_ms + track.duration_ms), 0),
    [tracks]
  );

  const timerRef = useRef<number | null>(null);
  const timeRef = useRef(time_ms);
  timeRef.current = time_ms;

  useEffect(() => {
    if (!playing || recomputing) return;
    let lastTick = performance.now();
    const step = () => {
      const now = performance.now();
      const next = timeRef.current + (now - lastTick);
      lastTick = now;
      if (next >= duration_ms) {
        dispatch(setTime(duration_ms));
        dispatch(pause());
        return;
      }
      dispatch(setTime(next));
      timerRef.current = window.setTimeout(step, PLAYBACK_TICK_MS);
    };
    timerRef.current = window.setTimeout(step, PLAYBACK_TICK_MS);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [playing, recomputing, duration_ms, dispatch]);

  const seek = useCallback((value: number) => dispatch(setTime(value)), [dispatch]);
  const toggle = useCallback(() => {
    if (playing) {
      dispatch(pause());
    } else if (!recomputing) {
      if (timeRef.current >= duration_ms) dispatch(setTime(0));
      dispatch(play());
    }
  }, [dispatch, playing, recomputing, duration_ms]);

  return {
    time_ms,
    playing,
    recomputing,
    duration_ms,
    play: () => {
      if (!recomputing) dispatch(play());
    },
    pause: () => dispatch(pause()),
    stop: () => dispatch(stop()),
    seek,
    toggle
  };
}
