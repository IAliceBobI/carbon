/**
 * Simple test script to verify proxy configuration works with Discord API
 */

async function testProxyConnection() {
	console.log("🔍 Testing Discord API connection with proxy...\n")

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
		console.log(
			"⚠️  No proxy environment variables set (DISCORD_HTTP_PROXY, HTTPS_PROXY, HTTP_PROXY, ALL_PROXY)"
		)
		console.log("   Testing direct connection instead...\n")
	}

	try {
		// Dynamically import https-proxy-agent
		let dispatcher = null

		if (proxyUrl) {
			try {
				// Use undici's ProxyAgent for better compatibility
				// In Node.js 18+, undici is available globally
				const { ProxyAgent } = await import("undici")
				dispatcher = new ProxyAgent(proxyUrl)
				console.log("✅ Proxy agent created successfully (undici ProxyAgent)\n")
			} catch (err) {
				console.warn(`⚠️  Failed to create proxy agent: ${err.message}`)
				// Try fallback to https-proxy-agent
				try {
					const { HttpsProxyAgent } = await import("https-proxy-agent")
					dispatcher = new HttpsProxyAgent(proxyUrl)
					console.log(
						"✅ Proxy agent created successfully (https-proxy-agent fallback)\n"
					)
				} catch (fallbackErr) {
					console.warn(`⚠️  Fallback also failed: ${fallbackErr.message}`)
				}
			}
		}

		console.log("📡 Testing GET /users/@me (get current bot user)...\n")

		const startTime = Date.now()

		const fetchOptions = {
			method: "GET",
			headers: {
				Authorization: `Bot ${token}`,
				"Content-Type": "application/json"
			},
			dispatcher: dispatcher || undefined
		}

		const response = await fetch(
			"https://discord.com/api/v10/users/@me",
			fetchOptions
		)
		const duration = Date.now() - startTime

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		const data = await response.json()

		console.log(`✅ Request successful! (${duration}ms)`)
		console.log("Bot User:", JSON.stringify(data, null, 2))
		console.log(`\n✨ Proxy configuration is working correctly!`)
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

testProxyConnection()
