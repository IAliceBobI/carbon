/**
 * Simple test of Carbon framework proxy functionality
 */
import { RequestClient } from "./dist/src/classes/RequestClient.js"

async function testFrameworkProxy() {
	console.log("🔍 Testing Carbon Framework proxy with a public API...\n")

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
		// Create a simple test client that makes a request to a public API
		// Using httpbin.org which echoes request details
		const testClient = new RequestClient("test-token", {
			proxyUrl: proxyUrl,
			baseUrl: "https://httpbin.org"
		})

		console.log(`✅ RequestClient created with proxy configuration\n`)

		// Test GET request through the framework
		console.log(
			"📡 Testing GET request to httpbin.org through Carbon framework...\n"
		)

		const startTime = Date.now()
		const response = await testClient.get("/get")
		const duration = Date.now() - startTime

		console.log(`✅ Request successful! (${duration}ms)`)
		console.log("Response:", JSON.stringify(response, null, 2))
		console.log(`\n✨ Carbon framework proxy is working correctly!`)
	} catch (error) {
		console.error("\n❌ Request failed!")
		console.error("Error:", error.message)

		if (error.cause) {
			console.error("Cause:", error.cause)
		}

		process.exit(1)
	}
}

testFrameworkProxy()
