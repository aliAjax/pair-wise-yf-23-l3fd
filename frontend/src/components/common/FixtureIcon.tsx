import type { Fixture } from "../../types/Fixture";

interface FixtureIconProps {
  fixture?: Fixture;
  title?: string;
  value?: string;
}

const FIXTURE_ABBREVIATION: Record<string, string> = {
  PAR: "PAR",
  SPOT: "SPT",
  WASH: "WSH",
  BEAM: "BEM",
  STROBE: "STR"
};

/**
 * Fixture type badge. Renders the fixture type abbreviation when a fixture is
 * given; keeps the legacy title/value badge form for backward compatibility.
 */
export function FixtureIcon({ fixture, title = "FixtureIcon", value = "READY" }: FixtureIconProps) {
  if (fixture) {
    const abbreviation = FIXTURE_ABBREVIATION[fixture.fixture_type] ?? fixture.fixture_type.slice(0, 3);
    return (
      <span className="fixture-icon" title={`${fixture.fixture_code} · ${fixture.color_mode}`}>
        {abbreviation}
      </span>
    );
  }
  return (
    <div className="shared-widget">
      <strong>{title}</strong>
      <span className="badge ready">{value}</span>
    </div>
  );
}
