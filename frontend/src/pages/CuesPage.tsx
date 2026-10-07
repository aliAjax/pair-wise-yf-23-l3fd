import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../stores/hooks";
import { persistCueScene } from "../stores/CueSceneStore";
import { CueCard } from "../components/common/CueCard";
import { ColorChannelSlider } from "../components/common/ColorChannelSlider";
import { FixtureIcon } from "../components/common/FixtureIcon";
import { StatusBadge } from "../components/common/StatusBadge";
import { CueStatus, CueStatusText } from "../constants/CueStatus";
import type { CueScene } from "../types/CueScene";
import type { ChannelName, FixtureChannelValues } from "../types/timeline";

const STATUS_OPTIONS = CueStatus;

function channelsForMode(colorMode: string): ChannelName[] {
  if (colorMode === "DIMMER_ONLY") return ["dimmer", "strobe"];
  if (colorMode === "RGBW") return ["red", "green", "blue", "white", "dimmer", "strobe"];
  if (colorMode === "MOVING_HEAD") return ["red", "green", "blue", "dimmer", "strobe", "pan", "tilt"];
  return ["red", "green", "blue", "dimmer", "strobe"];
}

export function CuesPage() {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector((state) => state.cueScene.rows);
  const fixtures = useAppSelector((state) => state.fixture.rows);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CueScene | null>(null);

  const visible = scenes.filter((scene) => statusFilter === "ALL" || scene.scene_status === statusFilter);

  useEffect(() => {
    if (selectedId === null && scenes[0]) setSelectedId(scenes[0].id);
  }, [scenes, selectedId]);

  useEffect(() => {
    const scene = scenes.find((item) => item.id === selectedId);
    setDraft(scene ? JSON.parse(JSON.stringify(scene)) : null);
  }, [selectedId, scenes]);

  const fixturesById = useMemo(() => new Map(fixtures.map((fixture) => [fixture.id, fixture])), [fixtures]);

  const updateFixtureChannels = (fixtureId: number, patch: Partial<FixtureChannelValues>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      fixture_states: {
        ...draft.fixture_states,
        [fixtureId]: { ...(draft.fixture_states[fixtureId] ?? {}), ...patch }
      }
    });
  };

  const toggleFixture = (fixtureId: number) => {
    if (!draft) return;
    const next = { ...draft.fixture_states };
    if (next[fixtureId]) delete next[fixtureId];
    else next[fixtureId] = { dimmer: 200 };
    setDraft({ ...draft, fixture_states: next });
  };

  const commit = () => {
    if (draft) dispatch(persistCueScene(draft));
  };

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-stage-line pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-stage-gold">cues</p>
          <h1 className="text-2xl font-extrabold text-stage-paper">场景编辑</h1>
          <p className="mt-1 text-xs text-[#9aa595]">选择灯具、设置各通道颜色亮度与渐变时间；priority 决定同层叠加时谁先占用通道。</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-1 text-[11px] ${
                statusFilter === status ? "border-stage-gold bg-stage-gold text-black" : "border-stage-line text-[#b9c2b3]"
              }`}
            >
              {status === "ALL" ? "全部" : CueStatusText[status as CueStatus]}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="grid content-start gap-2">
          {visible.map((scene) => (
            <CueCard key={scene.id} scene={scene} selected={scene.id === selectedId} onClick={() => setSelectedId(scene.id)} />
          ))}
        </div>

        {draft ? (
          <div className="grid gap-4">
            <section className="rounded-lg border border-stage-line bg-stage-panel p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px_140px]">
                <label className="grid gap-1 text-xs text-[#c6cec1]">场景名称
                  <input className="rounded border border-stage-line bg-black/30 px-2 py-1.5" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </label>
                <label className="grid gap-1 text-xs text-[#c6cec1]">淡入 ms
                  <input type="number" className="rounded border border-stage-line bg-black/30 px-2 py-1.5" value={draft.fade_in_ms} onChange={(e) => setDraft({ ...draft, fade_in_ms: Number(e.target.value) })} />
                </label>
                <label className="grid gap-1 text-xs text-[#c6cec1]">保持 ms
                  <input type="number" className="rounded border border-stage-line bg-black/30 px-2 py-1.5" value={draft.hold_ms} onChange={(e) => setDraft({ ...draft, hold_ms: Number(e.target.value) })} />
                </label>
                <label className="grid gap-1 text-xs text-[#c6cec1]">优先级
                  <input type="number" min={0} max={100} className="rounded border border-stage-line bg-black/30 px-2 py-1.5" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })} />
                </label>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[#c6cec1]">状态：</span>
                {STATUS_OPTIONS.map((status) => (
                  <button key={status} type="button" onClick={() => setDraft({ ...draft, scene_status: status })}>
                    <StatusBadge value={CueStatusText[status]} tone={draft.scene_status === status ? (status === "READY" ? "ready" : status === "DISABLED" ? "disabled" : "draft") : "neutral"} />
                  </button>
                ))}
                <div className="ml-auto">
                  <button type="button" onClick={commit} className="rounded bg-stage-gold px-4 py-1.5 text-xs font-bold text-black">保存场景</button>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-stage-line bg-stage-panel p-4">
              <h2 className="mb-3 text-sm font-bold text-stage-paper">灯具通道（{Object.keys(draft.fixture_states).length}/{fixtures.length} 台灯参与）</h2>
              <div className="grid gap-3">
                {fixtures.map((fixture) => {
                  const included = !!draft.fixture_states[fixture.id];
                  const values = draft.fixture_states[fixture.id] ?? {};
                  return (
                    <div key={fixture.id} className={`rounded-lg border p-3 ${included ? "border-stage-gold/50 bg-black/20" : "border-stage-line opacity-70"}`}>
                      <div className="mb-2 flex items-center gap-3">
                        <input type="checkbox" checked={included} onChange={() => toggleFixture(fixture.id)} className="h-4 w-4 accent-stage-gold" />
                        <FixtureIcon fixture={fixture} values={included ? values : undefined} active={included} />
                        <div className="text-xs">
                          <strong className="text-stage-paper">{fixture.fixture_code}</strong>
                          <div className="text-[#7e8a78]">DMX {fixture.dmx_address} 起 · {fixture.channel_count} 通道</div>
                        </div>
                      </div>
                      {included && (
                        <div className="grid gap-1.5 pl-8">
                          {channelsForMode(fixture.color_mode).map((channel) => (
                            <ColorChannelSlider
                              key={channel}
                              channel={channel}
                              value={values[channel] ?? 0}
                              onChange={(value) => updateFixtureChannels(fixture.id, { [channel]: value })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-stage-line p-8 text-center text-sm text-[#8a9486]">请选择左侧场景</div>
        )}
      </div>
    </div>
  );
}
