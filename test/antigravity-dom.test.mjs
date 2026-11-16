import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ADAPTER_VERSION,
    SELECTORS,
    buildFingerprintScript,
    buildFocusInputScript,
    buildDetectStateScript,
    buildExtractApprovalScript,
    buildClickApprovalScript,
    buildStopAgentScript
} from '../src/antigravity-dom.mjs';

// Minimal mock DOM evaluator simulating browser window execution
function evaluateInMockDom(script, domTree) {
    const document = {
        querySelector(selector) {
            const el = domTree[selector] || null;
            if (el && !el.querySelector) {
                el.querySelector = (s) => domTree[s] || null;
            }
            return el;
        },
        querySelectorAll(selector) {
            const el = this.querySelector(selector);
            return el ? [el] : [];
        }
    };

    const fn = new Function('document', `return ${script}`);
    return fn(document);
}

test('Antigravity DOM Adapter Suite (Phase 06)', async (t) => {
    await t.test('1. Valid Antigravity IDE DOM returns compatible with ide appType', () => {
        const ideDom = {
            '.monaco-workbench': { tagName: 'DIV', offsetParent: {} },
            '.monaco-editor': { tagName: 'DIV', offsetParent: {} },
            'textarea.inputarea': { tagName: 'TEXTAREA', offsetParent: {}, focus: () => {} }
        };

        const result = evaluateInMockDom(buildFingerprintScript(), ideDom);
        assert.equal(result.compatible, true);
        assert.equal(result.appType, 'ide');
        assert.equal(result.hasInputs, true);
        assert.equal(result.adapterVersion, ADAPTER_VERSION);
    });

    await t.test('2. Valid Antigravity 2.0 app returns compatible with app appType', () => {
        const appDom = {
            '#root': { tagName: 'DIV', offsetParent: {} },
            '[data-testid*="chat"]': { tagName: 'DIV', offsetParent: {} },
            '[data-testid="chat-input"]': { tagName: 'TEXTAREA', offsetParent: {}, focus: () => {} }
        };

        const result = evaluateInMockDom(buildFingerprintScript(), appDom);
        assert.equal(result.compatible, true);
        assert.equal(result.appType, 'app');
        assert.equal(result.hasInputs, true);
    });

    await t.test('3. Incompatible or foreign web page fails fingerprint check', () => {
        const foreignDom = {
            '.some-random-div': { tagName: 'DIV', offsetParent: {} }
        };

        const result = evaluateInMockDom(buildFingerprintScript(), foreignDom);
        assert.equal(result.compatible, false);
        assert.equal(result.appType, 'unknown');
        assert.equal(result.hasInputs, false);
    });

    await t.test('4. Agent state detection identifies idle, running, and waiting_approval', () => {
        // Idle state
        const idleResult = evaluateInMockDom(buildDetectStateScript(), {});
        assert.equal(idleResult.state, 'idle');
        assert.equal(idleResult.source, 'observed');

        // Running state
        const runningDom = {
            '[data-testid="running-confirm-stop"]': { tagName: 'BUTTON', offsetParent: {} }
        };
        const runningResult = evaluateInMockDom(buildDetectStateScript(), runningDom);
        assert.equal(runningResult.state, 'running');

        // Waiting approval state
        const approvalDom = {
            '[data-testid*="approval"]': { tagName: 'DIV', offsetParent: {} }
        };
        const approvalResult = evaluateInMockDom(buildDetectStateScript(), approvalDom);
        assert.equal(approvalResult.state, 'waiting_approval');
    });

    await t.test('5. Approval extraction and decision action', () => {
        const approveDom = {
            '[data-testid*="approval"]': {
                tagName: 'DIV',
                offsetParent: {},
                innerText: 'Agent wants to run: npm install'
            },
            'button[data-testid*="approve"]': {
                tagName: 'BUTTON',
                offsetParent: {},
                clicked: false,
                click() { this.clicked = true; }
            }
        };

        // Extract approval
        const extracted = evaluateInMockDom(buildExtractApprovalScript(), approveDom);
        assert.equal(extracted.pending, true);
        assert.match(extracted.text, /Agent wants to run/);

        // Click approve
        const clicked = evaluateInMockDom(buildClickApprovalScript('approve'), approveDom);
        assert.equal(clicked.success, true);
        assert.equal(clicked.decision, 'approve');
        assert.equal(approveDom['button[data-testid*="approve"]'].clicked, true);
    });

    await t.test('6. Stop button execution', () => {
        const stopDom = {
            'button.stop-btn': {
                tagName: 'BUTTON',
                offsetParent: {},
                stopped: false,
                click() { this.stopped = true; }
            }
        };

        const result = evaluateInMockDom(buildStopAgentScript(), stopDom);
        assert.equal(result.success, true);
        assert.equal(result.stopped, true);
        assert.equal(stopDom['button.stop-btn'].stopped, true);
    });
});
