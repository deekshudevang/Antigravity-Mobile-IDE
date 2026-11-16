/**
 * Antigravity DOM Adapter (Phase 06)
 * 
 * Centralises all DOM selectors and browser-context evaluation scripts for
 * Antigravity IDE and Antigravity 2.0.
 * 
 * Includes fingerprint verification: if the Antigravity frontend updates
 * and changes its DOM structure, the fingerprint check fails loudly with
 * an "integration_incompatible" error rather than silently failing.
 */

export const ADAPTER_VERSION = '2.0.0';

// Canonical selectors categorized by function
export const SELECTORS = {
    // Input elements for prompt submission
    INPUT: [
        'textarea.inputarea',
        'textarea[aria-label*="input" i]',
        '[data-testid="chat-input"]',
        '[data-testid="prompt-input"]',
        'div[contenteditable="true"]',
        '.monaco-inputbox textarea',
        '.input-area textarea',
        'textarea'
    ],

    // Submit / send triggers
    SUBMIT: [
        'button[data-testid="send-button"]',
        'button[data-testid="submit-button"]',
        'button[aria-label*="Send" i]',
        'button[aria-label*="Submit" i]',
        'button.send-btn'
    ],

    // Agent cancellation / stop buttons
    STOP: [
        'button.stop-btn',
        '[data-testid="running-confirm-stop"]',
        '[data-testid="running-row-stop"]',
        '[data-testid="subagent-stop"]',
        'button[aria-label*="Stop" i]',
        'button[aria-label*="Cancel" i]',
        '.codicon-debug-stop'
    ],

    // Approval dialogs and action confirmations
    APPROVAL: {
        CONTAINERS: [
            '[data-testid*="approval"]',
            '[data-testid*="confirm"]',
            '.approval-card',
            '.confirmation-dialog',
            '[role="alertdialog"]',
            '[role="dialog"]'
        ],
        APPROVE: [
            'button[data-testid*="approve"]',
            'button[data-testid*="accept"]',
            'button[data-testid*="run"]',
            'button[data-testid*="allow"]',
            'button[aria-label*="Approve" i]',
            'button[aria-label*="Accept" i]',
            'button[aria-label*="Run" i]',
            'button[aria-label*="Allow" i]'
        ],
        REJECT: [
            'button[data-testid*="reject"]',
            'button[data-testid*="deny"]',
            'button[data-testid*="cancel"]',
            'button[aria-label*="Reject" i]',
            'button[aria-label*="Cancel" i]',
            'button[aria-label*="Deny" i]'
        ]
    },

    // Agent state indicators (observed from live DOM)
    STATE_INDICATORS: {
        RUNNING: [
            '[data-testid="running-confirm-stop"]',
            '[data-testid="running-row-stop"]',
            '.codicon-loading',
            '.codicon-sync~.anim-rotate',
            '.spinner',
            '[aria-label*="Thinking" i]',
            '[aria-label*="Running" i]'
        ],
        WAITING_APPROVAL: [
            '[data-testid*="approval"]',
            '[data-testid*="confirm"]',
            '.approval-prompt'
        ]
    },

    // App signature markers for fingerprint validation
    SIGNATURES: {
        IDE: [
            '.monaco-workbench',
            '.monaco-editor',
            '[id*="workbench"]',
            '.part.sidebar',
            '.auxiliary-bar-content'
        ],
        APP: [
            '#root',
            '[data-testid*="chat"]',
            '[data-testid*="conversation"]',
            '.chat-container'
        ]
    }
};

/**
 * Returns a self-contained JS expression to evaluate inside the target browser
 * to detect DOM fingerprint, version compatibility, and active app type.
 */
export function buildFingerprintScript() {
    return `(function() {
        const ideMatches = ${JSON.stringify(SELECTORS.SIGNATURES.IDE)}.filter(s => !!document.querySelector(s));
        const appMatches = ${JSON.stringify(SELECTORS.SIGNATURES.APP)}.filter(s => !!document.querySelector(s));

        const hasInputs = ${JSON.stringify(SELECTORS.INPUT)}.some(s => !!document.querySelector(s));
        const hasStop = ${JSON.stringify(SELECTORS.STOP)}.some(s => !!document.querySelector(s));

        let appType = 'unknown';
        if (ideMatches.length > 0) appType = 'ide';
        else if (appMatches.length > 0) appType = 'app';

        const score = (ideMatches.length * 20) + (appMatches.length * 20) + (hasInputs ? 30 : 0);
        const compatible = score >= 30;

        return {
            compatible,
            adapterVersion: '${ADAPTER_VERSION}',
            appType,
            score,
            hasInputs,
            hasStop,
            matchedSignatures: [...ideMatches, ...appMatches],
            timestamp: new Date().toISOString()
        };
    })()`;
}

/**
 * Returns a self-contained JS expression to focus the prompt input field.
 */
export function buildFocusInputScript() {
    return `(function() {
        const selectors = ${JSON.stringify(SELECTORS.INPUT)};
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) {
                el.focus();
                if (typeof el.click === 'function') el.click();
                return { found: true, selector: sel, tag: el.tagName };
            }
        }
        return { found: false, error: 'no_supported_input_element' };
    })()`;
}

/**
 * Returns a self-contained JS expression to inspect current agent state.
 */
export function buildDetectStateScript() {
    return `(function() {
        // 1. Check if waiting for approval
        const approvalContainers = ${JSON.stringify(SELECTORS.APPROVAL.CONTAINERS)};
        for (const sel of approvalContainers) {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) {
                return { state: 'waiting_approval', source: 'observed', selector: sel };
            }
        }

        // 2. Check if running
        const runningIndicators = ${JSON.stringify(SELECTORS.STATE_INDICATORS.RUNNING)};
        for (const sel of runningIndicators) {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) {
                return { state: 'running', source: 'observed', selector: sel };
            }
        }

        // 3. Otherwise agent is idle
        return { state: 'idle', source: 'observed' };
    })()`;
}

/**
 * Returns a self-contained JS expression to extract any pending approval details.
 */
export function buildExtractApprovalScript() {
    return `(function() {
        const containers = ${JSON.stringify(SELECTORS.APPROVAL.CONTAINERS)};
        let targetContainer = null;
        for (const sel of containers) {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) {
                targetContainer = el;
                break;
            }
        }

        if (!targetContainer) return { pending: false };

        const approveBtns = ${JSON.stringify(SELECTORS.APPROVAL.APPROVE)};
        const rejectBtns = ${JSON.stringify(SELECTORS.APPROVAL.REJECT)};

        const hasApprove = approveBtns.some(s => !!(targetContainer.querySelector ? targetContainer.querySelector(s) : null) || !!document.querySelector(s));
        const hasReject = rejectBtns.some(s => !!(targetContainer.querySelector ? targetContainer.querySelector(s) : null) || !!document.querySelector(s));

        return {
            pending: true,
            text: (targetContainer.innerText || '').slice(0, 500),
            canApprove: hasApprove,
            canReject: hasReject,
            timestamp: new Date().toISOString()
        };
    })()`;
}

/**
 * Returns a self-contained JS expression to click Approve or Reject.
 */
export function buildClickApprovalScript(decision) {
    const isApprove = decision === 'approve' || decision === 'yes' || decision === 'run';
    const selectors = isApprove ? SELECTORS.APPROVAL.APPROVE : SELECTORS.APPROVAL.REJECT;

    return `(function() {
        const selectors = ${JSON.stringify(selectors)};
        for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn && btn.offsetParent !== null) {
                btn.click();
                return { success: true, decision: '${isApprove ? 'approve' : 'reject'}', selector: sel };
            }
        }
        return { success: false, error: 'button_not_found', decision: '${isApprove ? 'approve' : 'reject'}' };
    })()`;
}

/**
 * Returns a self-contained JS expression to click the Stop/Cancel button.
 */
export function buildStopAgentScript() {
    return `(function() {
        const selectors = ${JSON.stringify(SELECTORS.STOP)};
        for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn && btn.offsetParent !== null) {
                btn.click();
                return { success: true, stopped: true, selector: sel };
            }
        }
        return { success: false, error: 'stop_button_not_found' };
    })()`;
}
