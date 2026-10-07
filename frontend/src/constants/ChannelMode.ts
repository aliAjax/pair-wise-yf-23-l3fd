export const ChannelMode = ["RGB","RGBW","DIMMER_ONLY","MOVING_HEAD"] as const;
export type ChannelMode = (typeof ChannelMode)[number];
export const ChannelModeText: Record<ChannelMode, string> = Object.fromEntries(ChannelMode.map((value) => [value, value.replace(/_/g, " ")])) as Record<ChannelMode, string>;
