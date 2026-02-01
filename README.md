# 时长驱动任务规划器

一款基于**时长驱动（Duration-based）**而非固定时刻驱动的任务规划工具。解决用户在起床时间不固定（如休假、自然醒）的情况下，依然能快速生成全天连贯日程的需求。

## 核心特性

### 1. 任务池（Task Pool）
- 用户预设任务名称及预估时长（Duration），不设定具体的 Start Time
- 支持设置任务优先级（高/中/低）
- 支持固定时间任务（Fixed Event）

### 2. 起始锚点（The Anchor）
- 用户手动输入一个"开始时间"（如起床时刻）
- 系统以此为基准点，利用时长叠加算法自动推导出所有任务的起止时刻

### 3. 硬性约束（Hard Constraint）
- 支持设置"固定时间任务"（Fixed Event）
- 此类任务位置不动，动态任务需围绕其进行避让

### 4. 实时重算（Real-time Recalculation）
- 当实际执行时长超过预估，或用户点击"重置/顺延"时
- 系统自动刷新后续所有未完成任务的时间线

## 功能模块

### A. 任务编辑模块
- 支持输入：任务名、预估时长（分钟）、优先级、是否为固定时间
- 固定时间逻辑：若设为固定时间，必须输入具体的 StartTime 和 EndTime

### B. 动态算法引擎（核心）
- **链式计算**：`Task_n.StartTime = Task_{n-1}.EndTime`
- **避让逻辑**：若动态生成的 `Task_n` 与 Fixed Event 冲突：
  - 自动将该动态任务平移至 Fixed Event 结束之后
  - 或在 Fixed Event 之前显示剩余可用碎片时间

### C. 执行监控模块
- **播放/暂停键**：记录实际用时
- **一键同步**：如果当前任务超时，支持一键将后续所有任务按当前真实时间点重新排布

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **时间处理**：dayjs
- **存储**：localStorage（可扩展为云端存储）

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用示例

### 场景：前晚准备 + 当日执行

**前晚：**
1. 添加任务"洗漱"，预估时长 10 分钟
2. 添加任务"早餐"，预估时长 20 分钟
3. 添加任务"阅读"，预估时长 60 分钟
4. 添加固定时间任务"约会"，11:00 - 12:00

**当日：**
1. 9:30 醒来，点击"我醒了"按钮
2. 系统自动计算：
   - 9:30 - 9:40 洗漱
   - 9:40 - 10:00 早餐
   - 10:00 - 11:00 阅读
   - 11:00 - 12:00 固定约会

## 数据结构

```typescript
interface Task {
  id: string;
  name: string;
  estimatedDuration: number; // 分钟
  priority: 'low' | 'medium' | 'high';
  isFixed: boolean;
  startTime?: string; // ISO string, required if isFixed
  endTime?: string; // ISO string, required if isFixed
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
}
```

## 鸿蒙版本

项目已支持鸿蒙（HarmonyOS）系统！

### 快速构建

```bash
# 构建鸿蒙应用
./build-harmonyos.sh
```

构建完成后，使用 DevEco Studio 打开 `harmonyos` 目录即可。

详细说明请查看 [harmonyos/README.md](./harmonyos/README.md)

## Android 版本

```bash
./build-android.sh
```

用 Android Studio 打开 `android` 目录即可。详见 [android/README.md](./android/README.md)

## 未来扩展

- [x] 鸿蒙系统支持
- [x] Android 支持
- [ ] 云端同步（支持多设备）
- [ ] 移动端适配（React Native / Flutter）
- [ ] 鸿蒙原子化服务支持
- [ ] 任务模板功能
- [ ] 统计分析（实际用时 vs 预估用时）
- [ ] 提醒通知功能

## 开发提示

- 算法复杂度：这实际上是一个简单的线性规划问题，重点在于 UI 的实时刷新性能
- 时间处理：使用 dayjs 库来处理跨时区和时间加减，避免原生 Date 对象的坑
- 数据结构：任务对象需要包含 `isFixed: boolean` 字段

## License

MIT
