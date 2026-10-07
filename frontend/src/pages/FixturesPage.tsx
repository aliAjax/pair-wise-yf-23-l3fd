import { useEffect } from "react";
import { useFixtureStore } from "../stores/FixtureStore";
import { useDmxAddressCheck } from "../hooks/useDmxAddressCheck";
import { FixtureIcon } from "../components/common/FixtureIcon";
import { StatusBadge } from "../components/common/StatusBadge";

export function FixturesPage() {
  const fixtures = useFixtureStore((state) => state.rows);
  const loading = useFixtureStore((state) => state.loading);
  const load = useFixtureStore((state) => state.load);
  const warnings = useDmxAddressCheck(fixtures);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">stage-light · 灯具布置</p>
          <h1>灯具布置</h1>
        </div>
        <StatusBadge value={warnings.length > 0 ? "WARNING" : "READY"} />
      </header>

      {warnings.length > 0 && (
        <div className="banner warning">
          {warnings.map((warning) => (
            <div key={warning.message}>{warning.message}</div>
          ))}
        </div>
      )}

      <section className="panel">
        {loading && <div className="empty">灯具加载中…</div>}
        <div className="table">
          {fixtures.map((fixture) => (
            <article key={fixture.id} className="row fixture-row">
              <FixtureIcon fixture={fixture} />
              <strong>{fixture.fixture_code}</strong>
              <span>{fixture.fixture_type}</span>
              <span>DMX {fixture.dmx_address}</span>
              <span>{fixture.channel_count} 通道</span>
              <span>{fixture.color_mode}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
