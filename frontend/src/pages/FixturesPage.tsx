import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../stores/hooks";
import { persistFixture } from "../stores/FixtureStore";
import { useDmxAddressCheck } from "../hooks/useDmxAddressCheck";
import { FixtureIcon } from "../components/common/FixtureIcon";
import { StatusBadge } from "../components/common/StatusBadge";
import { FixtureType, FixtureTypeText, type FixtureType as FixtureTypeValue } from "../constants/FixtureType";
import { ChannelMode, ChannelModeText } from "../constants/ChannelMode";
import type { Fixture } from "../types/Fixture";

export function FixturesPage() {
  const dispatch = useAppDispatch();
  const fixtures = useAppSelector((state) => state.fixture.rows);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Fixture | null>(null);
  const { issues } = useDmxAddressCheck(fixtures);
  const issueByFixture = new Map<number, string>();
  issues.forEach((issue) => {
    if (!issueByFixture.has(issue.fixtureId)) issueByFixture.set(issue.fixtureId, issue.message);
  });

  const visible = fixtures.filter((fixture) => typeFilter === "ALL" || fixture.fixture_type === typeFilter);

  const startEdit = (fixture: Fixture) => {
    setDraftId(fixture.id);
    setDraft({ ...fixture });
  };

  const commit = () => {
    if (draft) {
      dispatch(persistFixture(draft));
      setDraftId(null);
      setDraft(null);
    }
  };

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-stage-line pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-stage-gold">fixtures</p>
          <h1 className="text-2xl font-extrabold text-stage-paper">灯具布置</h1>
          <p className="mt-1 text-xs text-[#9aa595]">平面图坐标、DMX 起始地址与通道数；地址重叠或越过 512 时即时标出。</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", ...FixtureType].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`rounded-full border px-3 py-1 text-[11px] ${
                typeFilter === type
                  ? "border-stage-gold bg-stage-gold text-black"
                  : "border-stage-line text-[#b9c2b3] hover:border-stage-gold/60"
              }`}
            >
              {type === "ALL" ? "全部" : FixtureTypeText[type as FixtureTypeValue]}
            </button>
          ))}
        </div>
      </header>

      {issues.length > 0 && (
        <div className="rounded-lg border border-amber-700 bg-amber-950/30 p-3 text-xs text-amber-200">
          <strong>DMX 地址问题 {issues.length} 项：</strong>
          <ul className="mt-1 list-disc pl-5">
            {issues.map((issue, index) => (
              <li key={`${issue.fixtureId}-${index}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative min-h-[300px] overflow-hidden rounded-lg border border-stage-line" style={{ background: "radial-gradient(ellipse at 50% 35%, #202b1f 0%, #0e130e 75%)" }}>
        <span className="absolute left-3 top-2 text-[10px] font-bold tracking-widest text-[#5f6b5b]">FLOOR PLAN</span>
        {visible.map((fixture) => (
          <button
            key={fixture.id}
            type="button"
            onClick={() => startEdit(fixture)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${fixture.position_x}%`, top: `${fixture.position_y}%` }}
          >
            <FixtureIcon fixture={fixture} active={draftId === fixture.id} />
            <span className="mt-1 rounded bg-black/50 px-1 text-[9px] text-[#aeb7a9]">{fixture.fixture_code}</span>
            <span className={`text-[9px] ${issueByFixture.has(fixture.id) ? "font-bold text-amber-300" : "text-[#6f7a6b]"}`}>
              {fixture.dmx_address}-{fixture.dmx_address + fixture.channel_count - 1}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-stage-line">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#223126] text-[#9aa595]">
            <tr>
              <th className="px-3 py-2">编号</th>
              <th className="px-3 py-2">类型</th>
              <th className="px-3 py-2">颜色模式</th>
              <th className="px-3 py-2 text-right">DMX 地址</th>
              <th className="px-3 py-2 text-right">通道数</th>
              <th className="px-3 py-2">地址检查</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map((fixture) => (
              <tr key={fixture.id} className="border-t border-stage-line/60 text-[#c6cec1]">
                <td className="px-3 py-2 font-bold text-stage-paper">{fixture.fixture_code}</td>
                <td className="px-3 py-2">{FixtureTypeText[fixture.fixture_type]}</td>
                <td className="px-3 py-2">{ChannelModeText[fixture.color_mode]}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fixture.dmx_address}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fixture.channel_count}</td>
                <td className="px-3 py-2">
                  {issueByFixture.has(fixture.id) ? (
                    <StatusBadge value="地址冲突" tone="warning" title={issueByFixture.get(fixture.id)} />
                  ) : (
                    <StatusBadge value="正常" tone="ready" />
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => startEdit(fixture)}
                    className="rounded border border-stage-line px-2 py-1 text-[11px] hover:border-stage-gold"
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDraftId(null)}>
          <div className="w-full max-w-lg rounded-xl border border-stage-line bg-stage-panel p-5" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-4 text-base font-bold text-stage-paper">编辑灯具 {draft.fixture_code}</h2>
            <div className="grid grid-cols-2 gap-3 text-xs text-[#c6cec1]">
              <label className="grid gap-1">编号<input className="rounded border border-stage-line bg-black/30 px-2 py-1" value={draft.fixture_code} onChange={(e) => setDraft({ ...draft, fixture_code: e.target.value })} /></label>
              <label className="grid gap-1">类型
                <select className="rounded border border-stage-line bg-black/30 px-2 py-1" value={draft.fixture_type} onChange={(e) => setDraft({ ...draft, fixture_type: e.target.value as Fixture["fixture_type"] })}>
                  {FixtureType.map((type) => <option key={type} value={type}>{FixtureTypeText[type]}</option>)}
                </select>
              </label>
              <label className="grid gap-1">DMX 起始地址<input type="number" min={1} max={512} className="rounded border border-stage-line bg-black/30 px-2 py-1" value={draft.dmx_address} onChange={(e) => setDraft({ ...draft, dmx_address: Number(e.target.value) })} /></label>
              <label className="grid gap-1">通道数<input type="number" min={1} max={512} className="rounded border border-stage-line bg-black/30 px-2 py-1" value={draft.channel_count} onChange={(e) => setDraft({ ...draft, channel_count: Number(e.target.value) })} /></label>
              <label className="grid gap-1">X 坐标%<input type="number" min={0} max={100} className="rounded border border-stage-line bg-black/30 px-2 py-1" value={draft.position_x} onChange={(e) => setDraft({ ...draft, position_x: Number(e.target.value) })} /></label>
              <label className="grid gap-1">Y 坐标%<input type="number" min={0} max={100} className="rounded border border-stage-line bg-black/30 px-2 py-1" value={draft.position_y} onChange={(e) => setDraft({ ...draft, position_y: Number(e.target.value) })} /></label>
              <label className="grid gap-1">颜色模式
                <select className="rounded border border-stage-line bg-black/30 px-2 py-1" value={draft.color_mode} onChange={(e) => setDraft({ ...draft, color_mode: e.target.value as Fixture["color_mode"] })}>
                  {ChannelMode.map((mode) => <option key={mode} value={mode}>{ChannelModeText[mode]}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDraftId(null)} className="rounded border border-stage-line px-4 py-1.5 text-xs">取消</button>
              <button type="button" onClick={commit} className="rounded bg-stage-gold px-4 py-1.5 text-xs font-bold text-black">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
