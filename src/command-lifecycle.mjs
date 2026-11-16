/**
 * Antigravity Remote — Command Delivery State Machine (Phase 08)
 *
 * Implements:
 * - Explicit prompt lifecycle:
 *   SUBMITTED -> ACCEPTED_BY_BRIDGE -> DELIVERED_TO_IDE -> STARTED -> COMPLETED | FAILED | TIMED_OUT | CANCELLED
 * - Idempotency keys: safe retries without duplicate executions.
 * - Timestamped transitions based exclusively on observed evidence.
 */

import { emitEvent } from './event-bus.mjs';

export const COMMAND_STATE = {
    SUBMITTED: 'SUBMITTED',
    ACCEPTED_BY_BRIDGE: 'ACCEPTED_BY_BRIDGE',
    DELIVERED_TO_IDE: 'DELIVERED_TO_IDE',
    STARTED: 'STARTED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    TIMED_OUT: 'TIMED_OUT',
    CANCELLED: 'CANCELLED'
};

// In-memory tracking of active & recent commands
// idempotencyKey -> { id, key, prompt, state, history: [{state, timestamp, evidence}], deviceId, createdAt }
const activeCommands = new Map();
let commandSeq = 1;

/**
 * Register a submitted prompt with an idempotency key.
 * If the key already exists, returns the existing command state without resubmitting.
 */
export function registerCommand(promptText, idempotencyKey, deviceId = 'unknown', projectId = 'default') {
    const key = String(idempotencyKey || `cmd_${Date.now()}_${commandSeq++}`);

    if (activeCommands.has(key)) {
        const existing = activeCommands.get(key);
        return {
            isDuplicate: true,
            command: existing
        };
    }

    const now = new Date().toISOString();
    const command = {
        id: `cmd_${commandSeq++}`,
        key,
        prompt: promptText,
        state: COMMAND_STATE.ACCEPTED_BY_BRIDGE,
        deviceId,
        projectId,
        createdAt: now,
        history: [
            { state: COMMAND_STATE.SUBMITTED, timestamp: now, evidence: 'client_request_received' },
            { state: COMMAND_STATE.ACCEPTED_BY_BRIDGE, timestamp: now, evidence: 'idempotency_registered' }
        ]
    };

    activeCommands.set(key, command);

    // Bounded map size: prune oldest if > 200 commands
    if (activeCommands.size > 200) {
        const oldestKey = activeCommands.keys().next().value;
        activeCommands.delete(oldestKey);
    }

    emitEvent('command_lifecycle', {
        commandId: command.id,
        key: command.key,
        state: command.state,
        history: command.history
    }, 'observed', projectId);

    return {
        isDuplicate: false,
        command
    };
}

/**
 * Transition command state with observed evidence.
 */
export function transitionCommand(idOrKey, newState, evidence = '') {
    let command = activeCommands.get(idOrKey);
    if (!command) {
        for (const cmd of activeCommands.values()) {
            if (cmd.id === idOrKey || cmd.key === idOrKey) {
                command = cmd;
                break;
            }
        }
    }
    if (!command) return null;

    // Terminal states cannot be transitioned further
    const terminalStates = [COMMAND_STATE.COMPLETED, COMMAND_STATE.FAILED, COMMAND_STATE.TIMED_OUT, COMMAND_STATE.CANCELLED];
    if (terminalStates.includes(command.state)) {
        return command;
    }

    const now = new Date().toISOString();
    command.state = newState;
    command.history.push({
        state: newState,
        timestamp: now,
        evidence: typeof evidence === 'object' ? JSON.stringify(evidence) : String(evidence)
    });

    emitEvent('command_lifecycle', {
        commandId: command.id,
        key: command.key,
        state: command.state,
        evidence,
        history: command.history
    }, 'observed', command.projectId);

    return command;
}

export function getCommand(idOrKey) {
    if (activeCommands.has(idOrKey)) return activeCommands.get(idOrKey);
    for (const cmd of activeCommands.values()) {
        if (cmd.id === idOrKey || cmd.key === idOrKey) return cmd;
    }
    return null;
}

export function listRecentCommands(limit = 50) {
    return Array.from(activeCommands.values()).slice(-limit);
}

export const commandLifecycle = {
    STATES: COMMAND_STATE,
    registerCommand,
    transition: transitionCommand,
    transitionCommand,
    getCommand,
    listRecentCommands
};
