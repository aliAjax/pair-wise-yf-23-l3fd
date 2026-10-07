import { useMemo } from "react";
import type { TimelineTrack } from "../../types/TimelineTrack";
import type { CueScene } from "../../types/CueScene";
import type { Fixture } from "../../types/Fixture";
import type { FrameSnapshot } from "../../types/Playback";
import { LAYER_COLOR, LAYER_TEXT } from "../../constants/layers";
import {
  activeTracksAt,
  describeWinner,
  getFixtureChannels,
  rankTracks
} from "../../utils/playbackEngine";
import { formatDuration } from "../../utils/formatters";

interface StackingInspectorProps {
  frame: FrameSnapshot | undefined;
  tracks: TimelineTrack[];
  scenes: CueScene[];
  fixtures: Fixture[];
}

const CHANNEL_LABEL: Record<string, string> = {
  dimmer: "调光",
  r: "红",
  g: "绿",
  b: "蓝",
  w: "白",
  pan: "水平",
  tilt: "垂直"
};

/**
 * 叠加核对：列出当前时刻真正生效的轨道（按压层/场景优先级排序），
 * 并逐通道展示最终值由谁裁定、谁被压在下面。
 */
export function StackingInspector({ frame, tracks, scenes, fixtures }: StackingInspectorProps) {
  const timeMs = frame?.time_ms ?? 0;
  const ranked = useMemo(
    () => rankTracks(activeTracksAt(tracks, timeMs), scenes),
    [tracks, scenes, timeMs]
  );

  const trackStats = useMemo(() => {
    const controls = new Map<number, number>();
    const blocked = new Map<number, number>();
    if (frame) {
      for (const fixtureFrame of Object.values(frame.fixtures)) {
        for (const channelFrame of Object.values(fixtureFrame.channels)) {
          if (channelFrame.winner) {
            controls.set(channelFrame.winner.track_id, (controls.get(channelFrame.winner.track_id) ?? 0) + 1);
          }
          if (channelFrame.blocked_by) {
            blocked.set(channelFrame.blocked_by.track_id, (blocked.get(channelFrame.blocked_by.track_id) ?? 0) + 1);
          }
        }
      }
    }
    return { controls, blocked };
  }, [frame]);

  if (!frame) {
    return <div className="empty">暂无预览帧，轨道改动后将自动重算</div>;
  }

  const fixturesWithAction = fixtures.filter((fixture) => {
    const channels = frame.fixtures[fixture.id]?.channels;
    return channels && Object.values(channels).some((channel) => channel.winner || channel.blocked_by);
  });

  return (
    <div className="stacking-inspector">
      <p className="inspector-hint">
        当前时刻 <strong>{formatDuration(timeMs)}</strong>，{ranked.length} 条轨道叠加生效。
        按压层优先级（追光 &gt; 效果 &gt; 基础）、同层按场景优先级裁定通道，低优先级只补空通道。
      </p>

      <div className="stack-rank">
        {ranked.length === 0 && <div className="empty">当前时刻没有轨道生效</div>}
        {ranked.map(({ track, scene }, index) => (
          <div key={track.id} className="stack-rank-row">
            <span className="stack-rank-index">{index + 1}</span>
            <span className="layer-badge" style={{ background: LAYER_COLOR[track.layer] }}>
              {LAYER_TEXT[track.layer]}
            </span>
            <span className="stack-rank-name">{scene.name}</span>
            <span className="stack-rank-priority">场景优先级 {scene.priority}</span>
            <span className="stack-rank-flags">
              <em className="flag controls">裁定 {trackStats.controls.get(track.id) ?? 0}</em>
              <em className="flag blocked">被压 {trackStats.blocked.get(track.id) ?? 0}</em>
            </span>
          </div>
        ))}
      </div>

      <div className="channel-arbitration">
        {fixturesWithAction.length === 0 && <div className="empty">没有通道被占用</div>}
        {fixturesWithAction.slice(0, 24).map((fixture) => {
          const channels = frame.fixtures[fixture.id]?.channels ?? {};
          return (
            <div key={fixture.id} className="channel-fixture">
              <div className="channel-fixture-title">
                {fixture.fixture_code}
                <span className="channel-fixture-mode">{fixture.color_mode}</span>
              </div>
              <div className="channel-row">
                {getFixtureChannels(fixture).map((key) => {
                  const channel = channels[key];
                  if (!channel) return null;
                  return (
                    <div
                      key={key}
                      className={"channel-cell" + (channel.winner ? " occupied" : "") + (channel.blocked_by ? " blocked" : "")}
                      title={
                        channel.winner
                          ? describeWinner(channel.winner) +
                            (channel.blocked_by ? `（被 ${describeWinner(channel.blocked_by)} 压制）` : "")
                          : "未占用，低优先级轨道可补"
                      }
                    >
                      <span className="channel-key">{CHANNEL_LABEL[key] ?? key}</span>
                      <span className="channel-value">{channel.value}</span>
                      <span className="channel-winner">
                        {channel.winner ? `#${channel.winner.track_id}` : "空"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
