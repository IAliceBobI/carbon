import { SocksProxyAgent } from "socks-proxy-agent"

const gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json"
const proxyUrl = "socks5://127.0.0.1:7892"

console.log(`Testing SOCKS5 proxy connection to Discord Gateway...`)
console.log(`Proxy: ${proxyUrl}`)
console.log(`Target: ${gatewayUrl}`)

try {
	// Create SOCKS proxy agent with timeout
	const agent = new SocksProxyAgent(proxyUrl, {
		timeout: 30000
	})

	console.log("Agent created successfully")

	// Try to establish WebSocket connection
	const ws = await import("ws")
	const socket = new ws.default(gatewayUrl, { agent })

	socket.on("open", () => {
		console.log("✓ WebSocket connection opened successfully via SOCKS5!")
		socket.close()
		process.exit(0)
	})

	socket.on("error", (err) => {
		console.error("✗ WebSocket error:", err.message)
		process.exit(1)
	})

	socket.on("close", (code, reason) => {
		console.log(`Connection closed: ${code} - ${reason}`)
	})

	// Add connection timeout
	setTimeout(() => {
		console.error("✗ Connection timeout after 30 seconds")
		socket.close()
		process.exit(1)
	}, 30000)
} catch (err) {
	console.error("✗ Error:", err.message)
	console.error(err.stack)
	process.exit(1)
}
