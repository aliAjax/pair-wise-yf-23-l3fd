export const FixtureType = ["PAR","SPOT","WASH","BEAM","STROBE"] as const;
export type FixtureType = (typeof FixtureType)[number];
export const FixtureTypeText: Record<FixtureType, string> = Object.fromEntries(FixtureType.map((value) => [value, value.replace(/_/g, " ")])) as Record<FixtureType, string>;
