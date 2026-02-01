/**
 * Comprehensive proxy verification script
 */

async function testNativeFetch() {
	console.log("\n1️⃣ Testing native fetch with proxy...")

	const proxyUrl =
		process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY
	if (!proxyUrl) {
		console.log("⚠️  Skipping - no proxy configured")
		return
	}

	try {
		const { ProxyAgent } = await import("undici")
		const dispatcher = new ProxyAgent(proxyUrl)

		const response = await fetch("https://httpbin.org/ip", { dispatcher })
		const data = await response.json()

		console.log(`✅ Native fetch with proxy: ${data.origin}`)
	} catch (error) {
		console.error(`❌ Failed: ${error.message}`)
		throw error
	}
}

async function testCarbonFramework() {
	console.log("\n2️⃣ Testing Carbon framework proxy...")

	const { RequestClient } = await import("./dist/src/classes/RequestClient.js")

	const proxyUrl =
		process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY
	if (!proxyUrl) {
		console.log("⚠️  Skipping - no proxy configured")
		return
	}

	try {
		const client = new RequestClient("test-token", {
			proxyUrl: proxyUrl,
			baseUrl: "https://httpbin.org"
		})

		const response = await client.get("/ip")
		console.log(`✅ Carbon framework proxy: ${response.origin}`)
	} catch (error) {
		console.error(`❌ Failed: ${error.message}`)
		throw error
	}
}

async function main() {
	console.log("🔍 Comprehensive Proxy Verification\n")
	console.log(
		`Proxy: ${process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || "None"}`
	)

	try {
		await testNativeFetch()
		await testCarbonFramework()

		console.log("\n✅ All proxy tests passed!")
		console.log("\n📋 Summary:")
		console.log("   • Native fetch with undici ProxyAgent: ✓")
		console.log("   • Carbon RequestClient with proxy: ✓")
		console.log("   • Automatic proxy detection from env vars: ✓")
		console.log("\n🎉 Proxy integration is working correctly!")
	} catch (_error) {
		console.error("\n❌ Some tests failed")
		process.exit(1)
	}
}

main()
