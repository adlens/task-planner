# 鸿蒙版本快速开始指南

## 一键构建

在项目根目录运行：

```bash
./build-harmonyos.sh
```

这个脚本会：
1. 自动构建 Web 应用
2. 将构建文件复制到鸿蒙项目
3. 准备就绪，等待在 DevEco Studio 中打开

## 详细步骤

### 1. 安装 DevEco Studio

下载并安装 [DevEco Studio](https://developer.harmonyos.com/cn/develop/deveco-studio)

### 2. 配置环境

- 安装 HarmonyOS SDK
- 配置 Node.js（如果还没有）

### 3. 构建应用

```bash
# 在项目根目录
./build-harmonyos.sh
```

### 4. 打开项目

1. 打开 DevEco Studio
2. `File` -> `Open`
3. 选择 `harmonyos` 目录
4. 等待项目同步

### 5. 运行应用

1. 连接鸿蒙设备或启动模拟器
2. 点击运行按钮（▶️）
3. 应用会自动安装并启动

## 项目结构

```
harmonyos/
├── entry/                    # 主模块
│   └── src/main/
│       ├── ets/              # ArkTS 代码
│       │   ├── pages/       # 页面（Index.ets）
│       │   └── entryability/ # 入口能力
│       ├── resources/       # 资源文件
│       │   └── rawfile/     # Web 应用文件（构建后）
│       └── module.json5     # 模块配置
├── AppScope/                 # 应用配置
│   └── app.json5
└── build-profile.json5      # 构建配置
```

## 常见问题

### Q: Web 页面无法加载？

A: 确保已运行构建脚本，并且 `rawfile` 目录中有 `index.html` 文件。

### Q: 样式显示异常？

A: 检查 Vite 配置中的 `base: './'` 设置，确保使用相对路径。

### Q: 数据无法保存？

A: Web 组件已启用 `domStorageAccess(true)`，应该可以正常使用 localStorage。

## 技术支持

- [HarmonyOS 开发文档](https://developer.harmonyos.com/cn/documentation)
- [Web 组件 API](https://developer.harmonyos.com/cn/documentation/doc-references-V3/ts-basic-components-web-0000001477981205-V3)
