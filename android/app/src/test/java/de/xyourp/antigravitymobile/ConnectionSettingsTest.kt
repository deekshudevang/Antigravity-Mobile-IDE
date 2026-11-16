package de.xyourp.antigravitymobile

import de.xyourp.antigravitymobile.data.ConnectionSettings
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ConnectionSettingsTest {

    @Test
    fun testDefaultSettings() {
        val settings = ConnectionSettings()
        assertFalse(settings.isConfigured)
        assertFalse(settings.isPaired)
        assertEquals("http://:5000", settings.restBaseUrl)
        assertEquals("ws://:5000", settings.wsUrl)
    }

    @Test
    fun testTailscaleSchemeAutoDetection() {
        // Plain IP uses http by default
        val localSettings = ConnectionSettings(host = "192.168.1.5", restPort = 5000)
        assertEquals("http", localSettings.httpScheme)
        assertEquals("ws", localSettings.wsScheme)
        assertEquals("http://192.168.1.5:5000/api/status", localSettings.restUrl("/api/status"))

        // Tailscale MagicDNS host (.ts.net) auto-detects https and wss
        val tsSettings = ConnectionSettings(host = "laptop-win11.tailnet-xyz.ts.net", restPort = 5000)
        assertEquals("https", tsSettings.httpScheme)
        assertEquals("wss", tsSettings.wsScheme)
        assertEquals("https://laptop-win11.tailnet-xyz.ts.net:5000/api/status", tsSettings.restUrl("/api/status"))

        // Explicit useTls flag
        val explicitTls = ConnectionSettings(host = "100.64.1.2", restPort = 5000, useTls = true)
        assertEquals("https", explicitTls.httpScheme)
        assertEquals("wss", explicitTls.wsScheme)
    }

    @Test
    fun testEffectiveTokenAndPairingState() {
        // Legacy device token
        val legacy = ConnectionSettings(host = "localhost", deviceToken = "legacy_token_123")
        assertTrue(legacy.isPaired)
        assertEquals("legacy_token_123", legacy.effectiveToken)

        // New access token takes precedence
        val modern = ConnectionSettings(
            host = "localhost",
            accessToken = "agt_modern_token_456",
            refreshToken = "agr_refresh_789"
        )
        assertTrue(modern.isPaired)
        assertEquals("agt_modern_token_456", modern.effectiveToken)
        assertEquals("ws://localhost:5000?token=agt_modern_token_456", modern.wsUrl)
    }
}
