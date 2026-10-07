import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { ShowProject } from "../types/ShowProject";

/**
 * 本地模拟数据（禁止接入第三方 API）。
 *
 * 关键编排：T1(基础层) / T2(效果层) / T3(追光层) 在 8s-12s 叠加，
 * 追光场景 S3 驱动的 F9 起始地址 505、占 20 通道（505-524），
 * 三层同时生效时宇宙 0 超过 512，溢出 12 通道，用于核对溢出归因。
 */
export const fixture: Fixture[] = [
  { id: 1, fixture_code: "PAR-01", fixture_type: "PAR", position_x: 18, position_y: 30, dmx_address: 1, channel_count: 3, color_mode: "RGB" },
  { id: 2, fixture_code: "WASH-01", fixture_type: "WASH", position_x: 38, position_y: 22, dmx_address: 11, channel_count: 4, color_mode: "RGBW" },
  { id: 3, fixture_code: "MH-01", fixture_type: "SPOT", position_x: 50, position_y: 12, dmx_address: 21, channel_count: 8, color_mode: "MOVING_HEAD" },
  { id: 4, fixture_code: "BEAM-01", fixture_type: "BEAM", position_x: 62, position_y: 22, dmx_address: 41, channel_count: 6, color_mode: "MOVING_HEAD" },
  { id: 5, fixture_code: "STB-01", fixture_type: "STROBE", position_x: 82, position_y: 30, dmx_address: 61, channel_count: 2, color_mode: "DIMMER_ONLY" },
  { id: 6, fixture_code: "PAR-02", fixture_type: "PAR", position_x: 30, position_y: 62, dmx_address: 101, channel_count: 3, color_mode: "RGB" },
  { id: 7, fixture_code: "WASH-02", fixture_type: "WASH", position_x: 70, position_y: 62, dmx_address: 201, channel_count: 4, color_mode: "RGBW" },
  { id: 8, fixture_code: "MH-02", fixture_type: "SPOT", position_x: 50, position_y: 78, dmx_address: 301, channel_count: 8, color_mode: "MOVING_HEAD" },
  // 追光专用灯：地址段 505-524，随追光层出现时把宇宙容量顶破 512
  { id: 9, fixture_code: "FS-PROBE", fixture_type: "SPOT", position_x: 50, position_y: 45, dmx_address: 505, channel_count: 20, color_mode: "MOVING_HEAD" }
];

export const cueScene: CueScene[] = [
  {
    id: 1,
    name: "全场暖光",
    fixture_states: {
      1: { red: 255, green: 180, blue: 60, dimmer: 220 },
      2: { red: 255, green: 170, blue: 50, white: 40, dimmer: 210 },
      5: { dimmer: 120, strobe: 0 },
      6: { red: 255, green: 190, blue: 80, dimmer: 200 },
      7: { red: 250, green: 160, blue: 40, white: 30, dimmer: 190 },
      // F8 的颜色只在基础层定义：追光层只占 dimmer/pan/tilt，颜色通道由基础层补位
      8: { red: 255, green: 210, blue: 120, dimmer: 160 }
    },
    fade_in_ms: 800,
    hold_ms: 12000,
    priority: 40,
    scene_status: "READY"
  },
  {
    id: 2,
    name: "蓝色频闪效果",
    fixture_states: {
      2: { red: 0, green: 40, blue: 255, white: 0, dimmer: 255 },
      4: { red: 0, green: 60, blue: 255, dimmer: 255, strobe: 180 },
      7: { red: 0, green: 20, blue: 255, white: 0, dimmer: 240 }
    },
    fade_in_ms: 300,
    hold_ms: 8000,
    priority: 60,
    scene_status: "READY"
  },
  {
    id: 3,
    name: "主角追光",
    fixture_states: {
      3: { red: 255, green: 255, blue: 240, dimmer: 255, pan: 128, tilt: 90 },
      // F8 追光只占用 dimmer/pan/tilt；red/green/blue 留给基础层补位
      8: { dimmer: 255, pan: 140, tilt: 110 },
      9: { red: 255, green: 255, blue: 255, dimmer: 255, pan: 128, tilt: 128, strobe: 0 }
    },
    fade_in_ms: 200,
    hold_ms: 4000,
    priority: 80,
    scene_status: "READY"
  },
  {
    id: 4,
    name: "暗转收束",
    fixture_states: {
      1: { dimmer: 0 },
      2: { dimmer: 0 },
      5: { dimmer: 0 },
      6: { dimmer: 0 },
      7: { dimmer: 0 }
    },
    fade_in_ms: 1500,
    hold_ms: 3000,
    priority: 30,
    scene_status: "READY"
  },
  {
    id: 5,
    name: "已停用-红色警报",
    fixture_states: {
      1: { red: 255, green: 0, blue: 0, dimmer: 255 }
    },
    fade_in_ms: 100,
    hold_ms: 2000,
    priority: 90,
    scene_status: "DISABLED"
  }
];

export const timelineTrack: TimelineTrack[] = [
  { id: 1, cue_scene_id: 1, start_ms: 0, duration_ms: 12000, layer: "BASE", locked: false, version: 3, updated_at: "2026-10-06T20:10:00Z", updated_by: "灯光师-阿玲" },
  { id: 2, cue_scene_id: 2, start_ms: 6000, duration_ms: 8000, layer: "EFFECT", locked: false, version: 1, updated_at: "2026-10-06T20:12:00Z", updated_by: "灯光师-阿杰" },
  { id: 3, cue_scene_id: 3, start_ms: 8000, duration_ms: 4000, layer: "FOLLOW_SPOT", locked: false, version: 2, updated_at: "2026-10-06T20:15:00Z", updated_by: "灯光师-阿玲" },
  { id: 4, cue_scene_id: 4, start_ms: 14000, duration_ms: 3000, layer: "BASE", locked: true, version: 1, updated_at: "2026-10-06T20:18:00Z", updated_by: "灯光师-阿杰" },
  { id: 5, cue_scene_id: 5, start_ms: 9000, duration_ms: 2000, layer: "EFFECT", locked: false, version: 1, updated_at: "2026-10-06T20:20:00Z", updated_by: "灯光师-阿杰" }
];

export const showProject: ShowProject[] = [
  {
    id: 1,
    title: "开幕演出《夜航》",
    venue_name: "港湾大剧院 · 主舞台",
    fixture_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    track_ids: [1, 2, 3, 4, 5],
    updated_at: "2026-10-06T20:20:00Z"
  }
];

export const mockData = { fixture, cueScene, timelineTrack, showProject } as const;
