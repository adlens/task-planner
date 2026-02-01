# 时长驱动任务规划器 - Android 版本

## 快速开始

### 1. 构建 Web 资源

在项目根目录运行：

```bash
./build-android.sh
```

或手动执行：

```bash
npm run build
cp -r dist/* android/app/src/main/assets/
```

### 2. 用 Android Studio 打开

1. 打开 Android Studio
2. **File** → **Open** → 选择 `android` 目录
3. 等待 Gradle 同步完成

### 3. 运行应用

1. 连接 Android 设备或启动模拟器
2. 在 Android Studio 中点击运行按钮 ▶️

> 命令行构建需先安装 Gradle，或使用 Android Studio 的 **Build** → **Build Bundle(s) / APK(s)** 菜单。

## 项目结构

```
android/
├── app/
│   ├── src/main/
│   │   ├── assets/        # Web 应用文件（构建后）
│   │   ├── java/.../MainActivity.kt
│   │   └── res/
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

## 最低要求

- minSdk: 24 (Android 7.0)
- targetSdk: 34 (Android 14)

## 技术说明

- 使用 WebView 加载 React 应用
- 支持 JavaScript、localStorage
- 使用 `file:///android_asset/` 加载本地资源
