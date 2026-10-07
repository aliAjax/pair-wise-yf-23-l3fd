export interface RouteItem {
  name: string;
  route: string;
}

/** 路由配置：至少 4 个核心页面 */
export const routes: readonly RouteItem[] = [
  { name: "灯具布置", route: "/fixtures" },
  { name: "场景编辑", route: "/cues" },
  { name: "时间轴编排", route: "/timeline" },
  { name: "舞台预览", route: "/preview" }
] as const;

export const DEFAULT_ROUTE = routes[2].route;
