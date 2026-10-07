# 舞台灯光编排模拟器（stage-light）

纯前端舞台灯光编排工具：管理灯具通道、灯光场景 Cue、三层压层时间轴与舞台预览，支持 DMX 宇宙溢出核对、多人改时长的乐观锁冲突提示，所有数据保存在浏览器 IndexedDB。

## 快速启动（首选）

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20113>

停止：`docker compose down`；重置本地数据卷（清空 IndexedDB 数据由浏览器保存，容器本身无状态）：`docker compose down -v`。

## 访问地址

| 页面 | 路由 | 说明 |
|---|---|---|
| 灯具布置 | <http://localhost:20113/#/fixtures> | 灯具平面图、DMX 起始地址、通道数、颜色模式 |
| 场景编辑 | <http://localhost:20113/#/cues> | 选灯具、调颜色/亮度/Pan-Tilt、淡入时间、场景优先级 |
| 时间轴编排 | <http://localhost:20113/#/timeline> | 三层泳道、叠加核对、宇宙溢出归因、并发改时长模拟 |
| 舞台预览 | <http://localhost:20113/#/preview> | 二维舞台按时间播放合成后的灯光 |

## 核心业务规则（本次重点）

1. **叠加播放可核对**：基础层 BASE / 效果层 EFFECT / 追光层 FOLLOW_SPOT 在同一时刻一起生效时，
   先按压层（追光 > 效果 > 基础）、同层再按场景 `priority` 裁决；高优先级先**占用（OCCUPY）**通道，
   低优先级只**补位（FILL）**没有被占用的通道，被抢走的通道不再出现在低优先级名下。
   时间轴编排页的「最终通道值与归属表」逐灯逐通道列出最终值、归属轨道、压层与占用/补位方式。
2. **超过 512 标溢出并归因**：灯具 footprint 按 DMX 起始地址归属唯一宇宙；某时刻叠加输出把宇宙顶破 512 时，
   右侧「DMX 宇宙容量」红色标出溢出量与最高地址，并按峰值地址列出是**哪几条轨道**把容量顶上去的。
3. **两人同时改时长，先保存者生效**：轨道带 `version` 乐观锁；保存必须携带 `base_version`。
   晚到的一版被拒绝并弹出差异面板（你打开时的值 / 先保存已生效的值 / 你晚到的值，逐字段标真冲突），
   可选择「放弃本版并重读」或「强制覆盖」。编排页提供两位灯光师的并发模拟器。
4. **改动即重算，没算完不能播**：轨道/场景/灯具一改动，重算引擎立即经 Web Worker 重算当前合成帧，
   播放强制暂停、播放按钮禁用并显示「重算中」，只接受最新数据版本的结果，旧帧不会落屏。

## 本地开发方式

```bash
cd frontend
npm install
npm run dev      # http://localhost:20113
```

其他脚本：

```bash
npm run build    # tsc -b && vite build
npm run verify   # 叠加裁决/溢出/补位 + 乐观锁冲突的断言验证脚本
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Redux Toolkit（独立切片 store，禁止全写组件 state） |
| 本地数据 | IndexedDB（`src/api/localDb.ts`），首启注入 `src/mocks/seedData.ts` |
| 耗时计算 | Web Worker（`src/workers/reconcile.worker.ts` 叠加重算） |
| 部署 | Docker Compose + Nginx 多阶段构建 |
| 后端 / 第三方 API | 无 |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的 async API（controller 层，二次包装异常）
│   ├── localDb.ts        # IndexedDB 持久层 + trackRevision 版本快照
│   └── errors.ts         # ApiRequestError / wrapServiceError
├── services/             # 业务逻辑层
│   ├── timelineMerge.ts  # 叠加裁决：压层/优先级、OCCUPY/FILL、宇宙容量与溢出归因
│   ├── trackConflict.ts  # 乐观锁逐字段差异
│   └── *Service.ts       # 各实体 service（一次异常包装、写日志）
├── stores/               # Redux Toolkit 独立切片（fixture/cueScene/timelineTrack/showProject/playback）
├── workers/              # reconcile.worker.ts 与 reconcileClient
├── types/                # 数据模型类型 + timeline.ts 合成帧/宇宙占用类型
├── constants/            # 枚举、压层 rank、DMX 常量、日志模板、错误码与错误消息
├── constructors/         # 默认对象/表单/响应构造器
├── components/common/    # FixtureIcon / CueCard / TimelineRuler / StageCanvas / ColorChannelSlider 等
├── components/timeline/  # TrackLanes / TrackInspector / ConflictPanel / ConcurrencySimulator 等
├── hooks/                # useTimelinePlayback / useReconcileEngine / useDmxAddressCheck / useIndexedDbStore
├── pages/                # FixturesPage / CuesPage / TimelinePage / PreviewPage
├── router/               # 路由配置与 hash 路由
├── config/               # appConfig（构建期环境变量统一入口）
├── utils/                # formatters（时间码/压层/状态）、logger
└── mocks/                # 本地种子数据（含 8-12s 三层叠加溢出场景）
```

## 环境变量说明

根目录 `.env`（由 `.env.example` 复制）：

- `COMPOSE_PROJECT_NAME`：Compose 项目名，默认 `stage-light`，容器名为 `${COMPOSE_PROJECT_NAME}-frontend`
- `FRONTEND_PORT`：宿主机映射端口，默认 `20113`

前端构建期变量（`frontend/.env.example`，经 `src/config/appConfig.ts` 读取）：

- `VITE_DB_NAME`：IndexedDB 库名，默认 `stage-light`
- `VITE_RECONCILE_DELAY_MS`：改动后重算闸门的可感知耗时，默认 `350ms`（用于核对“没算完不能播”）

## Docker 部署说明

- 根 `docker-compose.yml`：顶层 `name: stage-light`，不写 `version:`，只编排 `frontend` 一个服务。
- 容器名：`${COMPOSE_PROJECT_NAME:-stage-light}-frontend`；端口：`${FRONTEND_PORT:-20113}:80`。
- `frontend/Dockerfile` 为 Node 构建 + Nginx 托管的多阶段构建；纯静态应用本身无命名卷，
  业务数据保存在浏览器 IndexedDB（随浏览器存储走，不进容器卷）。
- `nginx.conf` 已配置 `try_files $uri $uri/ /index.html;`，刷新任意 SPA 路由不 404；中文目录名构建无影响（COPY 的是相对路径内容）。
- 常见问题：端口占用改 `.env` 的 `FRONTEND_PORT` 后 `docker compose up -d`；浏览器侧想恢复演示数据，可清空站点 IndexedDB 后刷新（首启重新注入种子）。

## 枚举 / 常量出现位置清单

### FixtureType（PAR / SPOT / WASH / BEAM / STROBE）

- 常量与类型：`constants/FixtureType.ts`、`types/FixtureType.ts`
- store：`stores/FixtureStore.ts`
- 构造器：`constructors/FixtureConstructor.ts`
- 日志模板：`constants/logTemplates.ts`（Fixture 组）
- 错误消息：灯具保存校验经 `api/Fixture.ts` → `constants/errorMessages.ts`
- 筛选器：`pages/FixturesPage.tsx` 类型筛选
- 展示组件：`components/common/FixtureIcon.tsx`（类型 glyph）、灯具表格、`utils/formatters.ts`

### CueStatus（DRAFT / READY / DISABLED / ARCHIVED）

- 常量与类型：`constants/CueStatus.ts`、`types/CueStatus.ts`
- store：`stores/CueSceneStore.ts`
- 构造器：`constructors/CueSceneConstructor.ts`
- 日志模板：`constants/logTemplates.ts`（CueScene 组）
- 错误消息：`api/CueScene.ts` 名称校验；停用场景在 `services/timelineMerge.ts` 被排除叠加
- 筛选器：`pages/CuesPage.tsx` 状态筛选
- 展示组件：`components/common/CueCard.tsx`、`components/common/StatusBadge.tsx`、`components/timeline/TrackLanes.tsx`（停用置灰）

### ChannelMode（RGB / RGBW / DIMMER_ONLY / MOVING_HEAD）

- 常量与类型：`constants/ChannelMode.ts`、`types/ChannelMode.ts`
- store：`stores/FixtureStore.ts`
- 构造器：`constructors/FixtureConstructor.ts`
- 日志模板：随灯具更新日志记录
- 错误消息：灯具保存校验
- 筛选/编辑：`pages/FixturesPage.tsx` 编辑弹窗
- 展示组件：灯具表格；`pages/CuesPage.tsx` 按模式决定可编辑通道（`ColorChannelSlider`）

### TrackLayer（BASE / EFFECT / FOLLOW_SPOT，本次新增第四组枚举）

- 常量与 rank：`constants/TrackLayer.ts`；类型经 `types/TimelineTrack.ts`、`types/timeline.ts` 引用
- 叠加裁决：`services/timelineMerge.ts`、`workers/reconcile.worker.ts`
- store：`stores/PlaybackStore.ts` 闸门状态
- 错误/冲突：`services/trackConflict.ts`、`components/timeline/ConflictPanel.tsx`
- 筛选/展示：`components/timeline/TrackLanes.tsx`、`ActiveTrackBar.tsx`、`OverflowPanel.tsx`、`ChannelOwnershipTable.tsx`、`utils/formatters.ts`

## 为什么该项目会“牵一发动全身”

- 叠加规则（压层/优先级）、容量（512）、通道占用/补位被拆在 `constants`、`types/timeline`、`services/timelineMerge`、`workers`、多个展示组件中；改一个裁决口径要同步引擎、worker、归属表与溢出面板。
- 枚举在常量、类型、构造器、日志模板、错误消息、筛选器、展示组件多层重复引用，新增枚举值至少触达 7 处。
- service 与 api/controller 分别包装异常，日志模板集中且每次写操作都调用；字段变更要同步类型、构造器、store、页面、差异面板与种子数据。
- 轨道保存同时受乐观锁版本、锁定保护、版本快照与冲突差异四处约束；`utils/formatters.ts` 被多个页面和组件共用。

## 验证脚本说明

`npm run verify` 包含两组 Node 断言（esbuild 临时打包，不入产物）：

- `scripts/verifyMerge.ts`：8-12s 三层叠加的裁决顺序、宇宙 0 溢出 12 通道、贡献者归因（T3 峰值 524 居首）、OCCUPY/FILL 补位、淡入缩放、DISABLED 场景排除。
- `scripts/verifyLock.ts`：注入内存版 IndexedDB，验证两人基于同版本改时长时先保存生效、晚到被拒并带逐字段差异、强制覆盖升级版本、锁定轨道改时长被拒。

## License

MIT
