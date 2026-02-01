/**
 * Parse proxy URL to determine type and options
 */
interface ProxyConfig {
	url: string
	type: "http" | "https" | "socks" | "socks5" | "socks4"
}

function parseProxyUrl(proxyUrl: string): ProxyConfig | null {
	try {
		const url = new URL(proxyUrl)
		const protocol = url.protocol.replace(":", "")

		if (["http", "https", "socks", "socks5", "socks4"].includes(protocol)) {
			return {
				url: proxyUrl,
				type: protocol as "http" | "https" | "socks" | "socks5" | "socks4"
			}
		}

		return null
	} catch {
		return null
	}
}

/**
 * Get proxy URL from environment variables or configuration
 *
 * Priority:
 * 1. configuredProxy (passed directly)
 * 2. DISCORD_HTTP_PROXY environment variable
 * 3. HTTP_PROXY / HTTPS_PROXY environment variables (fallback)
 *
 * @param configuredProxy - Proxy URL from options
 * @returns Proxy URL string or null if no proxy is configured
 */
export function getProxyUrl(configuredProxy?: string): string | null {
	// 1. Use configured proxy if provided
	if (configuredProxy) {
		return configuredProxy
	}

	// 2. Check Discord-specific proxy environment variable
	const discordProxy = process.env.DISCORD_HTTP_PROXY
	if (discordProxy) {
		return discordProxy
	}

	// 3. Fall back to generic proxy variables
	const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy
	if (httpsProxy) {
		return httpsProxy
	}

	const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy
	if (httpProxy) {
		return httpProxy
	}

	// 4. Check ALL_PROXY (supports SOCKS)
	const allProxy = process.env.ALL_PROXY || process.env.all_proxy
	if (allProxy) {
		return allProxy
	}

	return null
}

/**
 * Create a proxy agent for the current runtime
 *
 * Supports:
 * - HTTP/HTTPS proxies via https-proxy-agent
 * - SOCKS4/5 proxies via socks-proxy-agent
 *
 * @param proxyUrl - The proxy URL to create an agent for
 * @returns Proxy agent instance or null if not supported
 */
export function createProxyAgent(
	proxyUrl: string
): { agent: unknown; dispatcher: unknown } | null {
	// Validate proxy URL format
	if (!proxyUrl || typeof proxyUrl !== "string") {
		return null
	}

	const parsed = parseProxyUrl(proxyUrl)
	if (!parsed) {
		console.warn(`[Carbon] Invalid proxy URL format: ${proxyUrl}`)
		return null
	}

	try {
		// Check if we're in a Node.js environment
		if (typeof process !== "undefined" && process.versions?.node) {
			let Agent: new (url: string) => { agent: unknown; dispatcher: unknown }

			// Select appropriate agent based on proxy type
			if (parsed.type.startsWith("socks")) {
				// Use SOCKS proxy agent
				try {
					const SocksProxyAgent = require("socks-proxy-agent")
					Agent = SocksProxyAgent.SocksProxyAgent
					console.log(`[Carbon] Using SOCKS proxy: ${parsed.url}`)
				} catch (_err) {
					console.warn(
						`[Carbon] SOCKS proxy requested but socks-proxy-agent not installed. Run: npm install socks-proxy-agent`
					)
					return null
				}
			} else {
				// Use HTTP/HTTPS proxy agent
				try {
					const HttpsProxyAgent = require("https-proxy-agent")
					Agent = HttpsProxyAgent.HttpsProxyAgent
					console.log(`[Carbon] Using HTTP proxy: ${parsed.url}`)
				} catch (_err) {
					console.warn(
						`[Carbon] HTTP proxy requested but https-proxy-agent not installed. Run: npm install https-proxy-agent`
					)
					return null
				}
			}

			const agent = new Agent(parsed.url)
			// Return both agent and dispatcher for compatibility
			// - agent: for ws library (WebSocket)
			// - dispatcher: for undici fetch API
			return { agent, dispatcher: agent }
		}
	} catch (err) {
		// Log error for debugging
		console.error(`[Carbon] Failed to create proxy agent: ${err}`)
	}

	return null
}
