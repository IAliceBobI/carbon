/**
 * Parse proxy URL to determine type and options
 */
interface ProxyConfig {
	url: string
	type: "http" | "https" | "socks" | "socks5" | "socks5h" | "socks4" | "socks4a"
}

function parseProxyUrl(proxyUrl: string): ProxyConfig | null {
	try {
		const url = new URL(proxyUrl)
		const protocol = url.protocol.replace(":", "")

		if (
			[
				"http",
				"https",
				"socks",
				"socks5",
				"socks5h",
				"socks4",
				"socks4a"
			].includes(protocol)
		) {
			return {
				url: proxyUrl,
				type: protocol as
					| "http"
					| "https"
					| "socks"
					| "socks5"
					| "socks5h"
					| "socks4"
					| "socks4a"
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
 * 2. DISCORD_SOCKS_PROXY environment variable (for SOCKS proxies)
 * 3. DISCORD_HTTP_PROXY environment variable (for HTTP/HTTPS proxies)
 * 4. HTTP_PROXY / HTTPS_PROXY environment variables (fallback)
 *
 * @param configuredProxy - Proxy URL from options
 * @returns Proxy URL string or null if no proxy is configured
 */
export function getProxyUrl(configuredProxy?: string): string | null {
	// 1. Use configured proxy if provided
	if (configuredProxy) {
		return configuredProxy
	}

	// 2. Check Discord-specific SOCKS proxy environment variable
	const discordSocksProxy = process.env.DISCORD_SOCKS_PROXY
	if (discordSocksProxy) {
		return discordSocksProxy
	}

	// 3. Check Discord-specific HTTP proxy environment variable
	const discordProxy = process.env.DISCORD_HTTP_PROXY
	if (discordProxy) {
		return discordProxy
	}

	// 4. Fall back to generic proxy variables
	const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy
	if (httpsProxy) {
		return httpsProxy
	}

	const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy
	if (httpProxy) {
		return httpProxy
	}

	// 5. Check ALL_PROXY (supports SOCKS)
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
 * - HTTP/HTTPS proxies via undici's ProxyAgent
 * - SOCKS4/5 proxies via socks-proxy-agent (for WebSocket)
 * - SOCKS5H/SOCKS4A proxies with remote DNS resolution (avoids DNS pollution)
 *
 * Protocol suffixes:
 * - socks5:// - Local DNS resolution (default)
 * - socks5h:// - Remote DNS resolution via proxy (recommended for DNS pollution issues)
 * - socks4:// - SOCKS4 with local DNS
 * - socks4a:// - SOCKS4A with remote DNS
 *
 * @param proxyUrl - The proxy URL to create an agent for
 * @returns Proxy agent instance or null if not supported
 */
export async function createProxyAgent(
	proxyUrl: string
): Promise<{ agent: unknown; dispatcher: unknown } | null> {
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
			// Try to use undici's ProxyAgent for HTTP/HTTPS proxies
			if (!parsed.type.startsWith("socks")) {
				try {
					// Use undici's built-in ProxyAgent with dynamic import
					const { ProxyAgent } = await import("undici")
					const dispatcher = new ProxyAgent(parsed.url)
					console.log(`[Carbon] Using HTTP proxy: ${parsed.url}`)
					// Return both agent and dispatcher for compatibility
					// - agent: for ws library (WebSocket) - will be created from https-proxy-agent if needed
					// - dispatcher: for undici fetch API
					return { agent: null, dispatcher }
				} catch (err) {
					// Undici ProxyAgent not available, fall back to https-proxy-agent
					console.warn(`[Carbon] Undici ProxyAgent failed: ${err}`)
				}
			}

			// For SOCKS proxies or fallback, use socks-proxy-agent or https-proxy-agent
			if (parsed.type.startsWith("socks")) {
				// Use SOCKS proxy agent
				try {
					const { SocksProxyAgent } = await import("socks-proxy-agent")
					// Add timeout configuration to prevent hanging connections
					const agent = new SocksProxyAgent(parsed.url, {
						timeout: 30000 // 30 second timeout
					})
					console.log(`[Carbon] Using SOCKS proxy: ${parsed.url}`)
					// Return both agent and dispatcher for compatibility
					// - agent: for ws library (WebSocket)
					// - dispatcher: for undici fetch API (may not work with legacy agents)
					return { agent, dispatcher: null }
				} catch (_err) {
					console.warn(
						`[Carbon] SOCKS proxy requested but socks-proxy-agent not installed. Run: npm install socks-proxy-agent`
					)
					return null
				}
			} else {
				// Use HTTP/HTTPS proxy agent as fallback
				try {
					const { HttpsProxyAgent } = await import("https-proxy-agent")
					const agent = new HttpsProxyAgent(parsed.url)
					console.log(`[Carbon] Using HTTP proxy (legacy): ${parsed.url}`)
					// Return both agent and dispatcher for compatibility
					// - agent: for ws library (WebSocket)
					// - dispatcher: for undici fetch API (may not work with legacy agents)
					return { agent, dispatcher: null }
				} catch (_err) {
					console.warn(
						`[Carbon] HTTP proxy requested but https-proxy-agent not installed. Run: npm install https-proxy-agent`
					)
					return null
				}
			}
		}
	} catch (err) {
		// Log error for debugging
		console.error(`[Carbon] Failed to create proxy agent: ${err}`)
	}

	return null
}
