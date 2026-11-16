package de.xyourp.antigravitymobile

import de.xyourp.antigravitymobile.net.*
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ApiModelsSerializationTest {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    @Test
    fun testStatusResponseDeserialization() {
        val payload = """{"status":"ok","authEnabled":true,"uptime":1234.56}"""
        val parsed = json.decodeFromString<StatusResponse>(payload)
        assertEquals("ok", parsed.status)
        assertTrue(parsed.authEnabled)
        assertEquals(1234.56, parsed.uptime, 0.001)
    }

    @Test
    fun testPairResponseDeserialization() {
        val payload = """
            {
                "success": true,
                "accessToken": "agt_test_token_123",
                "refreshToken": "agr_test_refresh_456",
                "deviceId": "dev_phone_789",
                "expiresIn": 900,
                "capabilities": ["prompt.submit", "conversation.read"]
            }
        """.trimIndent()
        val parsed = json.decodeFromString<PairResponse>(payload)
        assertTrue(parsed.success)
        assertEquals("agt_test_token_123", parsed.accessToken)
        assertEquals("agr_test_refresh_456", parsed.refreshToken)
        assertEquals("dev_phone_789", parsed.deviceId)
        assertEquals(900, parsed.expiresIn)
        assertEquals(2, parsed.capabilities.size)
    }

    @Test
    fun testTasksResponseDeserialization() {
        val payload = """
            {
                "success": true,
                "currentFocus": "Implementing Stage B secure slice",
                "blockers": ["MSVC linker missing"],
                "phases": [
                    {
                        "id": "phase-01",
                        "number": 1,
                        "name": "Repository Intelligence",
                        "objective": "Audit codebase",
                        "status": "VERIFIED"
                    }
                ],
                "summary": {
                    "total": 18,
                    "verified": 2,
                    "completed": 6,
                    "inProgress": 1,
                    "pending": 9,
                    "percent": 44
                }
            }
        """.trimIndent()
        val parsed = json.decodeFromString<TasksResponse>(payload)
        assertTrue(parsed.success)
        assertEquals("Implementing Stage B secure slice", parsed.currentFocus)
        assertEquals(1, parsed.blockers.size)
        assertEquals(1, parsed.phases.size)
        assertEquals("VERIFIED", parsed.phases[0].status)
        assertEquals(44, parsed.summary.percent)
    }

    @Test
    fun testAgentStateResponseDeserialization() {
        val payload = """{"success":true,"state":"running","source":"observed","selector":".spinner"}"""
        val parsed = json.decodeFromString<AgentStateResponse>(payload)
        assertTrue(parsed.success)
        assertEquals("running", parsed.state)
        assertEquals("observed", parsed.source)
        assertEquals(".spinner", parsed.selector)
    }
}
