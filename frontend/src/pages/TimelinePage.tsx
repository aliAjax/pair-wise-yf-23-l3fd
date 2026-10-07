import { useEffect, useMemo, useRef, useState } from "react";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useFixtureStore } from "../stores/FixtureStore";
import {
  selectFrameAt,
  usePlaybackStore
} from "../stores/PlaybackStore";
import { usePreviewRecompute } from "../hooks/usePreviewRecompute";
import { useIndexedDbStore } from "../hooks/useIndexedDbStore";
import { LAYER_ORDER } from "../constants/layers";
import { PX_PER_MS } from "../constants/timeline";
import { activeTracksAt, summarizeOverflow } from "../utils/playbackEngine";
import { TimelineRuler } from "../components/common/TimelineRuler";
import { PlaybackControls } from "../components/common/PlaybackControls";
import { EmptyState } from "../components/common/EmptyState";
import { TrackLane } from "../components/timeline/TrackLane";
import { TrackEditForm } from "../components/timeline/TrackEditForm";
import { StackingInspector } from "../components/timeline/StackingInspector";
import { OverflowPanel } from "../components/timeline/OverflowPanel";
import { ConflictDialog } from "../components/timeline/ConflictDialog";
import type { TimelineTrack } from "../types/TimelineTrack";

type InspectorTab = "edit" | "stack" | "overflow";

export function TimelinePage() {
  const tracks = useTimelineTrackStore((state) => state.rows);
  const tracksLoading = useTimelineTrackStore((state) => state.loading);
  const saving = useTimelineTrackStore((state) => state.saving);
  const conflict = useTimelineTrackStore((state) => state.conflict);
  const loadTracks = useTimelineTrackStore((state) => state.load);
  const saveTrack = useTimelineTrackStore((state) => state.saveTrack);
  const simulateConcurrentEdit = useTimelineTrackStore((state) => state.simulateConcurrentEdit);
  const resolveConflict = useTimelineTrackStore((state) => state.resolveConflict);
  const clearConflict = useTimelineTrackStore((state) => state.clearConflict);

  const scenes = useCueSceneStore((state) => state.rows);
  const loadScenes = useCueSceneStore((state) => state.load);
  const fixtures = useFixtureStore((state) => state.rows);
  const loadFixtures = useFixtureStore((state) => state.load);

  const { computing, computeError } = usePreviewRecompute();
  const frames = usePlaybackStore((state) => state.frames);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);
  const totalMs = usePlaybackStore((state) => state.totalMs);
  const seek = usePlaybackStore((state) => state.seek);

  const { value: selectedId, setValue: setSelectedId } = useIndexedDbStore<number | null>(
    "timeline-selected-track",
    null
  );
  const [tab, setTab] = useState<InspectorTab>("edit");
  const pendingDraftRef = useRef<TimelineTrack | null>(null);

  useEffect(() => {
    void loadTracks();
    void loadScenes();
    void loadFixtures();
  }, [loadTracks, loadScenes, loadFixtures]);

  const currentFrame = useMemo(
    () => selectFrameAt(frames, currentTimeMs),
    [frames, currentTimeMs]
  );
  const windows = useMemo(() => summarizeOverflow(frames), [frames]);
  const selectedTrack = tracks.find((track) => track.id === selectedId) ?? null;
  const activeCount = currentFrame ? activeTracksAt(tracks, currentFrame.time_ms).length : 0;
  const overflowCount = currentFrame
    ? Object.values(currentFrame.universes).filter((universe) => universe.overflow).length
    : 0;

  const persistTrack = async (track: TimelineTrack) => {
    pendingDraftRef.current = track;
    await saveTrack(track);
  };

  const handleMove = async (trackId: number, startMs: number) => {
    const track = tracks.find((candidate) => candidate.id === trackId);
    if (!track || track.locked) return;
    await persistTrack({ ...track, start_ms: startMs });
  };

  const handleResize = async (trackId: number, durationMs: number) => {
    const track = tracks.find((candidate) => candidate.id === trackId);
    if (!track || track.locked) return;
    await persistTrack({ ...track, duration_ms: durationMs });
  };

  const handleEditSave = async (draft: TimelineTrack) => {
    pendingDraftRef.current = draft;
    const accepted = await saveTrack(draft);
    if (accepted) setTab("stack");
  };

  const handleSimulateConflict = async () => {
    if (!selectedTrack) return;
    await simulateConcurrentEdit(selectedTrack.id, {
      duration_ms: selectedTrack.duration_ms + 2000
    });
  };

  return (
    <main className="page timeline-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">stage-light · 时间轴编排</p>
          <h1>叠加播放核对</h1>
        </div>
        <div className="page-head-status">
          {computing ? (
            <span className="badge computing">预览重算中 · 播放锁定</span>
          ) : (
            <span className="badge ready">预览已重算</span>
          )}
        </div>
      </header>

      {computeError && <div className="banner error">预览重算失败：{computeError}</div>}

      <div className="timeline-layout">
        <section className="panel timeline-panel">
          <div className="timeline-toolbar">
            <PlaybackControls />
            <span className="timeline-hint">
              拖拽轨道块移动起始时间，拖右边缘改时长；轨道改动后舞台预览立即在后台重算，没算完不能播放。
            </span>
          </div>
          <div className="timeline-scroll">
            <TimelineRuler totalMs={totalMs} currentTimeMs={currentTimeMs} onSeek={seek} />
            {LAYER_ORDER.map((layer) => (
              <TrackLane
                key={layer}
                layer={layer}
                tracks={tracks}
                scenes={scenes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={handleMove}
                onResize={handleResize}
              />
            ))}
            {tracksLoading && <div className="empty">轨道加载中…</div>}
          </div>
          <div className="timeline-legend">
            <span>比例 1 秒 = {Math.round(1000 * PX_PER_MS)}px</span>
            <span>压层：追光 &gt; 效果 &gt; 基础；同层按场景优先级</span>
          </div>
        </section>

        <aside className="panel inspector">
          <div className="inspector-tabs">
            <button
              className={tab === "edit" ? "active" : ""}
              onClick={() => setTab("edit")}
            >
              轨道编辑
            </button>
            <button
              className={tab === "stack" ? "active" : ""}
              onClick={() => setTab("stack")}
            >
              叠加核对 {activeCount > 0 && `· ${activeCount}`}
            </button>
            <button
              className={tab === "overflow" ? "active" : ""}
              onClick={() => setTab("overflow")}
            >
              溢出警告 {overflowCount > 0 && `· ${overflowCount}`}
            </button>
          </div>

          {tab === "edit" &&
            (selectedTrack ? (
              <TrackEditForm
                track={selectedTrack}
                scenes={scenes}
                saving={saving}
                onSave={handleEditSave}
                onSimulateConflict={handleSimulateConflict}
              />
            ) : (
              <EmptyState title="选择一条轨道开始编辑" />
            ))}

          {tab === "stack" && (
            <StackingInspector
              frame={currentFrame}
              tracks={tracks}
              scenes={scenes}
              fixtures={fixtures}
            />
          )}

          {tab === "overflow" && <OverflowPanel frame={currentFrame} windows={windows} />}
        </aside>
      </div>

      {conflict && (
        <ConflictDialog
          conflict={conflict}
          onResolve={(mode) => {
            void resolveConflict(mode, conflict, pendingDraftRef.current);
          }}
          onClose={clearConflict}
        />
      )}
    </main>
  );
}
