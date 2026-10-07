export const CueStatus = ["DRAFT","READY","DISABLED","ARCHIVED"] as const;
export type CueStatus = (typeof CueStatus)[number];
export const CueStatusText: Record<CueStatus, string> = Object.fromEntries(CueStatus.map((value) => [value, value.replace(/_/g, " ")])) as Record<CueStatus, string>;
