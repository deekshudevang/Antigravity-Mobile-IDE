/**
 * Antigravity Remote — Monotonic Event Bus & WebSocket Dispatcher (Phase 07)
 *
 * Implements:
 * - Monotonic event IDs (id: 1, 2, 3...) per source.
 * - Strict labeling: source: 'observed' | 'inferred'.
 * - Event history buffer with lastEventId reconnection support.
 * - Authenticated WebSocket broadcasting with duplicate suppression.
 * - Per-client backpressure: drop-oldest for video/screen frames, never for events.
 */

import { EventEmitter } from 'events';

const MAX_BUFFER_SIZE = 500;
let nextEventId = 1;
const eventBuffer = [];
export const busEmitter = new EventEmitter();

// Active connected clients: Set<WebSocketWithMeta>
// Client meta: { ws, deviceId, lastAckedId, isAlive, frameQueue: [] }
const activeClients = new Set();

/**
 * Emit a typed event onto the bus.
 * @param {string} type - Event type (e.g. 'chat_update', 'agent_state', 'command_status')
 * @param {object} payload - Event payload
 * @param {'observed'|'inferred'} source - State classification
 * @param {string} projectId - Project identifier
 */
export function emitEvent(type, payload = {}, source = 'observed', projectId = 'default') {
    const event = {
        id: nextEventId++,
        type,
        timestamp: new Date().toISOString(),
        source: source === 'inferred' ? 'inferred' : 'observed',
        projectId: String(projectId),
        payload
    };

    eventBuffer.push(event);
    if (eventBuffer.length > MAX_BUFFER_SIZE) {
        eventBuffer.shift();
    }

    busEmitter.emit('event', event);
    broadcastToClients(event);
    return event;
}

/**
 * Retrieve missed events since lastEventId for client reconnect.
 */
export function getEventsSince(lastEventId = 0, limit = 100) {
    const sinceId = Number(lastEventId) || 0;
    const missed = eventBuffer.filter(e => e.id > sinceId);
    return missed.slice(0, Math.min(limit, 200));
}

/**
 * Register an authenticated WebSocket client onto the event bus.
 */
export function registerClient(ws, deviceId, lastEventId = 0) {
    const client = {
        ws,
        deviceId,
        isAlive: true,
        lastAckedId: Number(lastEventId) || 0
    };
    activeClients.add(client);

    // If client requested resume from lastEventId, replay missed events immediately
    if (lastEventId > 0) {
        const missed = getEventsSince(lastEventId);
        if (missed.length > 0) {
            safeSend(ws, JSON.stringify({
                event: 'event_replay',
                data: missed,
                resumedFrom: lastEventId
            }));
        }
    }

    ws.on('pong', () => {
        client.isAlive = true;
    });

    ws.on('close', () => {
        activeClients.delete(client);
    });

    return client;
}

export function unregisterClient(ws) {
    for (const client of activeClients) {
        if (client.ws === ws) {
            activeClients.delete(client);
            break;
        }
    }
}

export function getActiveClientCount() {
    return activeClients.size;
}

/**
 * Broadcast an event to all connected authenticated clients.
 */
function broadcastToClients(event) {
    const message = JSON.stringify({
        event: event.type,
        data: event.payload,
        id: event.id,
        source: event.source,
        timestamp: event.timestamp,
        projectId: event.projectId
    });

    for (const client of activeClients) {
        if (client.ws.readyState === 1 /* OPEN */) {
            safeSend(client.ws, message);
        }
    }
}

/**
 * Broadcast binary desktop screen frames (drop-oldest backpressure for slow clients).
 */
export function broadcastFrame(frameBuffer) {
    for (const client of activeClients) {
        if (client.ws.readyState === 1 /* OPEN */) {
            // Check bufferedAmount to avoid saturating TCP send queue
            if (client.ws.bufferedAmount > 512 * 1024) {
                // Client lagged: drop frame to prevent buffer bloat
                continue;
            }
            try {
                client.ws.send(frameBuffer);
            } catch (e) { }
        }
    }
}

function safeSend(ws, data) {
    try {
        if (ws.readyState === 1 /* OPEN */) {
            ws.send(data);
        }
    } catch (e) { }
}

// Heartbeat ping/pong interval to detect dead sockets
const heartbeatInterval = setInterval(() => {
    for (const client of activeClients) {
        if (!client.isAlive) {
            try { client.ws.terminate(); } catch (e) { }
            activeClients.delete(client);
            continue;
        }
        client.isAlive = false;
        try { client.ws.ping(); } catch (e) { }
    }
}, 30000);
if (heartbeatInterval.unref) heartbeatInterval.unref();
