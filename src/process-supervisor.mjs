/**
 * Process Supervisor & Health Monitoring (Phase 05)
 * 
 * Manages child process lifecycle, bounded exponential backoff, crash rate limits
 * (max 5 restarts in 60s), and comprehensive health status metrics.
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class ProcessSupervisor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.name = options.name || 'worker';
        this.command = options.command;
        this.args = options.args || [];
        this.options = options.options || {};
        this.maxRestartsPerWindow = options.maxRestarts || 5;
        this.windowMs = options.windowMs || 60000;
        this.minBackoffMs = options.minBackoffMs || 1000;
        this.maxBackoffMs = options.maxBackoffMs || 30000;

        this.process = null;
        this.startTime = Date.now();
        this.restartTimestamps = [];
        this.currentBackoff = this.minBackoffMs;
        this.isRunning = false;
        this.restartsTotal = 0;
        this.lastExitCode = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this._spawn();
    }

    _spawn() {
        if (!this.command) return;

        // Check crash rate limit
        const now = Date.now();
        this.restartTimestamps = this.restartTimestamps.filter(t => now - t <= this.windowMs);
        if (this.restartTimestamps.length >= this.maxRestartsPerWindow) {
            this.emit('crashed', {
                name: this.name,
                error: 'Crash rate limit exceeded (max 5 restarts in 60s)',
                restarts: this.restartTimestamps.length
            });
            this.isRunning = false;
            return;
        }

        try {
            this.process = spawn(this.command, this.args, {
                stdio: ['ignore', 'pipe', 'pipe'],
                ...this.options
            });

            this.process.on('error', (err) => {
                this.emit('error', { name: this.name, error: err.message });
            });

            this.process.on('exit', (code, signal) => {
                this.lastExitCode = code;
                this.process = null;
                this.restartsTotal++;
                this.restartTimestamps.push(Date.now());
                this.emit('exit', { name: this.name, code, signal, totalRestarts: this.restartsTotal });

                if (this.isRunning) {
                    setTimeout(() => {
                        this._spawn();
                    }, this.currentBackoff);
                    this.currentBackoff = Math.min(this.currentBackoff * 2, this.maxBackoffMs);
                }
            });

            // Successful start resets backoff after running steadily for 10s
            setTimeout(() => {
                if (this.process && !this.process.killed) {
                    this.currentBackoff = this.minBackoffMs;
                }
            }, 10000);

            this.emit('started', { name: this.name, pid: this.process.pid });
        } catch (e) {
            this.emit('error', { name: this.name, error: e.message });
        }
    }

    stop() {
        this.isRunning = false;
        if (this.process) {
            try {
                this.process.kill();
            } catch (e) { }
            this.process = null;
        }
    }

    getStats() {
        const mem = process.memoryUsage();
        return {
            name: this.name,
            running: this.isRunning && !!this.process,
            pid: this.process?.pid || null,
            uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
            totalRestarts: this.restartsTotal,
            recentRestartsInWindow: this.restartTimestamps.length,
            currentBackoffMs: this.currentBackoff,
            memory: {
                rssMb: Math.round(mem.rss / (1024 * 1024)),
                heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
                heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024))
            }
        };
    }
}

/**
 * Global health probe aggregator for the bridge server
 */
export async function getHealthReport(cdpClient, helperBridge) {
    const mem = process.memoryUsage();
    let cdpAvailable = false;
    try {
        if (cdpClient && typeof cdpClient.isAvailable === 'function') {
            const cdpRes = await cdpClient.isAvailable();
            cdpAvailable = !!(cdpRes && cdpRes.available);
        }
    } catch (e) { }

    let helperConnected = false;
    try {
        if (helperBridge && typeof helperBridge.isConnected === 'function') {
            helperConnected = helperBridge.isConnected();
        }
    } catch (e) { }

    return {
        status: 'healthy',
        service: 'antigravity-remote-bridge',
        version: '2.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        cdp: {
            available: cdpAvailable
        },
        helper: {
            connected: helperConnected
        },
        memory: {
            rssMb: Math.round(mem.rss / (1024 * 1024)),
            heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
            heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024))
        }
    };
}
