# 鸿蒙版本构建指南

本目录包含时长驱动任务规划器的鸿蒙（HarmonyOS）应用版本。

## 前置要求

1. **DevEco Studio**：下载并安装 [DevEco Studio](https://developer.harmonyos.com/cn/develop/deveco-studio)
2. **Node.js**：确保已安装 Node.js（用于构建 Web 应用）
3. **HarmonyOS SDK**：在 DevEco Studio 中配置 HarmonyOS SDK

## 构建步骤

### 1. 构建 Web 应用

首先，在项目根目录构建 Web 应用：

```bash
cd ..
npm install
npm run build
```

这会在 `dist` 目录生成构建好的 Web 应用文件。

### 2. 复制构建文件到鸿蒙项目

在项目根目录运行 `./build-harmonyos.sh`，或手动执行：

```bash
# 将构建好的文件复制到鸿蒙项目的 rawfile 目录
cp -r dist/* harmonyos/entry/src/main/resources/rawfile/
```

### 3. 使用 DevEco Studio 打开项目

1. 打开 DevEco Studio
2. 在欢迎界面点击 **「打开」（Open）**（不是「创建项目」）
3. 浏览到项目目录，选择 **`harmonyos`** 文件夹（不是上级 TODO 目录）
4. 点击「确定」打开
5. 等待项目同步完成（首次打开会下载依赖，可能需要几分钟）

### 4. 配置应用信息

在 `entry/src/main/module.json5` 中配置应用信息：
- 应用名称
- 包名
- 版本号等

### 5. 配置签名（首次运行前）

若出现 `Will skip sign 'hos_hap'. No signingConfigs profile` 警告：

1. 菜单 **File** → **Project Structure** → **Project** → **Signing Configs**
2. 勾选 **Automatically generate signature**（自动生成签名）
3. 使用华为开发者账号登录
4. 点击 **Apply** 保存

> 模拟器调试通常可不配置签名，该警告不影响运行。真机调试需配置自动签名或手动证书。

### 6. 构建和运行

1. 连接鸿蒙设备或启动模拟器
2. 点击 `Run` 按钮或按 `Shift+F10`
3. 应用将自动安装到设备上

## 项目结构

```
harmonyos/
├── entry/                    # 应用主模块
│   └── src/
│       └── main/
│           ├── ets/          # ArkTS 代码
│           │   ├── pages/   # 页面
│           │   └── MainAbility.ts
│           ├── resources/   # 资源文件
│           │   └── rawfile/ # Web 应用文件（构建后复制到这里）
│           └── module.json5 # 模块配置
├── AppScope/
│   └── app.json5            # 应用配置
└── README.md                # 本文件
```

## 特性

- ✅ 使用 Web 组件加载 React 应用
- ✅ 支持本地存储（localStorage）
- ✅ 响应式设计，适配不同屏幕尺寸
- ✅ 支持鸿蒙系统特性（如负一屏卡片）

## 注意事项

1. **文件路径**：确保构建后的 Web 文件正确复制到 `rawfile` 目录
2. **权限配置**：如果应用需要网络访问，需要在 `module.json5` 中配置相应权限
3. **API 级别**：确保目标设备的 API 级别支持 Web 组件

## 打包发布

1. 在 DevEco Studio 中选择 `Build` -> `Build Hap(s)/APP(s)` -> `Build Hap(s)`
2. 生成的 HAP 文件位于 `entry/build/default/outputs/default/`
3. 使用 `hdc` 工具或应用市场进行安装

## 故障排除

### 加载失败(-6) 错误
- 确认已运行 `./build-harmonyos.sh` 将 Web 资源复制到 rawfile
- 检查 `rawfile` 目录存在 `index.html` 和 `assets/` 文件夹
- index.html 中已添加 `<base href="resource://rawfile/" />` 确保资源路径解析正确
- 使用 Chrome DevTools (`chrome://inspect`) 调试 WebView 查看具体错误

### 提示「Adapt your project to ohpm」
1. 菜单栏选择 **Tools** → **Migrate Assistant**
2. 按向导完成 ohpm 迁移
3. 迁移完成后点击 **Sync** 同步项目

### 显示「Select an OpenHarmony or HarmonyOS project」
这是 DevEco Studio 的欢迎界面。请：
1. 点击左侧的 **「打开」（Open）** 按钮
2. 选择 **`harmonyos`** 文件夹（完整路径如：`TODO/harmonyos`）
3. 确保选择的是包含 `oh-package.json5`、`build-profile.json5` 的 `harmonyos` 目录

### Web 页面无法加载
- 检查 `rawfile` 目录中是否有 `index.html` 文件
- 检查文件路径是否正确

### 样式显示异常
- 确保所有 CSS 文件都已复制
- 检查资源路径是否正确

### 数据无法保存
- 检查 localStorage 权限
- 确保应用有存储权限

## 技术支持

如有问题，请参考：
- [HarmonyOS 开发文档](https://developer.harmonyos.com/cn/documentation)
- [Web 组件使用指南](https://developer.harmonyos.com/cn/documentation/doc-references-V3/ts-basic-components-web-0000001477981205-V3)
