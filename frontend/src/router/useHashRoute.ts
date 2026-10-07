import { useEffect, useState } from "react";
import { DEFAULT_ROUTE, routes } from "./routes";

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return routes.some((route) => route.route === hash) ? hash : DEFAULT_ROUTE;
}

/** 极简 hash 路由（纯前端、无第三方依赖，Nginx try_files 也能兜底） */
export function useHashRoute(): [string, (path: string) => void] {
  const [path, setPath] = useState<string>(currentPath);

  useEffect(() => {
    if (!window.location.hash) window.location.hash = DEFAULT_ROUTE;
    const onChange = () => setPath(currentPath());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = (next: string) => {
    window.location.hash = next;
  };

  return [path, navigate];
}
