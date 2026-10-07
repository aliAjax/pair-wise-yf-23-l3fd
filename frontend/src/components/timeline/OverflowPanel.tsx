import type { FrameSnapshot } from "../../types/Playback";
import type { OverflowWindow } from "../../utils/playbackEngine";
import { DMX_UNIVERSE_SIZE } from "../../utils/playbackEngine";
import { LAYER_COLOR, LAYER_TEXT } from "../../constants/layers";
import { formatDuration } from "../../utils/formatters";

interface OverflowPanelProps {
  frame: FrameSnapshot | undefined;
  windows: OverflowWindow[];
}

/**
 * 宇宙溢出核对：当前时刻哪个宇宙超过 512、超了多少，
 * 以及是哪几条轨道把容量顶上去的；附整段时间线上的溢出窗口。
 */
export function OverflowPanel({ frame, windows }: OverflowPanelProps) {
  const currentOverflows = frame
    ? Object.values(frame.universes).filter((universe) => universe.overflow)
    : [];

  return (
    <div className="overflow-panel">
      <p className="inspector-hint">
        DMX 每个宇宙固定 {DMX_UNIVERSE_SIZE} 通道。多轨道叠加时按通道并集清点，超过
        {DMX_UNIVERSE_SIZE} 即标出溢出，并列出顶起容量的轨道。
      </p>

      <h3 className="overflow-section-title">当前时刻溢出</h3>
      {currentOverflows.length === 0 && (
        <div className="empty">
          {frame ? "当前时刻没有宇宙溢出" : "暂无预览帧"}
        </div>
      )}
      {currentOverflows.map((universe) => (
        <div key={universe.universe} className="overflow-card">
          <div className="overflow-card-head">
            <strong>宇宙 {universe.universe}</strong>
            <span className="overflow-count">
              {universe.used_channels} / {DMX_UNIVERSE_SIZE}
            </span>
            <span className="overflow-badge">超出 {universe.overflow_channels} 通道</span>
          </div>
          <div className="overflow-contributors">
            {universe.contributors.map((contributor) => (
              <div
                key={contributor.track_id}
                className={"overflow-contributor" + (contributor.pushes_over_512 ? " pushes" : "")}
              >
                <span
                  className="layer-badge"
                  style={{ background: LAYER_COLOR[contributor.layer] }}
                >
                  {LAYER_TEXT[contributor.layer]}
                </span>
                <span className="overflow-contributor-name">
                  轨道 #{contributor.track_id} · {contributor.scene_name}
                </span>
                <span className="overflow-contributor-channels">
                  带来 {contributor.channel_count} 通道
                  （裁定 {contributor.controls} / 被压 {contributor.blocked}）
                </span>
                {contributor.pushes_over_512 && (
                  <em className="overflow-push-tag">顶过 512</em>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <h3 className="overflow-section-title">整段溢出窗口</h3>
      {windows.length === 0 && <div className="empty">时间线上没有溢出窗口</div>}
      {windows.map((window) => (
        <div key={`${window.universe}-${window.start_ms}`} className="overflow-window">
          <strong>宇宙 {window.universe}</strong>
          <span>
            {formatDuration(window.start_ms)} – {formatDuration(window.end_ms)}
          </span>
          <span>峰值超出 {window.max_overflow_channels} 通道</span>
          <span className="overflow-window-tracks">
            参与轨道 {window.contributor_track_ids.map((id) => `#${id}`).join("、")}
          </span>
        </div>
      ))}
    </div>
  );
}
