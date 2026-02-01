/**
 * Test Carbon framework proxy functionality
 */
import { RequestClient } from "./dist/src/classes/RequestClient.js"

async function testFrameworkProxy() {
	console.log("🔍 Testing Carbon Framework with proxy...\n")

	// Get the bot token from environment
	const token = process.env.DISCORD_BOT_TOKEN
	if (!token) {
		console.error("❌ DISCORD_BOT_TOKEN environment variable is not set")
		process.exit(1)
	}

	// Check proxy configuration
	const proxyUrl =
		process.env.DISCORD_HTTP_PROXY ||
		process.env.HTTPS_PROXY ||
		process.env.HTTP_PROXY ||
		process.env.ALL_PROXY
	if (proxyUrl) {
		console.log(`✅ Proxy configured: ${proxyUrl}`)
	} else {
		console.log("⚠️  No proxy environment variables set")
		process.exit(1)
	}

	try {
		// Create Carbon RequestClient with proxy
		const rest = new RequestClient({
			token: `Bot ${token}`,
			proxy: proxyUrl
		})

		console.log(`✅ RequestClient created with proxy configuration\n`)

		// Test GET request through the framework
		console.log("📡 Testing GET /users/@me through Carbon framework...\n")

		const startTime = Date.now()
		const response = await rest.get("/users/@me")
		const duration = Date.now() - startTime

		console.log(`✅ Request successful! (${duration}ms)`)
		console.log("Bot User:", JSON.stringify(response, null, 2))
		console.log(`\n✨ Carbon framework proxy is working correctly!`)
	} catch (error) {
		console.error("\n❌ Request failed!")
		console.error("Error:", error.message)

		if (error.cause) {
			console.error("Cause:", error.cause)
		}

		console.error("\n🔧 Troubleshooting:")
		console.error("   1. Verify your proxy server is running and accessible")
		console.error(
			"   2. Check the proxy URL format (e.g., http://127.0.0.1:7891)"
		)
		console.error("   3. Ensure proxy supports HTTPS tunneling")
		console.error("   4. Verify DISCORD_BOT_TOKEN is valid")

		process.exit(1)
	}
}

testFrameworkProxy()
