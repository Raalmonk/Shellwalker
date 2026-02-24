# Shellwalker 当前残缺点排查（对照你给的 PRD v1.2）

> 结论先说：项目现在不是“坏在一个点”，而是 **UI 演示版 + SimC 桥接最小链路**，距离 PRD 里的完整排轴器还差一整层产品能力。

## 1) 已有能力（目前能跑的最小闭环）

- 能在前端录入 SimC profile，调用 `/simulate` 跑一次后端。
- 能拖技能形成序列，后端把序列注入 strict sequence 后回传时间轴。
- 能显示 WAIT 区块、CAST 区块、简单资源（chi/energy）和 DPS。
- 能做非常基础的“天赋决定技能显隐”（仅部分技能）。

## 2) 对照 PRD 的主要缺口

### A. 技能体系与状态机缺口
- 缺少大量技能：RWK、CJL、SW、Zenith、CC、防御类、外部增益、药水、种族技等。
- 缺少“技能可用性状态机”：
  - BoK/SCK 高亮态管理。
  - RSK → RWK 替换逻辑。
  - WDP 只在 RSK/FoF 双 CD 时解锁（仅有面板草稿引擎，未接入主 App）。
- 缺少完整 GCD/读条规则落地：
  - 仅 FoF 做了 haste_scaled 示例；CJL/CC/SW 等规则没接主流程。

### B. 时间轴与轨道渲染缺口
- 当前只有单轨渲染（玩家动作），没有 Boss 轨/Buff 轨/Melee 轨/Flurry Strikes 轨。
- 没有轨道折叠/展开。
- Wait Block 仅在后端回传后显示，未形成“拖拽即本地预演 + 防呆吸附”的完整交互。

### C. 数学与战斗建模缺口
- 没有 PRD 要求的 EV 公式体系（Base/Crit/CritDmg 的期望计算）。
- FoF 未拆 5 tick 微分结算。
- 没有 Melee 期望平滑、Dual Threat 30% 期望化实现。
- RNG/BLP 相关“幸运值”系统没实现。

### D. 数据 I/O 与对账缺口
- 缺少 WCL CSV 导入与 Source 智能分轨。
- 缺少“轴体裂变”导入导出格式。
- 缺少配置项（主题、阈值滑块、全局开关）与持久化。

### E. 后端黑盒能力缺口
- `calledBuff` 字段在请求里有，但后端没有真正把“手动注入 100% 触发”映射进 simc 指令。
- 没有“概率抹杀（全部 proc=0）”代码生成逻辑。
- 没有 Auto-Pilot 截点回正 + `/run_action_list` 残局接管策略。

## 3) 这次我先修了什么（先把“残废”里的硬伤止血）

- 修复前端 TypeScript 构建失败（`gcdType` / `baseCastTime` / `baseCooldown` 等字段缺失导致全量编译报错）。
- 补齐技能类型定义与 `SkillView`，让面板引擎类型可用。
- 在 `WW_SKILLS` 增加基础施法元数据（GCD 类型、基础 CD、基础施法时间）以支撑本地排轴引擎。
- 修复 `Engine.ts` 默认值和重复变量问题，保证模拟逻辑可编译。
- 移除 `TimelineTrack.tsx` 无用 React 导入，消除 TS6133。

## 4) 建议下一步（按优先级）

1. **先做“单轨正确性”**：把技能状态机、WDP 解锁、防呆 Wait Block 本地预演做完整。  
2. **再上“多轨可视化”**：先补 Buff 轨 + Melee 轨，再接 Boss 轨/WCL。  
3. **最后做“数学精细化”**：FoF 5 tick、EV 与 RNG 体系、Call Proc 注入策略。  

---

如果你愿意，我下一轮可以直接按这个优先级开工：先把“技能状态机 + Wait Block 本地即时预演 + WDP 硬锁”做成可交付版本。
