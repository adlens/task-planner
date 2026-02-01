# 时长驱动任务规划器 - Android 版本

## 说明

App 直接加载线上地址 `https://task-planner-lake.vercel.app`，无需本地构建 Web 资源。  
登录魔法链接会在此 App 内打开，完成认证。

## 快速开始

### 1. 用 Android Studio 打开

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

- 使用 WebView 加载线上 React 应用（Vercel 部署）
- 支持 JavaScript、localStorage、Supabase 同步
- App Links：登录魔法链接点击后在 App 内打开
