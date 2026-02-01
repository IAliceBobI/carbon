#!/bin/bash
# 发布脚本 - 用于发布 carbon-proxy 到 npm

set -e

echo "📦 准备发布 carbon-proxy 到 npm..."
echo ""

# 1. 检查是否已登录
echo "🔍 检查 npm 登录状态..."
if [ -z "$NPM_ACCESS_TOKEN" ]; then
    echo "⚠️  未设置 NPM_ACCESS_TOKEN 环境变量"
    echo "   请先设置: export NPM_ACCESS_TOKEN=your_token"
    exit 1
fi

# 2. 构建项目
echo "🔨 构建项目..."
pnpm build

# 3. 检查 package.json
echo ""
echo "📋 包信息:"
node -e "
const pkg = require('./package.json');
console.log('  包名:', pkg.name);
console.log('  版本:', pkg.version);
console.log('  仓库:', pkg.repository);
"

# 4. 确认发布
echo ""
read -p "确认发布? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消发布"
    exit 1
fi

# 5. 发布到 npm
echo ""
echo "🚀 发布到 npm..."
npm publish \
  --access public \
  --//registry.npmjs.org/:_authToken=$NPM_ACCESS_TOKEN

echo ""
echo "✅ 发布成功!"
echo ""
echo "📦 安装命令:"
echo "   npm install carbon-proxy"
echo "   pnpm add carbon-proxy"
echo ""
echo "📚 文档: https://www.npmjs.com/package/carbon-proxy"
echo "📖 使用指南: https://github.com/stonev5/carbon/blob/main/packages/carbon/PROXY_USAGE.md"
