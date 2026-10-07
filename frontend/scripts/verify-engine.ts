import { mockData } from "../src/mocks/seedData";
import type { Fixture } from "../src/types/Fixture";
import type { CueScene } from "../src/types/CueScene";
import type { TimelineTrack } from "../src/types/TimelineTrack";
import {
  computeFrame,
  computeTimeline,
  summarizeOverflow,
  diffTracks,
  getFixtureChannels,
  DMX_UNIVERSE_SIZE
} from "../src/utils/playbackEngine";

const fixtures = mockData.fixture as unknown as Fixture[];
const scenes = mockData.cueScene as unknown as CueScene[];
const tracks = mockData.timelineTrack as unknown as TimelineTrack[];

let failures = 0;
function check(name: string, condition: boolean, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!condition) failures++;
}

// --- Scenario at t=16000: tracks 1 (BASE p10), 3 (EFFECT p5), 4 (BASE p1), 5 (SPOT p8) active
const frame16 = computeFrame(tracks, scenes, fixtures, 16000);
check("t=16000 active tracks are 1,3,4,5",
  JSON.stringify(frame16.active_track_ids) === "[1,3,4,5]",
  `got ${frame16.active_track_ids}`);

const overflow16 = Object.values(frame16.universes).filter((u) => u.overflow);
check("t=16000 universe 1 overflows",
  overflow16.length === 1 && overflow16[0].universe === 1,
  `overflows: ${overflow16.map((u) => `u${u.universe} ${u.used_channels}`).join(", ")}`);
check("t=16000 DMX load = 520", overflow16[0]?.used_channels === 520,
  `got ${overflow16[0]?.used_channels}`);
check("t=16000 overflow channels = 8", overflow16[0]?.overflow_channels === 8,
  `got ${overflow16[0]?.overflow_channels}`);

const contributors16 = overflow16[0]?.contributors ?? [];
check("t=16000 contributors are tracks 1,3,4,5",
  JSON.stringify(contributors16.map((c) => c.track_id).sort()) === "[1,3,4,5]",
  `got ${contributors16.map((c) => c.track_id)}`);
const track4 = contributors16.find((c) => c.track_id === 4);
check("track 4 pushes past 512", track4?.pushes_over_512 === true,
  `pushes=${track4?.pushes_over_512}`);
check("track 4 brings 520 channels", track4?.channel_count === 520,
  `got ${track4?.channel_count}`);
// Every authored channel key is either won or blocked; compute the authored-key total.
const scene4 = scenes.find((s) => s.id === 2)!;
let authoredKeys4 = 0;
for (const [fixtureIdText, state] of Object.entries(scene4.fixture_states)) {
  const fixture = fixtures.find((f) => f.id === Number(fixtureIdText))!;
  for (const key of getFixtureChannels(fixture)) {
    if ((state as Record<string, unknown>)[key] !== undefined) authoredKeys4++;
  }
}
check("track 4 channels all won or blocked",
  (track4?.controls ?? 0) + (track4?.blocked ?? 0) === authoredKeys4,
  `controls=${track4?.controls} blocked=${track4?.blocked} authored=${authoredKeys4}`);
check("track 4 is mostly blocked (lowest priority BASE p1)",
  (track4?.blocked ?? 0) > (track4?.controls ?? 0),
  `controls=${track4?.controls} blocked=${track4?.blocked}`);

// --- Arbitration: fixture 1 (SPOT wins), fixture 20 (EFFECT beats BASE), fixture 81 (track 4 fills)
const f1 = frame16.fixtures[1].channels;
check("fixture 1 dimmer won by SPOT track 5", f1.dimmer.winner?.track_id === 5,
  `winner=${f1.dimmer.winner?.track_id}`);
check("fixture 1 dimmer at full (255)", f1.dimmer.value === 255, `got ${f1.dimmer.value}`);

const f20 = frame16.fixtures[20].channels;
check("fixture 20 dimmer won by EFFECT track 3 (layer priority beats BASE)",
  f20.dimmer.winner?.track_id === 3, `winner=${f20.dimmer.winner?.track_id}`);
check("fixture 20 dimmer value 200 (effect scene)", f20.dimmer.value === 200,
  `got ${f20.dimmer.value}`);

const f81 = frame16.fixtures[81].channels;
check("fixture 81 dimmer filled by track 4 (only author)", f81.dimmer.winner?.track_id === 4,
  `winner=${f81.dimmer.winner?.track_id}`);
check("fixture 81 dimmer value 130 (scene 2)", f81.dimmer.value === 130,
  `got ${f81.dimmer.value}`);

// --- Scenario at t=10000: tracks 1,2,3 active, no overflow
const frame10 = computeFrame(tracks, scenes, fixtures, 10000);
const overflow10 = Object.values(frame10.universes).filter((u) => u.overflow);
check("t=10000 no overflow", overflow10.length === 0,
  `overflows: ${overflow10.map((u) => `u${u.universe} ${u.used_channels}`).join(", ")}`);
check("t=10000 active tracks are 1,2,3",
  JSON.stringify(frame10.active_track_ids) === "[1,2,3]",
  `got ${frame10.active_track_ids}`);

// --- Scenario at t=23000: tracks 4,5 active -> overflow
const frame23 = computeFrame(tracks, scenes, fixtures, 23000);
check("t=23000 active tracks are 4,5",
  JSON.stringify(frame23.active_track_ids) === "[4,5]",
  `got ${frame23.active_track_ids}`);
check("t=23000 universe 1 overflows with track 4 load",
  Object.values(frame23.universes).some((u) => u.overflow && u.used_channels === 520),
  `used=${Object.values(frame23.universes).map((u) => u.used_channels).join(",")}`);

// --- Overflow windows across timeline
const frames = computeTimeline(tracks, scenes, fixtures, 1000);
const windows = summarizeOverflow(frames);
check("overflow window exists for universe 1", windows.some((w) => w.universe === 1),
  `windows: ${windows.map((w) => `u${w.universe} ${w.start_ms}-${w.end_ms}`).join(", ")}`);
const window1 = windows.find((w) => w.universe === 1);
check("overflow window starts at 12000 (track 4 in)", window1?.start_ms === 12000,
  `start=${window1?.start_ms}`);
check("overflow window ends at 25000 (last frame with track 4)", window1?.end_ms === 25000,
  `end=${window1?.end_ms}`);
check("overflow window peak = 8 channels", window1?.max_overflow_channels === 8,
  `peak=${window1?.max_overflow_channels}`);
check("overflow window contributors include track 4",
  window1?.contributor_track_ids.includes(4) === true,
  `contributors=${window1?.contributor_track_ids}`);

// --- Conflict diff
const serverTrack = { ...tracks[0], version: 2, duration_ms: 18000, updated_by: "另一位灯光师" };
const yourTrack = { ...tracks[0], version: 1, duration_ms: 22000 };
const diffs = diffTracks(serverTrack, yourTrack);
check("conflict diff detects duration change",
  diffs.some((d) => d.field === "duration_ms" && d.yours === 22000 && d.server === 18000),
  `diffs=${JSON.stringify(diffs)}`);
check("conflict diff ignores version/updated_by",
  !diffs.some((d) => d.field === "version"),
  `fields=${diffs.map((d) => d.field).join(",")}`);

// --- DMX constant
check("DMX universe size is 512", DMX_UNIVERSE_SIZE === 512, `got ${DMX_UNIVERSE_SIZE}`);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
