import assert from "node:assert";
import { reconcileFrame, selectActiveTracks, rankContributions } from "../src/services/timelineMerge";
import { mockData } from "../src/mocks/seedData";

console.log("seed tracks:", mockData.timelineTrack.map((t) => ({ id: t.id, layer: t.layer })));
console.log("seed scenes:", mockData.cueScene.map((s) => ({ id: s.id, p: s.priority, st: s.scene_status })));

// t=10000：T1 基础(0-12s) + T2 效果(6-14s) + T3 追光(8-12s)；T5 场景停用应被忽略
const frame = reconcileFrame({
  time_ms: 10000,
  tracks: mockData.timelineTrack,
  scenes: mockData.cueScene,
  fixtures: mockData.fixture
});
console.log("frame active", frame.activeTrackIds);

assert.deepStrictEqual(frame.activeTrackIds, [3, 2, 1]);

// 2) 宇宙 0 溢出：F9(505-524) 把最高地址顶到 524，溢出 12
const u0 = frame.universes.find((u) => u.universe === 0)!;
assert.strictEqual(u0.overflow, true, "t=10s 宇宙0 应溢出");
assert.strictEqual(u0.overflowBy, 12);
assert.strictEqual(u0.highestAddress, 524);

// 3) 归因：三条激活轨道都在贡献者里，F9 所在的 T3 峰值地址最高(524) 排第一
const contributorIds = u0.contributors.map((c) => c.trackId);
assert.deepStrictEqual([...contributorIds].sort(), [1, 2, 3]);
assert.strictEqual(u0.contributors[0].trackId, 3);
assert.strictEqual(u0.contributors[0].peakAddress, 524);
// T1/T2 峰值地址并列 204 时按轨道 id 决胜（确定性）
assert.deepStrictEqual(contributorIds, [3, 1, 2]);

// 4) 通道占用/补位
const f2 = frame.fixtures.find((f) => f.fixtureId === 2)!;
assert.strictEqual(f2.ownership.blue?.trackId, 2);
assert.strictEqual(f2.ownership.blue?.mode, "OCCUPY");
assert.strictEqual(f2.values.red, 0);
assert.strictEqual(f2.ownership.red?.trackId, 2);

// 5) 补位语义：F8 的 dimmer 由追光 T3 占用，颜色 red/green/blue 由基础 T1 补位（FILL）
const f8 = frame.fixtures.find((f) => f.fixtureId === 8)!;
assert.strictEqual(f8.ownership.dimmer?.trackId, 3);
assert.strictEqual(f8.ownership.dimmer?.mode, "OCCUPY");
assert.strictEqual(f8.ownership.red?.trackId, 1);
assert.strictEqual(f8.ownership.red?.mode, "FILL");
assert.strictEqual(f8.ownership.pan?.trackId, 3);
// 补位来的颜色值保留（255），dimmer 是追光的 255
assert.strictEqual(f8.values.red, 255);

// S1 独有的 F6 只被基础层占用
const f6 = frame.fixtures.find((f) => f.fixtureId === 6);
assert.ok(f6);
assert.strictEqual(f6!.ownership.dimmer?.trackId, 1);
assert.strictEqual(f6!.ownership.dimmer?.mode, "OCCUPY");

// 6) t=7000：只有 T1+T2，无追光 F9 -> 不溢出
const frame2 = reconcileFrame({
  time_ms: 7000,
  tracks: mockData.timelineTrack,
  scenes: mockData.cueScene,
  fixtures: mockData.fixture
});
assert.ok(frame2.universes.every((u) => !u.overflow), "t=7s 不应溢出");
assert.ok(!frame2.universes.find((u) => u.universe === 0)?.contributors.some((c) => c.trackId === 3));

// 7) 淡入
const frame3 = reconcileFrame({
  time_ms: 6100,
  tracks: mockData.timelineTrack,
  scenes: mockData.cueScene,
  fixtures: mockData.fixture
});
const f2fade = frame3.fixtures.find((f) => f.fixtureId === 2)!;
assert.ok(f2fade.values.blue !== undefined && f2fade.values.blue >= 80 && f2fade.values.blue <= 90, `fade blue=${f2fade.values.blue}`);

// 8) 停用场景不参与
const active = selectActiveTracks(9500, mockData.timelineTrack, mockData.cueScene).map((a) => a.track.id);
assert.ok(!active.includes(5), "DISABLED 场景 T5 不应激活");

// 9) 排序确定性
const ranked = rankContributions(selectActiveTracks(10000, mockData.timelineTrack, mockData.cueScene));
assert.deepStrictEqual(ranked.map((r) => r.track.id), [3, 2, 1]);

console.log("timelineMerge: all assertions passed");
