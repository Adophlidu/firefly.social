# SSR 布局体系设计：路由分组 + 布局插槽

状态：草案（待评审）
日期：2026-07-27

## 背景与问题

迁移过程中，我们把 Next 的布局机制机械映射到了新架构上，产生了一连串同源 bug：

| Next 机制 | 临时映射 | 代价 |
| --- | --- | --- |
| 组布局 `(normal)` / `(home)` | `IfPathname` 按路径选框架 | 前缀 vs 精确匹配出错（HomeTabs 错包 `/prediction/category/*`） |
| 并行路由 `@subnav` / `@sidebar` | `ExploreSubnav` 手解析 pathname | split off-by-one，子 tab 整体丢失 |
| `@modal` 拦截路由 | 无（渲染 null） | 功能缺失，暂可接受 |
| RSC async 组件 | 直接复用 | 客户端 #482 连环崩溃 |

核心原则（与 Next 对齐但更简单）：**布局归属由目录决定，不由路径正则决定**。
`IfPathname` 只允许用于纯 UI 分支（同一份布局内的局部差异），不允许用于布局选择。

## 非目标

- 不做 Next 的路由拦截（`(.)photo` 模态 URL）。现有弹窗走事件驱动的 client modals，已可用。
- 不改变 loader / head / clientOnly 契约。
- 不改变任何 URL。

## 一、路由分组（已就绪，零库改动）

库的 tree builder / segments / matcher / 扫描器已完整支持 `(group)` 段（pathless，进 id 不进 URL）。
只需确认两点在带括号路径下正常：

- `vite.config.ts` 的 `clientOnly` 断言：文件移动后路径带组前缀（如 `(normal)/(home)/posts/index.tsx`）。
  方案：断言前先归一化——`file.replace(/(?:^|\/)\([^)]+\)(?=\/)/g, '')` 再匹配，**现有清单不用改**。
- 路由 CSS 映射（`resolveClientAssets`）：manifest key 与扫描路径一致即可（括号只是普通字符，已验证可行）。

## 二、布局插槽（slots）

### 需求

祖先布局声明命名区域；匹配链上的任意路由文件可以往里填内容；页面级覆盖布局级，就近优先（和 layout 同样的解析方向）。SSR / 客户端导航行为一致。

### API

路由文件新增**命名 slot 导出**（约定优于配置）：

```tsx
// routes/(normal)/explore/$explore/$source/_layout.tsx
export function subnav() {
    return <ExploreSourceNav … />;
}
```

布局用 `<Slot>` 占位，可带 fallback：

```tsx
// routes/(normal)/_layout.tsx
<div className="sticky top-0 z-40 bg-primaryBottom">
    <NavigatorBar />
    <Slot name="subnav" />
</div>
<aside>
    <Slot name="sidebar" fallback={<DefaultRightSidebarContent />} />
</aside>
```

### 语义

- 收集规则：沿匹配链 root → page 收集每个具名 slot 导出，**页面侧（更靠内）覆盖外侧**；未填充时渲染 `fallback`。
- slot 导出是**组件**（`() => ReactNode`），不是元素——避免在模块加载时过早求值，且保持和页面组件一致的渲染时机。
- slot 内容随 `composeMatch` 树一起渲染（SSR 与客户端导航天然一致），不需要额外数据通道。
- v1 不支持 slot loader。slot 组件用 react-query 自取数（与现有组件习惯一致）。

### 实现要点（库）

- `compose.tsx`：`composeMatch` 收集链上各模块的具名导出（slot 名以白名单为准？——不做白名单，按 `<Slot name>` 消费即可），存入 `RouterState.slots: Record<string, ComponentType>`。
- 新增 `Slot` 组件：`const C = state.slots[name]; return C ? <C /> : fallback ?? null`。
- 类型：`RouteModule` 增加 index signature 还是显式 `[slot: string]: ComponentType`——选显式注释 + 运行时按函数过滤，避免污染模块类型。
- 大小写/命名冲突：slot 导出名为小写 camel（`subnav`、`sidebar`、`modal`），与 `loader`/`head`/`config`/`default`/`errorComponent` 等保留导出区分。
- 客户端导航无需特判：模块随链加载，slot 导出随模块到达。

## 三、页面重组（目录即归属）

```
src/routes/
├── __root.tsx                  # 不变
├── _layout.tsx                 # 仅 locale + providers（AppProviders/全局服务挂载）
├── api/                        # 不动（API 无框架）
├── (whiteboard)/
│   ├── _layout.tsx             # 裸框架（现 /signup 分支逻辑）
│   ├── signup/ login/ frame/ redirect/ telegram/
├── (event)/
│   ├── _layout.tsx             # EventLayoutBody（含 SideBar/双栏）
│   ├── event/ events/
├── (settings)/
│   ├── _layout.tsx             # SettingsHeader + SettingsList 外壳
│   └── settings/
└── (normal)/
    ├── _layout.tsx             # 三栏主框架：NavigatorBar + <Slot subnav> + 主栏 + 右栏 <Slot sidebar> + ComposeButton/Watcher
    ├── (home)/
    │   ├── _layout.tsx         # HomeTabs（彻底删除路径判断）
    │   ├── posts/ activities/ prediction/index.tsx world-cup-feed/ following/
    ├── post/ profile/ explore/ club/ tx/ token/ search/ article/
    ├── intent/ auth/ bookmarks/ notifications/ messages/
    └── prediction/category/ prediction/leaderboard/ world-cup/ …
```

要点：

- `/messages` 的特例（无右栏）→ `messages/_layout.tsx` 覆盖：该层自己渲染单列框架，或 `<Slot name="sidebar">{null}</Slot>` 显式清空。
- `/explore` 的 subnav → `(normal)/explore/$explore/_layout.tsx` 导出 `subnav` slot（`ExploreSourceTabs`），`$source` 层再覆盖一次（加上 `ExploreSourceNav`/`PredictionSourceNav`）。**ExploreSubnav 和 split 解析整体删除**。
- `/search` 同理导出 `subnav` slot（SearchTabs/ClubTypeTab/SearchSources）。
- 右栏特例（parallelSidebarPatterns 那些页面）→ 各自路由导出空 `sidebar` slot 覆盖默认。
- `IfPathname` 在 NormalLayoutBody 里的布局选择逻辑全部删除；AppLayoutBody 只保留全局服务（Modals/IframeBridge/NotificationListener/BeforeUnload/SessionUnauthorizedBoundaryTrigger）和 providers。
- 路由文件之间无相对导入（已确认），移动是纯 `git mv`。

## 四、迁移批次与验证

每批：改 → `vitest`（库）→ `vite build` → miniflare 冒烟 → deploy staging → Playwright 巡检。

1. **批次 A（库）**：`<Slot>` + `RouterState.slots` + 测试（slot 收集/覆盖/fallback/SSR-CSR 一致）。
2. **批次 B（骨架迁移）**：建 4 个组目录 + 组 `_layout.tsx`，迁移 whiteboard/event/settings（页面少、风险低），巡检对应路径。
3. **批次 C（normal + home）**：`(normal)/_layout.tsx`（slots 版）+ `(home)` 迁移 + clientOnly 归一化，全量 17+ 路由巡检。
4. **批次 D（slots 填充）**：explore/search 的 subnav、右栏特例页，截图对比生产。
5. **批次 E（清理）**：删除 `NormalLayoutBody.tsx`、`ExploreSubnav`、`IfPathname` 布局选择残留、`clientOnly` 旧清单核对。

## 五、兼容与回滚

- 全部改动在 `apps/web/src/routes`、`src/compat`、`packages/ssr`；旧 Next 应用 `src/app` 不动。
- 每批独立 commit；任一批次出问题 `git revert` 该批即可，不影响已上线的其它部分。
- URL 零变化（组是 pathless），SEO / 外部链接无感。

## 六、与剩余迁移项的关系

- next-auth 迁移与本文档正交，可并行。
- OG 图 / twitter API 在之后。
- `@modal` 拦截路由若将来要做，作为 slots 的扩展（`modal` slot + 历史态背景保留）单独立项，不在本设计范围。
