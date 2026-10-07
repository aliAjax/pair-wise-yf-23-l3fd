import { useState } from "react";
import { useAppSelector } from "../stores/hooks";
import { useTimelinePlayback } from "../hooks/useTimelinePlayback";
import { useReconcileEngine } from "../hooks/useReconcileEngine";
import { StageCanvas } from "../components/common/StageCanvas";
import { TimelineRuler } from "../components/common/TimelineRuler";
import { PlaybackControls } from "../components/common/PlaybackControls";
import { OverflowPanel } from "../components/common/OverflowPanel";
import { ChannelOwnershipTable } from "../components/common/ChannelOwnershipTable";
import { ActiveTrackBar } from "../components/timeline/ActiveTrackBar";
import { RecomputeGateBanner } from "../components/timeline/RecomputeGateBanner";
import { FixtureIcon } from "../components/common/FixtureIcon";
import { formatTimecode } from "../utils/formatters";
import type { ReconciledFrame } from "../types/timeline";

export function PreviewPage() {
  useReconcileEngine();

  const tracks = useAppSelector((state) => state.timelineTrack.rows);
  const scenes = useAppSelector((state) => state.cueScene.rows);
  const fixtures = useAppSelector((state) => state.fixture.rows);
  const frame = useAppSelector((state) => state.playback.frame);
  const recomputing = useAppSelector((state) => state.playback.recomputing);
  const lastComputeMs = useAppSelector((state) => state.playback.lastComputeMs);
  const playback = useTimelinePlayback(tracks);
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);

  const sceneNameById = new Map(scenes.map((scene) => [scene.id, scene.name]));
  const mergedByFixture = new Map((frame?.fixtures ?? []).map((item) => [item.fixtureId, item]));
  const selectedFixture = fixtures.find((fixture) => fixture.id === selectedFixtureId) ?? null;
  const selectedMerged = selectedFixtureId !== null ? mergedByFixture.get(selectedFixtureId) : null;
  const fixtureFrame: ReconciledFrame | null =
    frame && selectedMerged ? { ...frame, fixtures: [selectedMerged] } : null;

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-stage-line pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-stage-gold">preview</p>
          <h1 className="text-2xl font-extrabold text-stage-paper">舞台预览</h1>
          <p className="mt-1 text-xs text-[#9aa595]">按时间播放三层叠加后的灯光；轨道改动时预览立即重算，重算期间播放自动挂起。</p>
        </div>
        <div className="text-right text-xs text-[#9aa595]">
          <strong className="tabular-nums text-stage-paper">{formatTimecode(playback.time_ms)}</strong>
        </div>
      </header>

      <RecomputeGateBanner recomputing={recomputing} lastComputeMs={lastComputeMs} />

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
      <TimelineRuler duration_ms={playback.duration_ms} time_ms={playback.time_ms} onSeek={playback.seek} />

      <div className="rounded-lg border border-stage-line bg-stage-panel p-3">
        <ActiveTrackBar frame={frame} tracks={tracks} scenes={scenes} selectedTrackId={null} onSelectTrack={() => undefined} />
      </div>

      <div className={recomputing ? "pointer-events-none opacity-60" : ""}>
        <StageCanvas
          fixtures={fixtures}
          frame={frame}
          height={420}
          selectedFixtureId={selectedFixtureId}
          onSelectFixture={setSelectedFixtureId}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-stage-line bg-stage-panel p-4">
          <h2 className="mb-2 text-sm font-bold text-stage-paper">灯具输出明细</h2>
          {selectedFixture ? (
            <div className="mb-3 flex items-center gap-3">
              <FixtureIcon fixture={selectedFixture} values={selectedMerged?.values} active size={42} />
              <div className="text-xs text-[#c6cec1]">
                <strong className="text-stage-paper">{selectedFixture.fixture_code}</strong>
                <div>
                  DMX {selectedFixture.dmx_address} - {selectedFixture.dmx_address + selectedFixture.channel_count - 1} ·{" "}
                  {selectedFixture.channel_count} 通道
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-3 text-xs text-[#8a9486]">点击舞台上的灯具，单独核对它此刻每个通道被哪条轨道占用。</p>
          )}
          <ChannelOwnershipTable
            frame={fixtureFrame ?? frame}
            fixtures={fixtures}
            highlightTrackId={null}
          />
        </section>

        <section className="rounded-lg border border-stage-line bg-stage-panel p-4">
          <h2 className="mb-2 text-sm font-bold text-stage-paper">宇宙容量实时核对</h2>
          <OverflowPanel universes={frame?.universes ?? []} sceneNameById={sceneNameById} />
        </section>
      </div>
    </div>
  );
}
