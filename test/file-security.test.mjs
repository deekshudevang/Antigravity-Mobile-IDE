import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkspacePath, isSensitiveFile } from '../src/file-security.mjs';
import { join, resolve } from 'path';

test('Filesystem Safety Suite (Section 5.4)', () => {
    const workspaceRoot = process.cwd();

    // 1. Valid workspace file
    const valid = validateWorkspacePath(workspaceRoot, join(workspaceRoot, 'package.json'));
    assert.equal(valid.valid, true);
    assert.ok(valid.canonicalPath);

    // 2. Directory traversal attempt
    const traversal = validateWorkspacePath(workspaceRoot, resolve(workspaceRoot, '..'));
    assert.equal(traversal.valid, false);
    assert.equal(traversal.error, 'path_outside_workspace');

    // 3. Sensitive file deny-list
    assert.equal(isSensitiveFile('.env'), true);
    assert.equal(isSensitiveFile('.env.production'), true);
    assert.equal(isSensitiveFile('.git/config'), true);
    assert.equal(isSensitiveFile('server.key'), true);
    assert.equal(isSensitiveFile('id_rsa'), true);
    assert.equal(isSensitiveFile('auth-store.json'), true);
    assert.equal(isSensitiveFile('normal-file.txt'), false);

    const sensitiveCheck = validateWorkspacePath(workspaceRoot, join(workspaceRoot, '.env'));
    assert.equal(sensitiveCheck.valid, false);
    assert.equal(sensitiveCheck.error, 'sensitive_file_access_denied');

    // 4. Windows reserved names
    const reservedCheck = validateWorkspacePath(workspaceRoot, 'CON.txt');
    assert.equal(reservedCheck.valid, false);
    assert.equal(reservedCheck.error, 'reserved_device_name_rejected');

    // 5. Alternate Data Stream
    const adsCheck = validateWorkspacePath(workspaceRoot, 'package.json:hidden');
    assert.equal(adsCheck.valid, false);
    assert.equal(adsCheck.error, 'alternate_data_stream_rejected');

    // 6. UNC Path rejection
    const uncCheck = validateWorkspacePath(workspaceRoot, '\\\\attacker-server\\share\\secret.txt');
    assert.equal(uncCheck.valid, false);
    assert.equal(uncCheck.error, 'unc_path_rejected');

    // 7. Null byte injection rejection
    const nullByteCheck = validateWorkspacePath(workspaceRoot, 'package.json\0.exe');
    assert.equal(nullByteCheck.valid, false);
    assert.equal(nullByteCheck.error, 'null_byte_rejected');
});
