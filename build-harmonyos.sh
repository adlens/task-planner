#!/bin/bash

# 鸿蒙应用构建脚本
# 从项目根目录运行: ./build-harmonyos.sh

echo "🚀 开始构建鸿蒙应用..."
echo ""

# 检查是否在项目根目录
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

echo "✅ Web 应用构建完成"
echo ""

# 2. 创建 rawfile 目录（如果不存在）
echo "📁 步骤 2: 准备鸿蒙项目目录..."
mkdir -p harmonyos/entry/src/main/resources/rawfile

# 3. 清理旧文件
echo "🧹 步骤 3: 清理旧文件..."
rm -rf harmonyos/entry/src/main/resources/rawfile/*

# 4. 复制构建文件
echo "📋 步骤 4: 复制构建文件到鸿蒙项目..."
cp -r dist/* harmonyos/entry/src/main/resources/rawfile/

if [ $? -ne 0 ]; then
    echo "❌ 错误: 文件复制失败"
    exit 1
fi

echo "✅ 文件复制完成"
echo ""

# 5. 注入 base 标签确保资源路径正确解析（鸿蒙 Web 组件）
if [ -f "harmonyos/entry/src/main/resources/rawfile/index.html" ]; then
    echo "📝 步骤 5: 注入 base 标签..."
    RAWFILE="harmonyos/entry/src/main/resources/rawfile/index.html"
    if ! grep -q 'base href="resource://rawfile/"' "$RAWFILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's|<head>|<head>\n    <base href="resource://rawfile/" />|' "$RAWFILE"
        else
            sed -i 's|<head>|<head>\n    <base href="resource://rawfile/" />|' "$RAWFILE"
        fi
    fi
    echo "✅ 关键文件检查通过"
else
    echo "⚠️  警告: index.html 文件未找到，请检查构建是否成功"
fi

echo ""
echo "🎉 构建完成！"
echo ""
echo "📝 下一步操作："
echo "1. 打开 DevEco Studio"
echo "2. 选择 File -> Open"
echo "3. 选择 harmonyos 目录"
echo "4. 等待项目同步完成"
echo "5. 连接鸿蒙设备或启动模拟器"
echo "6. 点击运行按钮（▶️）安装应用"
echo ""
echo "💡 提示：如果遇到问题，请查看 harmonyos/README.md"
