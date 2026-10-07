# 舞台灯光编排模拟器

纯前端舞台灯光编排工具，支持灯具通道、场景 Cue、时间轴叠加预览与演出方案导出，数据存于 IndexedDB，预览重算在 Web Worker 中完成。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

- 前端：<http://localhost:20113>
- 本地开发：`cd frontend && npm install && npm run dev`（默认 20113 端口）

## 时间轴叠加播放（核心能力）

演出前一晚导演把**基础层、效果层、追光层**叠在同一段时间上，同一段时刻谁说了算由下面的规则裁定，全部可在「时间轴编排」页核对：

1. **压层 + 场景优先级裁定通道**：多条轨道同时生效时，先按压层优先级（追光层 SPOT > 效果层 EFFECT > 基础层 BASE）排序，同层再按场景优先级（`priority`，数值大的优先）排序，依次占用通道；高优先级轨道已占用的通道，低优先级轨道只补空通道，不再覆盖。
2. **宇宙溢出标出顶起轨道**：每个 DMX 宇宙固定 512 通道。多轨道叠加时按「灯具通道清点」计算宇宙负载（各轨道分配到该宇宙的灯具通道数之和，同一灯具只计一次），超过 512 即标红溢出，并按优先级累加定位是哪几条轨道把容量顶过 512（标记「顶过 512」），同时给出整段时间线上的溢出窗口。
3. **并发修改先保存生效、晚到列差异**：两位灯光师修改同一条轨道时长时，服务器按版本号（`version`）做乐观并发控制——先保存的一版生效，晚到的保存被驳回并弹出差异对话框，逐字段列出「你的修改（未生效）/ 服务器当前值（已生效）」，可选择采用服务器版本或强制覆盖。编辑表单内提供「模拟另一位灯光师同时修改」按钮用于核对该流程。
4. **轨道改动立即重算，没算完不能播**：任何轨道改动（拖拽、改时长、保存冲突解决）都会立刻触发 Web Worker 重算整段预览；重算期间播放按钮锁定并显示「重算中」，舞台预览页同步展示重算状态，完成后才允许播放。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Redux Toolkit（zustand）+ IndexedDB |
| 后端 | -（本地 mock 数据 + IndexedDB 持久化） |
| 数据库 | 本地模拟数据 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的 async API（含版本校验、冲突包装、Worker 重算）
├── stores/               # 独立 store（zustand）：轨道/场景/灯具/演出方案/播放状态
├── types/                # 数据模型与播放快照类型
├── constants/            # 枚举、压层优先级、日志模板、错误码/错误消息、时间轴比例
├── constructors/         # 默认对象/表单对象/响应对象构造器（含播放快照构造器）
├── components/common/    # TimelineRuler、StageCanvas、PlaybackControls、FixtureIcon、CueCard、StatusBadge、StatCard、ColorChannelSlider、EmptyState
├── components/timeline/  # TrackLane、TrackBlock、StackingInspector、OverflowPanel、ConflictDialog、TrackEditForm
├── hooks/                # useTimelinePlayback、usePreviewRecompute、useDmxAddressCheck、useIndexedDbStore
├── pages/                # 灯具布置 / 场景编辑 / 时间轴编排 / 舞台预览
├── router/
├── utils/                # playbackEngine（压层裁定/溢出清点/冲突差异）、formatters、idb
├── workers/              # playbackWorker（预览重算）
└── mocks/                # seedData（130 灯具、4 场景、5 轨道，叠加即溢出）
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`：Compose 项目名，默认 `stage-light`
- `FRONTEND_PORT`：前端端口，默认 `20113`

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: stage-light`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-stage-light}-frontend` 前缀。
- 前端端口映射：`${FRONTEND_PORT:-20113}:80`。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- **FixtureType**（`constants/FixtureType.ts`、`types/FixtureType.ts`）：灯具构造器、`FixtureIcon` 展示、`STATUS_TEXT`、筛选器、日志模板（`Fixture` 组）、错误消息均有引用。
- **CueStatus**（`constants/CueStatus.ts`、`types/CueStatus.ts`）：场景构造器、`CueCard`/`StatusBadge` 展示、`STATUS_TEXT`、筛选器、日志模板（`CueScene` 组）、错误消息均有引用。
- **ChannelMode**（`constants/ChannelMode.ts`、`types/ChannelMode.ts`）：灯具构造器、`FixtureIcon` 展示、`STATUS_TEXT`、`playbackEngine` 的 `CHANNEL_KEYS`（按 color_mode 决定通道键）、日志模板、错误消息均有引用。
- **LayerType**（`types/Layer.ts`、`constants/layers.ts`）：轨道构造器、`TrackLane`/`TrackBlock`/`StackingInspector`/`OverflowPanel` 展示、`playbackEngine` 的 `LAYER_PRIORITY` 裁定、日志模板（`TimelineTrack` 组）均有引用。
- **错误码/错误消息**（`constants/errorCodes.ts`、`constants/errorMessages.ts`）：`api/errors.ts` 包装、`api/TimelineTrack.ts` 冲突抛出、各 store 的 controller 包装、页面横幅/冲突对话框均有引用。
- **日志模板**（`constants/logTemplates.ts`）：所有写操作（创建/更新/状态变更/导出/叠加计算/通道核对/溢出警告/保存冲突/预览重算/并发模拟）在 API 层按模板记录。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。例如调整压层优先级需要同时改 `types/Layer.ts`、`constants/layers.ts`、`playbackEngine`、轨道构造器、时间轴轨道块/检查器/溢出面板与本清单。

## License

MIT
