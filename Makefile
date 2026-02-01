.PHONY: help publish-all publish-carbon publish-create-carbon build-carbon build-create-carbon bot-simple bot-test

# 版本递增类型默认值
VERSION_TYPE ?= patch

# 默认目标
help:
	@echo "Available commands:"
	@echo "  make build-all              - Build all packages"
	@echo "  make publish-all            - Build and publish all packages to npm (with auto version bump)"
	@echo "  make publish-carbon         - Build and publish carbon-proxy (auto-bumps patch version)"
	@echo "  make publish-create-carbon  - Build and publish create-carbon (auto-bumps patch version)"
	@echo "  VERSION_TYPE=patch|minor|major  - Version increment type (default: patch)"
	@echo "  Example: make publish-carbon VERSION_TYPE=minor"
	@echo "  make build-carbon           - Build carbon-proxy only"
	@echo "  make build-create-carbon    - Build create-carbon only"
	@echo "  make bot-simple             - Run simple message listener bot"
	@echo "  make bot-test               - Run message listener test script"

# 构建所有包
build-all: build-carbon build-create-carbon

# 构建并发布所有包
publish-all: publish-carbon publish-create-carbon

# 发布 carbon-proxy (自动递增版本)
# 使用方法: make publish-carbon [VERSION_TYPE=patch|minor|major]
# 默认: patch (0.14.4 -> 0.14.5)
publish-carbon:
	@echo "=> Bumping $(VERSION_TYPE) version for carbon-proxy..."
	cd packages/carbon && npm version $(VERSION_TYPE) -git-tag-version=false
	@echo "=> Building carbon-proxy..."
	cd packages/carbon && pnpm build
	@echo "=> Publishing carbon-proxy..."
	cd packages/carbon && npm publish --//registry.npmjs.org/:_authToken=$(NPM_ACCESS_TOKEN)
	@echo "✓ carbon-proxy published successfully"
	@echo "=> Don't forget to commit the version change!"

# 发布 create-carbon (自动递增版本)
# 使用方法: make publish-create-carbon [VERSION_TYPE=patch|minor|major]
# 默认: patch
publish-create-carbon:
	@echo "=> Bumping $(VERSION_TYPE) version for create-carbon..."
	cd packages/create-carbon && npm version $(VERSION_TYPE) -git-tag-version=false
	@echo "=> Building create-carbon..."
	cd packages/create-carbon && pnpm build
	@echo "=> Publishing create-carbon..."
	cd packages/create-carbon && npm publish --//registry.npmjs.org/:_authToken=$(NPM_ACCESS_TOKEN)
	@echo "✓ create-carbon published successfully"
	@echo "=> Don't forget to commit the version change!"

# 仅构建 carbon-proxy
build-carbon:
	@echo "=> Building carbon-proxy..."
	cd packages/carbon && pnpm build
	@echo "✓ carbon-proxy built successfully"

# 仅构建 create-carbon
build-create-carbon:
	@echo "=> Building create-carbon..."
	cd packages/create-carbon && pnpm build
	@echo "✓ create-carbon built successfully"

# 运行简化版消息监听 bot
bot-simple:
	@echo "=> Starting simple message listener bot..."
	@echo "=> Using SOCKS5H proxy: $${DISCORD_SOCKS_PROXY:-未设置}"
	@echo "=> Bot ID: $${DISCORD_CLIENT_ID:-未设置}"
	@echo ""
	cd apps/rocko && npx tsx simple-listen-bot.ts

# 运行消息监听测试脚本
bot-test:
	@echo "=> Starting message listener test..."
	@echo "=> Using SOCKS5H proxy: $${DISCORD_SOCKS_PROXY:-未设置}"
	@echo "=> Bot ID: $${DISCORD_CLIENT_ID:-未设置}"
	@echo ""
	cd apps/rocko && node test-message-listener.mjs
