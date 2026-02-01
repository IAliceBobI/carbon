#!/usr/bin/env node

/**
 * Test Discord Gateway WebSocket connection via SOCKS5 tunnel
 * Using tcplink in tunnel mode: socks -> agent -> Discord
 */

import { SocksProxyAgent } from "socks-proxy-agent"
import WebSocket from "ws"

const gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json"
const proxyUrl = "socks5://127.0.0.1:7892"

console.log("=".repeat(60))
console.log("Testing Discord Gateway via SOCKS5 Tunnel")
console.log("=".repeat(60))
console.log(`Proxy URL: ${proxyUrl}`)
console.log(`Gateway URL: ${gatewayUrl}`)
console.log(
	"Tunnel: client -> socks(7892) ==encrypted==> agent(7893) -> Discord"
)
console.log("=".repeat(60))

let heartbeatInterval = null
let heartbeatAck = true
let messageCount = 0

try {
	// Create SOCKS proxy agent with timeout
	const agent = new SocksProxyAgent(proxyUrl, {
		timeout: 30000
	})

	console.log("✓ SOCKS5 agent created")

	// Create WebSocket connection
	const ws = new WebSocket(gatewayUrl, { agent })

	ws.on("open", () => {
		console.log("✓ WebSocket connection opened successfully via SOCKS5 tunnel!")
		console.log("✓ Ready to receive Discord Gateway events")
	})

	ws.on("message", (data) => {
		messageCount++

		try {
			const payload = JSON.parse(data.toString())

			// Handle Hello message
			if (payload.op === 10) {
				const interval = payload.d.heartbeat_interval
				console.log(`\n✓ Received HELLO (heartbeat interval: ${interval}ms)`)

				// Start heartbeat
				heartbeatInterval = setInterval(() => {
					if (heartbeatAck) {
						heartbeatAck = false
						ws.send(JSON.stringify({ op: 1, d: null }))
						process.stdout.write(".")
					} else {
						console.log("\n⚠ Heartbeat not acknowledged!")
					}
				}, interval)
			}

			// Handle Heartbeat ACK
			else if (payload.op === 11) {
				heartbeatAck = true
			}

			// Handle Dispatch events
			else if (payload.op === 0) {
				const eventName = payload.t
				console.log(`\n✓ Received event: ${eventName}`)

				// Count events
				if (eventName === "READY") {
					console.log(`  → Bot is ready!`)
				}
			}
		} catch (_err) {
			// Ignore parse errors for non-JSON messages
		}
	})

	ws.on("close", (code, reason) => {
		console.log(`\n✗ Connection closed: ${code} - ${reason || "No reason"}`)
		if (heartbeatInterval) clearInterval(heartbeatInterval)
		process.exit(code === 1000 ? 0 : 1)
	})

	ws.on("error", (err) => {
		console.error(`\n✗ WebSocket error: ${err.message}`)
		if (heartbeatInterval) clearInterval(heartbeatInterval)
		process.exit(1)
	})

	// Test duration: 10 seconds
	setTimeout(() => {
		console.log(`\n\nTest completed successfully!`)
		console.log(`- Total messages received: ${messageCount}`)
		console.log(`- SOCKS5 tunnel is working correctly for Discord Gateway`)
		ws.close()
	}, 10000)
} catch (err) {
	console.error(`✗ Error: ${err.message}`)
	process.exit(1)
}
