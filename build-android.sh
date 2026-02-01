#!/bin/bash

# Android 应用构建脚本
# 从项目根目录运行: ./build-android.sh

echo "🚀 开始构建 Android 应用..."
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 1. 构建 Web 应用
echo "📦 步骤 1: 构建 Web 应用..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 错误: Web 应用构建失败"
    exit 1
fi

# 2. 复制到 Android assets
echo "📁 步骤 2: 复制 Web 资源到 Android 项目..."
mkdir -p android/app/src/main/assets
rm -rf android/app/src/main/assets/*
cp -r dist/* android/app/src/main/assets/

echo "✅ 完成"
echo ""
echo "📝 下一步："
echo "1. 用 Android Studio 打开 android 目录"
echo "2. 连接设备或启动模拟器"
echo "3. 点击 Run 运行应用"
echo ""
echo "或使用命令行："
echo "  cd android && ./gradlew installDebug"
