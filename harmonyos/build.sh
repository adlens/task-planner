#!/bin/bash

# 鸿蒙应用构建脚本
# 使用方法: ./build.sh

echo "开始构建鸿蒙应用..."

# 检查是否在项目根目录
if [ ! -f "../package.json" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 1. 构建 Web 应用
echo "步骤 1: 构建 Web 应用..."
cd ..
npm run build

if [ $? -ne 0 ]; then
    echo "错误: Web 应用构建失败"
    exit 1
fi

# 2. 创建 rawfile 目录（如果不存在）
echo "步骤 2: 准备鸿蒙项目目录..."
cd harmonyos
mkdir -p entry/src/main/resources/rawfile

# 3. 复制构建文件
echo "步骤 3: 复制构建文件到鸿蒙项目..."
cp -r ../dist/* entry/src/main/resources/rawfile/

if [ $? -ne 0 ]; then
    echo "错误: 文件复制失败"
    exit 1
fi

echo "✅ 构建完成！"
echo ""
echo "下一步："
echo "1. 使用 DevEco Studio 打开 harmonyos 目录"
echo "2. 等待项目同步完成"
echo "3. 连接设备或启动模拟器"
echo "4. 点击运行按钮安装应用"
