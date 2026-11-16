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
    val isConfigured: Boolean get() = host.isNotBlank()
    val isPaired: Boolean get() = accessToken.isNotBlank() || deviceToken.isNotBlank()

    val effectiveToken: String get() = accessToken.ifBlank { deviceToken }

    val httpScheme: String get() = if (useTls || restPort == 443 || host.endsWith(".ts.net")) "https" else "http"
    val wsScheme: String get() = if (useTls || wsPort == 443 || host.endsWith(".ts.net")) "wss" else "ws"

    val restBaseUrl: String get() = "$httpScheme://$host:$restPort"
    val wsUrl: String get() = "$wsScheme://$host:$wsPort"

    fun restUrl(path: String): String =
        restBaseUrl + (if (path.startsWith("/")) path else "/$path")
}
