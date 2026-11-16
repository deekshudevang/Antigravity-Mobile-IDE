/**
 * Task & Progress Parser (Phase 12)
 * 
 * Parses task.md to extract phases, progress, current focus, blockers,
 * and pending manual verification items.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export function parseTaskMarkdown(content) {
    if (!content || typeof content !== 'string') {
        return {
            phases: [],
            currentFocus: '',
            blockers: [],
            pendingManual: [],
            summary: { total: 0, verified: 0, completed: 0, inProgress: 0, pending: 0, percent: 0 }
        };
    }

    const lines = content.split(/\r?\n/);
    let currentFocus = '';
    const blockers = [];
    const pendingManual = [];
    const phases = [];

    let currentSection = null;
    let currentPhase = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect major sections
        if (line.startsWith('## Current Focus')) {
            currentSection = 'FOCUS';
            continue;
        } else if (line.startsWith('## Blockers')) {
            currentSection = 'BLOCKERS';
            continue;
        } else if (line.startsWith('## PENDING_MANUAL')) {
            currentSection = 'PENDING_MANUAL';
            continue;
        } else if (line.startsWith('## Phase Tracking')) {
            currentSection = 'PHASES';
            continue;
        } else if (line.startsWith('## ') || line.startsWith('# ')) {
            currentSection = 'OTHER';
        }

        // Section content extraction
        if (currentSection === 'FOCUS') {
            if (line && !line.startsWith('#')) {
                currentFocus += (currentFocus ? ' ' : '') + line;
            }
        } else if (currentSection === 'BLOCKERS') {
            if (line.startsWith('- ') || line.startsWith('* ')) {
                blockers.push(line.replace(/^[-*]\s+/, ''));
            }
        } else if (currentSection === 'PENDING_MANUAL') {
            const pmMatch = line.match(/^\d+\.\s+\*\*(PM-\d+.*?)\*\*:\s*(.*)$/);
            if (pmMatch) {
                pendingManual.push({
                    id: pmMatch[1],
                    title: pmMatch[2] || pmMatch[1]
                });
            }
        } else if (currentSection === 'PHASES') {
            const phaseHeaderMatch = line.match(/^###\s+Phase\s+(\d+):\s*(.*)$/i);
            if (phaseHeaderMatch) {
                if (currentPhase) phases.push(currentPhase);
                currentPhase = {
                    id: phaseHeaderMatch[1],
                    number: parseInt(phaseHeaderMatch[1], 10),
                    name: phaseHeaderMatch[2],
                    objective: '',
                    status: 'NOT_STARTED',
                    files: [],
                    tests: []
                };
                continue;
            }

            if (currentPhase) {
                if (line.startsWith('- **Objective**:')) {
                    currentPhase.objective = line.replace('- **Objective**:', '').trim();
                } else if (line.startsWith('- **Status**:')) {
                    const statusText = line.replace('- **Status**:', '').trim();
                    if (statusText.includes('VERIFIED')) currentPhase.status = 'VERIFIED';
                    else if (statusText.includes('COMPLETED')) currentPhase.status = 'COMPLETED';
                    else if (statusText.includes('IN_PROGRESS')) currentPhase.status = 'IN_PROGRESS';
                    else if (statusText.includes('BLOCKED')) currentPhase.status = 'BLOCKED';
                    else if (statusText.includes('READY_FOR_MANUAL_VERIFICATION')) currentPhase.status = 'READY_FOR_MANUAL_VERIFICATION';
                    else currentPhase.status = 'NOT_STARTED';
                }
            }
        }
    }

    if (currentPhase) phases.push(currentPhase);

    // Calculate progress summary
    const total = phases.length;
    const verified = phases.filter(p => p.status === 'VERIFIED').length;
    const completed = phases.filter(p => p.status === 'COMPLETED').length;
    const inProgress = phases.filter(p => p.status === 'IN_PROGRESS' || p.status === 'READY_FOR_MANUAL_VERIFICATION').length;
    const pending = phases.filter(p => p.status === 'NOT_STARTED').length;
    const percent = total > 0 ? Math.round(((verified + (completed * 0.8) + (inProgress * 0.3)) / total) * 100) : 0;

    return {
        phases,
        currentFocus,
        blockers,
        pendingManual,
        summary: {
            total,
            verified,
            completed,
            inProgress,
            pending,
            percent
        }
    };
}

export function getTaskProgress(projectRoot = process.cwd()) {
    const taskPath = join(projectRoot, 'task.md');
    if (!existsSync(taskPath)) {
        return { error: 'task.md not found', phases: [], summary: { total: 0, percent: 0 } };
    }
    try {
        const content = readFileSync(taskPath, 'utf-8');
        return { success: true, ...parseTaskMarkdown(content) };
    } catch (e) {
        return { error: e.message, phases: [], summary: { total: 0, percent: 0 } };
    }
}
