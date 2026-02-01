.PHONY: help publish-all publish-carbon publish-create-carbon build-carbon build-create-carbon bot-simple bot-test

# 默认目标
help:
	@echo "Available commands:"
	@echo "  make build-all              - Build all packages"
	@echo "  make publish-all            - Build and publish all packages to npm"
	@echo "  make publish-carbon         - Build and publish carbon-proxy"
	@echo "  make publish-create-carbon  - Build and publish create-carbon"
	@echo "  make build-carbon           - Build carbon-proxy only"
	@echo "  make build-create-carbon    - Build create-carbon only"
	@echo "  make bot-simple             - Run simple message listener bot"
	@echo "  make bot-test               - Run message listener test script"

# 构建所有包
build-all: build-carbon build-create-carbon

# 构建并发布所有包
publish-all: publish-carbon publish-create-carbon

# 发布 carbon-proxy
publish-carbon:
	@echo "=> Building carbon-proxy..."
	cd packages/carbon && pnpm build
	@echo "=> Publishing carbon-proxy..."
	cd packages/carbon && npm publish --//registry.npmjs.org/:_authToken=$(NPM_ACCESS_TOKEN)
	@echo "✓ carbon-proxy published successfully"

# 发布 create-carbon
publish-create-carbon:
	@echo "=> Building create-carbon..."
	cd packages/create-carbon && pnpm build
	@echo "=> Publishing create-carbon..."
	cd packages/create-carbon && npm publish --//registry.npmjs.org/:_authToken=$(NPM_ACCESS_TOKEN)
	@echo "✓ create-carbon published successfully"

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
