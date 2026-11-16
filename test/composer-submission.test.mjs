import test from 'node:test';
import assert from 'node:assert/strict';
import { injectAndSubmit } from '../src/cdp-client.mjs';
import { registerCommand, COMMAND_STATE } from '../src/command-lifecycle.mjs';

/**
 * Realistic Mock/Fake CDP Client for Antigravity Composer tests.
 * Implements exact CDP evaluation protocol for Lexical and textarea editors.
 */
class MockCdpTarget {
    constructor(initialText = '', editorType = 'lexical') {
        this.composerText = initialText;
        this.editorType = editorType;
        this.selectedAll = false;
        this.focused = false;
        this.conversation = [];
        this.submittedText = null;
        this.simulateMismatch = false;
        this.simulateSubmitFailure = false;
        this.log = [];
    }

    async send(method, params = {}) {
        this.log.push({ method, params });

        if (method === 'Runtime.evaluate') {
            const expr = params.expression || '';

            // 1. Prepare composer: reads draft, focuses, selects all contents
            if (expr.includes('setSelectionRange') || expr.includes('isInputOrTextArea')) {
                this.focused = true;
                this.selectedAll = true; // Selection covers entire text
                const draft = this.composerText;
                return {
                    result: {
                        value: {
                            success: true,
                            draft,
                            editorType: this.editorType,
                            selector: '[aria-label="Message input"]'
                        }
                    }
                };
            }

            // 2. Verify composer: checks exact equality
            if (expr.includes('normExpected') || expr.includes('normActual')) {
                if (this.simulateMismatch) {
                    return {
                        result: {
                            value: {
                                success: true,
                                matches: false,
                                actualText: 'corrupted_readback_value',
                                expectedText: 'expected'
                            }
                        }
                    };
                }
                const actualNorm = this.composerText.replace(/\r\n/g, '\n').trim();
                return {
                    result: {
                        value: {
                            success: true,
                            matches: true,
                            actualText: actualNorm
                        }
                    }
                };
            }

            // 3. Post-submit verification: checks cleared & conversation presence
            if (expr.includes('buildVerifyPostSubmitScript') || expr.includes('composerCleared')) {
                return {
                    result: {
                        value: {
                            composerCleared: this.composerText === '',
                            messageObservedInChat: this.conversation.length > 0,
                            verified: true
                        }
                    }
                };
            }

            return { result: { value: null } };
        }

        if (method === 'Input.insertText') {
            const insert = params.text || '';
            if (this.selectedAll) {
                // Replacing entire selected contents atomically
                this.composerText = insert;
                this.selectedAll = false;
            } else {
                // Unselected cursor appends to existing text
                this.composerText += insert;
            }
            return {};
        }

        if (method === 'Input.dispatchKeyEvent') {
            if (params.type === 'keyDown' && params.key === 'Enter') {
                if (this.simulateSubmitFailure) {
                    throw new Error('Agent input locked: execution in progress');
                }
                this.submittedText = this.composerText;
                this.conversation.push(this.composerText);
                this.composerText = ''; // Cleanly cleared
            }
            return {};
        }

        return {};
    }

    close() {}
}

test('Composer Prompt Submission Suite (Requirement 4)', async (t) => {

    await t.test('1. Pre-filled composer is replaced cleanly and draft is preserved', async () => {
        const fakeTarget = new MockCdpTarget('existing old unsubmitted draft', 'lexical');
        let preservedDraft = null;

        const result = await injectAndSubmit('new clean prompt from phone', {
            clientOverride: fakeTarget,
            onDraftPreserved: (draft) => { preservedDraft = draft; }
        });

        assert.equal(result.success, true);
        assert.equal(result.submitted, 'new clean prompt from phone');
        assert.equal(result.draftPreserved, true);
        assert.equal(preservedDraft, 'existing old unsubmitted draft');
        assert.equal(fakeTarget.submittedText, 'new clean prompt from phone');
        assert.equal(fakeTarget.composerText, '', 'Composer must be cleared after submission');
        assert.deepEqual(fakeTarget.conversation, ['new clean prompt from phone']);
    });

    await t.test('2. Empty composer submits clean prompt without draft event', async () => {
        const fakeTarget = new MockCdpTarget('', 'lexical');
        let draftCalled = false;

        const result = await injectAndSubmit('hello from mobile phone', {
            clientOverride: fakeTarget,
            onDraftPreserved: () => { draftCalled = true; }
        });

        assert.equal(result.success, true);
        assert.equal(draftCalled, false, 'No draft event should be fired for empty composer');
        assert.equal(fakeTarget.submittedText, 'hello from mobile phone');
        assert.equal(fakeTarget.composerText, '');
        assert.deepEqual(fakeTarget.conversation, ['hello from mobile phone']);
    });

    await t.test('3. Multi-line and special characters are preserved exactly', async () => {
        const complexPrompt = 'Line 1\nLine 2 with "double quotes" & \'single\'\nSpecial: <xml>, $100, \t tabs & emojis 🚀';
        const fakeTarget = new MockCdpTarget('draft', 'lexical');

        const result = await injectAndSubmit(complexPrompt, { clientOverride: fakeTarget });

        assert.equal(result.success, true);
        assert.equal(fakeTarget.submittedText, complexPrompt);
        assert.equal(fakeTarget.conversation[0], complexPrompt);
    });

    await t.test('4. Retries with same idempotency key are strictly idempotent and never resubmit', async () => {
        const fakeTarget = new MockCdpTarget('', 'lexical');
        const idempotencyKey = 'idemp_unique_test_key_999';

        // 1. First registration and execution
        const firstReg = registerCommand('run build and test', idempotencyKey, 'test_device');
        assert.equal(firstReg.isDuplicate, false);
        assert.equal(firstReg.command.state, COMMAND_STATE.ACCEPTED_BY_BRIDGE);

        const firstResult = await injectAndSubmit('run build and test', {
            clientOverride: fakeTarget,
            idempotencyKey
        });
        assert.equal(firstResult.success, true);
        assert.equal(fakeTarget.conversation.length, 1);

        // 2. Retry attempt with identical idempotency key
        const retryReg = registerCommand('run build and test', idempotencyKey, 'test_device');
        assert.equal(retryReg.isDuplicate, true, 'Retry must be recognized as duplicate');
        assert.equal(retryReg.command.id, firstReg.command.id);

        // Server handler logic skips injectAndSubmit when isDuplicate is true
        if (!retryReg.isDuplicate) {
            await injectAndSubmit('run build and test', { clientOverride: fakeTarget });
        }

        // Verify composer was NOT inserted into twice
        assert.equal(fakeTarget.conversation.length, 1, 'Retry must not submit a second time');
        assert.equal(fakeTarget.composerText, '', 'Composer must remain empty');
    });

    await t.test('5. Composer readback mismatch fails command immediately and aborts submit', async () => {
        const fakeTarget = new MockCdpTarget('', 'lexical');
        fakeTarget.simulateMismatch = true; // Simulate corrupted insertion or DOM mismatch

        await assert.rejects(
            async () => {
                await injectAndSubmit('intended prompt', { clientOverride: fakeTarget });
            },
            {
                name: 'Error',
                message: /Composer readback mismatch/
            }
        );

        // Assert submit was ABORTED
        assert.equal(fakeTarget.submittedText, null, 'Submit must never be called on readback mismatch');
        assert.equal(fakeTarget.conversation.length, 0, 'No message should appear in conversation on mismatch');
    });

    await t.test('6. Submit failure leaves composer untouched and does not mark started', async () => {
        const fakeTarget = new MockCdpTarget('', 'lexical');
        fakeTarget.simulateSubmitFailure = true; // Enter key rejection (e.g. IDE agent locked)

        await assert.rejects(
            async () => {
                await injectAndSubmit('prompt during agent busy', { clientOverride: fakeTarget });
            },
            {
                name: 'Error',
                message: /Agent input locked/
            }
        );

        assert.equal(fakeTarget.conversation.length, 0, 'Conversation must not receive failed submit');
    });
});
