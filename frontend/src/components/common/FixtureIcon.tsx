import { StatusBadge } from "./StatusBadge";

export function FixtureIcon({ title = "FixtureIcon", value = "READY" }: { title?: string; value?: string }) {
  return <div className="shared-widget"><strong>{title}</strong><StatusBadge value={value} /></div>;
}
