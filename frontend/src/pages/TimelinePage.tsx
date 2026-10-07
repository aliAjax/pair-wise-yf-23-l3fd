import { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../stores/hooks";
import { clearSaveFeedback, saveTrack } from "../stores/TimelineTrackStore";
import { useTimelinePlayback } from "../hooks/useTimelinePlayback";
import { useReconcileEngine } from "../hooks/useReconcileEngine";
import { TimelineRuler } from "../components/common/TimelineRuler";
import { PlaybackControls } from "../components/common/PlaybackControls";
import { StageCanvas } from "../components/common/StageCanvas";
import { OverflowPanel } from "../components/common/OverflowPanel";
import { ChannelOwnershipTable } from "../components/common/ChannelOwnershipTable";
import { TrackLanes } from "../components/timeline/TrackLanes";
import { TrackInspector, type TrackDraft } from "../components/timeline/TrackInspector";
import { ConcurrencySimulator, type ConcurrentDraft } from "../components/timeline/ConcurrencySimulator";
import { ConflictPanel } from "../components/timeline/ConflictPanel";
import { ActiveTrackBar } from "../components/timeline/ActiveTrackBar";
import { RecomputeGateBanner } from "../components/timeline/RecomputeGateBanner";
import { formatTimecode } from "../utils/formatters";
import type { TimelineTrack } from "../types/TimelineTrack";

export function TimelinePage() {
  // 全页的重算引擎：轨道一改动，舞台预览立刻重算
  useReconcileEngine();

  const dispatch = useAppDispatch();
  const tracks = useAppSelector((state) => state.timelineTrack.rows);
  const scenes = useAppSelector((state) => state.cueScene.rows);
  const fixtures = useAppSelector((state) => state.fixture.rows);
  const saving = useAppSelector((state) => state.timelineTrack.saving);
  const lastFailure = useAppSelector((state) => state.timelineTrack.lastFailure);
  const lastSaved = useAppSelector((state) => state.timelineTrack.lastSaved);
  const frame = useAppSelector((state) => state.playback.frame);
  const recomputing = useAppSelector((state) => state.playback.recomputing);
  const lastComputeMs = useAppSelector((state) => state.playback.lastComputeMs);

  const playback = useTimelinePlayback(tracks);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) ?? null,
    [tracks, selectedTrackId]
  );
  const sceneNameById = useMemo(() => new Map(scenes.map((scene) => [scene.id, scene.name])), [scenes]);
  const universes = frame?.universes ?? [];
  const hasOverflow = universes.some((usage) => usage.overflow);

  const persistDraft = useCallback(
    (draft: TrackDraft, editor = "灯光师-阿玲", force = false) => {
      if (!selectedTrack) return;
      dispatch(
        saveTrack({
          force,
          edit: {
            id: selectedTrack.id,
            start_ms: draft.start_ms,
            duration_ms: draft.duration_ms,
            layer: draft.layer,
            locked: draft.locked,
            cue_scene_id: draft.cue_scene_id,
            base_version: selectedTrack.version,
            editor
          }
        })
      );
    },
    [dispatch, selectedTrack]
  );

  const persistConcurrent = useCallback(
    (concurrent: ConcurrentDraft, force = false) => {
      if (!selectedTrack) return;
      dispatch(
        saveTrack({
          force,
          edit: {
            id: selectedTrack.id,
            duration_ms: concurrent.duration_ms,
            base_version: concurrent.baseVersion,
            editor: concurrent.editor
          }
        })
      );
    },
    [dispatch, selectedTrack]
  );

  const toggleLockFor = useCallback(
    (track: TimelineTrack) => {
      dispatch(
        saveTrack({
          edit: {
            id: track.id,
            locked: !track.locked,
            base_version: track.version,
            editor: track.updated_by || "灯光师-阿玲"
          }
        })
      );
    },
    [dispatch]
  );

  const toggleLock = useCallback(() => {
    if (!selectedTrack) return;
    toggleLockFor(selectedTrack);
  }, [selectedTrack, toggleLockFor]);

  const forceOverwrite = useCallback(() => {
    if (!lastFailure?.conflict) return;
    dispatch(saveTrack({ force: true, edit: { ...lastFailure.conflict.attempted } }));
  }, [dispatch, lastFailure]);

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-stage-line pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-stage-gold">timeline</p>
          <h1 className="text-2xl font-extrabold text-stage-paper">时间轴编排 · 叠加核对</h1>
          <p className="mt-1 text-xs text-[#9aa595]">
            基础层 / 效果层 / 追光层同一时刻一起生效时，按压层与场景优先级裁决最终通道值，低优先级只补未占用通道。
          </p>
        </div>
        <div className="text-right text-xs text-[#9aa595]">
          <div>当前时刻 <strong className="tabular-nums text-stage-paper">{formatTimecode(playback.time_ms)}</strong></div>
          <div>{tracks.length} 条轨道 · {fixtures.length} 台灯</div>
        </div>
      </header>

      <RecomputeGateBanner recomputing={recomputing} lastComputeMs={lastComputeMs} />
      {lastFailure && (
        <ConflictPanel
          failure={lastFailure}
          editor={lastFailure.conflict?.attempted.editor ?? ""}
          busy={saving}
          onForceOverwrite={forceOverwrite}
          onReread={() => dispatch(clearSaveFeedback())}
        />
      )}
      {lastSaved && !lastFailure && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-xs text-emerald-300">
          轨道 {lastSaved.id} 已保存，生效版本 v{lastSaved.version}。
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-4">
          <div className="grid gap-3">
            <PlaybackControls
              time_ms={playback.time_ms}
              duration_ms={playback.duration_ms}
              playing={playback.playing}
              recomputing={recomputing}
              onPlay={playback.play}
              onPause={playback.pause}
              onStop={playback.stop}
              onSeek={playback.seek}
            />
            <TimelineRuler
              duration_ms={playback.duration_ms}
              time_ms={playback.time_ms}
              onSeek={playback.seek}
            />
            <TrackLanes
              tracks={tracks}
              scenes={scenes}
              duration_ms={playback.duration_ms}
              selectedTrackId={selectedTrackId}
              onSelect={setSelectedTrackId}
              onToggleLock={(track) => {
                setSelectedTrackId(track.id);
                toggleLockFor(track);
              }}
            />
            <div className="mt-1 rounded-lg border border-stage-line bg-stage-panel p-3">
              <ActiveTrackBar
                frame={frame}
                tracks={tracks}
                scenes={scenes}
                selectedTrackId={selectedTrackId}
                onSelectTrack={setSelectedTrackId}
              />
            </div>
          </div>

          <section className="grid gap-2">
            <h2 className="text-sm font-bold text-stage-paper">舞台预览（随轨道改动即时重算）</h2>
            <div className={recomputing ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
              <StageCanvas fixtures={fixtures} frame={frame} selectedFixtureId={null} />
            </div>
          </section>
        </div>

        <aside className="grid min-w-0 gap-4 content-start">
          <TrackInspector
            track={selectedTrack}
            scenes={scenes}
            saving={saving}
            onSave={(draft) => persistDraft(draft)}
            onToggleLock={toggleLock}
          />
          <ConcurrencySimulator track={selectedTrack} saving={saving} onSave={persistConcurrent} />

          <section className="grid gap-2 rounded-lg border border-stage-line bg-stage-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stage-paper">DMX 宇宙容量</h2>
              {hasOverflow ? (
                <span className="rounded-full border border-red-700 bg-red-950/70 px-2 py-0.5 text-[11px] font-bold text-red-300">
                  超过 512 · 溢出
                </span>
              ) : (
                <span className="rounded-full border border-emerald-700 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  容量内
                </span>
              )}
            </div>
            <OverflowPanel universes={universes} sceneNameById={sceneNameById} />
          </section>
        </aside>
      </div>

      <section className="grid gap-2">
        <h2 className="text-sm font-bold text-stage-paper">最终通道值与归属表</h2>
        <p className="text-xs text-[#7e8a78]">
          “占用”=高优先级轨道拿到该通道；“补位”=低优先级轨道补上没被占用的通道；被抢走的通道不会出现在低优先级行。
        </p>
        <ChannelOwnershipTable frame={frame} fixtures={fixtures} highlightTrackId={selectedTrackId} />
      </section>
    </div>
  );
}
