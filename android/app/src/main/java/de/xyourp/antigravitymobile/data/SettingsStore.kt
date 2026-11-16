package de.xyourp.antigravitymobile.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "antigravity_settings")

/** Persists connection settings and encrypted credentials in DataStore. */
class SettingsStore(private val context: Context) {

    private object Keys {
        val HOST = stringPreferencesKey("host")
        val REST_PORT = intPreferencesKey("rest_port")
        val WS_PORT = intPreferencesKey("ws_port")
        val USE_TLS = booleanPreferencesKey("use_tls")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val ENCRYPTED_ACCESS_TOKEN = stringPreferencesKey("enc_access_token")
        val ENCRYPTED_REFRESH_TOKEN = stringPreferencesKey("enc_refresh_token")
        val MODEL = stringPreferencesKey("selected_model")
        val CURSOR_SIZE = intPreferencesKey("cursor_size")
        val CURSOR_ALPHA = floatPreferencesKey("cursor_alpha")
        val CURSOR_TILT = floatPreferencesKey("cursor_tilt")
        val CURSOR_OFFSET_Y = floatPreferencesKey("cursor_offset_y")
        val IS_MOUSE_MODE = booleanPreferencesKey("is_mouse_mode")
        val LAST_TAB = stringPreferencesKey("last_tab")
    }

    val settings: Flow<ConnectionSettings> = context.dataStore.data.map { p ->
        val encAccess = p[Keys.ENCRYPTED_ACCESS_TOKEN].orEmpty()
        val encRefresh = p[Keys.ENCRYPTED_REFRESH_TOKEN].orEmpty()
        val decryptedAccess = KeyStoreHelper.decrypt(encAccess)
        val decryptedRefresh = KeyStoreHelper.decrypt(encRefresh)

        ConnectionSettings(
            host = p[Keys.HOST] ?: "",
            restPort = p[Keys.REST_PORT] ?: 5000,
            wsPort = p[Keys.WS_PORT] ?: 5000,
            useTls = p[Keys.USE_TLS] ?: false,
            deviceId = p[Keys.DEVICE_ID] ?: "",
            accessToken = decryptedAccess,
            refreshToken = decryptedRefresh,
            deviceToken = decryptedAccess,
        )
    }

    val selectedModel: Flow<String?> = context.dataStore.data.map { it[Keys.MODEL] }
    val cursorSize: Flow<Int> = context.dataStore.data.map { it[Keys.CURSOR_SIZE] ?: 32 }
    val cursorAlpha: Flow<Float> = context.dataStore.data.map { it[Keys.CURSOR_ALPHA] ?: 1.0f }
    val cursorTilt: Flow<Float> = context.dataStore.data.map { it[Keys.CURSOR_TILT] ?: 0f }
    val cursorOffsetY: Flow<Float> = context.dataStore.data.map { it[Keys.CURSOR_OFFSET_Y] ?: 0f }
    val isMouseMode: Flow<Boolean> = context.dataStore.data.map { it[Keys.IS_MOUSE_MODE] ?: false }
    val lastTab: Flow<String?> = context.dataStore.data.map { it[Keys.LAST_TAB] }

    suspend fun saveConnection(settings: ConnectionSettings) {
        context.dataStore.edit { p ->
            p[Keys.HOST] = settings.host.trim()
            p[Keys.REST_PORT] = settings.restPort
            p[Keys.WS_PORT] = settings.wsPort
            p[Keys.USE_TLS] = settings.useTls
        }
    }

    suspend fun saveTokens(accessToken: String, refreshToken: String, deviceId: String) {
        context.dataStore.edit { p ->
            p[Keys.DEVICE_ID] = deviceId
            p[Keys.ENCRYPTED_ACCESS_TOKEN] = KeyStoreHelper.encrypt(accessToken)
            p[Keys.ENCRYPTED_REFRESH_TOKEN] = KeyStoreHelper.encrypt(refreshToken)
        }
    }

    suspend fun saveDeviceToken(token: String) {
        context.dataStore.edit { p ->
            p[Keys.ENCRYPTED_ACCESS_TOKEN] = KeyStoreHelper.encrypt(token)
        }
    }

    suspend fun clearTokens() {
        context.dataStore.edit { p ->
            p.remove(Keys.DEVICE_ID)
            p.remove(Keys.ENCRYPTED_ACCESS_TOKEN)
            p.remove(Keys.ENCRYPTED_REFRESH_TOKEN)
        }
    }

    suspend fun saveSelectedModel(model: String) {
        context.dataStore.edit { it[Keys.MODEL] = model }
    }

    suspend fun saveCursorSize(size: Int) {
        context.dataStore.edit { it[Keys.CURSOR_SIZE] = size }
    }

    suspend fun saveCursorAlpha(alpha: Float) {
        context.dataStore.edit { it[Keys.CURSOR_ALPHA] = alpha }
    }

    suspend fun saveCursorTilt(tilt: Float) {
        context.dataStore.edit { it[Keys.CURSOR_TILT] = tilt }
    }

    suspend fun saveCursorOffsetY(offsetY: Float) {
        context.dataStore.edit { it[Keys.CURSOR_OFFSET_Y] = offsetY }
    }

    suspend fun saveIsMouseMode(isMouseMode: Boolean) {
        context.dataStore.edit { it[Keys.IS_MOUSE_MODE] = isMouseMode }
    }

    suspend fun saveLastTab(tab: String) {
        context.dataStore.edit { it[Keys.LAST_TAB] = tab }
    }
}
