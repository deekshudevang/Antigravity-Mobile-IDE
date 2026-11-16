package de.xyourp.antigravitymobile.data

/**
 * User-configured connection to the Antigravity Remote bridge.
 * Supports Tailscale HTTPS, Bearer access tokens, and rotating refresh credentials.
 */
data class ConnectionSettings(
    val host: String = "",
    val restPort: Int = 5000,
    val wsPort: Int = 5000,
    val useTls: Boolean = false,
    val deviceId: String = "",
    val accessToken: String = "",
    val refreshToken: String = "",
    /** Legacy alias for accessToken; sent as x-device-token and Bearer. */
    val deviceToken: String = "",
) {
    val cleanHost: String get() {
        var h = host.trim()
        if (h.startsWith("https://", ignoreCase = true)) h = h.substring(8)
        if (h.startsWith("http://", ignoreCase = true)) h = h.substring(7)
        if (h.contains("/")) h = h.substringBefore("/")
        if (h.contains(":")) h = h.substringBefore(":")
        return h
    }

    val isConfigured: Boolean get() = cleanHost.isNotBlank()
    val isPaired: Boolean get() = accessToken.isNotBlank() || deviceToken.isNotBlank()

    val effectiveToken: String get() = accessToken.ifBlank { deviceToken }

    val httpScheme: String get() = if (useTls || restPort == 443 || cleanHost.endsWith(".ts.net")) "https" else "http"
    val wsScheme: String get() = if (useTls || wsPort == 443 || cleanHost.endsWith(".ts.net")) "wss" else "ws"

    val restBaseUrl: String get() = "$httpScheme://$cleanHost:$restPort"
    val wsUrl: String get() {
        val base = "$wsScheme://$cleanHost:$wsPort"
        return if (effectiveToken.isNotBlank()) "$base?token=$effectiveToken" else base
    }

    fun restUrl(path: String): String =
        restBaseUrl + (if (path.startsWith("/")) path else "/$path")
}
