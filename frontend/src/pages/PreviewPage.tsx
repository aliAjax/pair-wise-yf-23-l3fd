import { useEffect, useMemo } from "react";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useFixtureStore } from "../stores/FixtureStore";
import { selectFrameAt, usePlaybackStore } from "../stores/PlaybackStore";
import { usePreviewRecompute } from "../hooks/usePreviewRecompute";
import { summarizeOverflow } from "../utils/playbackEngine";
import { StageCanvas } from "../components/common/StageCanvas";
import { PlaybackControls } from "../components/common/PlaybackControls";
import { OverflowPanel } from "../components/timeline/OverflowPanel";

export function PreviewPage() {
  const tracks = useTimelineTrackStore((state) => state.rows);
  const loadTracks = useTimelineTrackStore((state) => state.load);
  const scenes = useCueSceneStore((state) => state.rows);
  const loadScenes = useCueSceneStore((state) => state.load);
  const fixtures = useFixtureStore((state) => state.rows);
  const loadFixtures = useFixtureStore((state) => state.load);

  const { computing, computeError } = usePreviewRecompute();
  const frames = usePlaybackStore((state) => state.frames);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);
  const currentFrame = useMemo(
    () => selectFrameAt(frames, currentTimeMs),
    [frames, currentTimeMs]
  );
  const windows = useMemo(() => summarizeOverflow(frames), [frames]);
  const overflowNow = currentFrame
    ? Object.values(currentFrame.universes).filter((universe) => universe.overflow)
    : [];

  useEffect(() => {
    void loadTracks();
    void loadScenes();
    void loadFixtures();
  }, [loadTracks, loadScenes, loadFixtures]);

  return (
    <main className="page preview-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">stage-light · 舞台预览</p>
          <h1>舞台预览</h1>
        </div>
        <div className="page-head-status">
          {computing ? (
            <span className="badge computing">轨道变更，正在重算…</span>
          ) : (
            <span className="badge ready">实时预览</span>
          )}
        </div>
      </header>

      {computeError && <div className="banner error">预览重算失败：{computeError}</div>}
      {overflowNow.length > 0 && (
        <div className="banner warning">
          当前时刻 {overflowNow.length} 个宇宙通道超过 512，红色灯具为溢出宇宙，请前往时间轴核对。
        </div>
      )}

      <div className="preview-layout">
        <section className="panel stage-panel">
          <StageCanvas fixtures={fixtures} frame={currentFrame} />
          <PlaybackControls />
        </section>
        <aside className="panel">
          <OverflowPanel frame={currentFrame} windows={windows} />
        </aside>
      </div>
    </main>
  );
}
