/**
 * Antigravity Remote — Filesystem Security Service (Phase 03 / Section 5.4)
 *
 * Implements:
 * - Realpath resolution enforcing workspace root boundaries against symlinks and junctions.
 * - Rejection of UNC paths, Alternate Data Streams (ADS), and Windows reserved device names.
 * - Deny-list for sensitive files (.env, .git internals, private keys, keystores, auth tokens).
 */

import { realpathSync, existsSync, statSync } from 'fs';
import { resolve, normalize, basename, dirname, isAbsolute } from 'path';

// Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
const RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

// Deny-listed sensitive patterns even inside valid workspace
const SENSITIVE_PATTERNS = [
    /^\.env(\..*)?$/i,
    /^\.git($|\/|\\)/i,
    /\.(pem|key|p12|pfx|keystore|jks)$/i,
    /^id_(rsa|dsa|ecdsa|ed25519)$/i,
    /^auth-store\.json$/i,
    /^pairing\.json$/i,
    /^security-audit\.jsonl$/i
];

/**
 * Check whether a filename or relative path is deny-listed.
 */
export function isSensitiveFile(filePath) {
    const base = basename(filePath);
    if (RESERVED_NAMES.test(base)) return true;
    for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(base) || pattern.test(filePath)) return true;
    }
    return false;
}

/**
 * Resolve canonical workspace root path
 */
export function getCanonicalWorkspaceRoot(workspaceRoot) {
    if (!workspaceRoot) return null;
    try {
        return realpathSync(resolve(workspaceRoot));
    } catch {
        return resolve(workspaceRoot);
    }
}

/**
 * Canonicalize and validate that requestedPath resides strictly within workspaceRoot.
 * Resolves directory junctions and symlinks.
 * @returns {{ valid: boolean, canonicalPath?: string, error?: string }}
 */
export function validateWorkspacePath(workspaceRoot, requestedPath, allowNonExistent = false) {
    if (!workspaceRoot || !requestedPath) {
        return { valid: false, error: 'missing_path_parameters' };
    }

    // Decode URL-encoded traversal and characters
    let decoded = requestedPath;
    try {
        decoded = decodeURIComponent(requestedPath);
    } catch {
        return { valid: false, error: 'malformed_url_encoding' };
    }

    // Reject null byte injection
    if (requestedPath.includes('\0') || decoded.includes('\0')) {
        return { valid: false, error: 'null_byte_rejected' };
    }

    // Reject UNC network paths (\\server\share or //server/share)
    if (/^[\\/]{2}/.test(decoded)) {
        return { valid: false, error: 'unc_path_rejected' };
    }

    // Reject Alternate Data Streams (e.g. file.txt:hidden)
    if (decoded.includes(':') && !/^[a-zA-Z]:[\\/]/.test(decoded)) {
        return { valid: false, error: 'alternate_data_stream_rejected' };
    }

    // Reject Windows reserved device names
    const base = basename(decoded);
    if (RESERVED_NAMES.test(base)) {
        return { valid: false, error: 'reserved_device_name_rejected' };
    }

    // Check sensitive file deny-list
    if (isSensitiveFile(decoded)) {
        return { valid: false, error: 'sensitive_file_access_denied' };
    }

    try {
        // Canonicalize workspace root
        const canonicalRoot = realpathSync(resolve(workspaceRoot));
        const rootLower = canonicalRoot.toLowerCase();

        // Resolve target against workspace root (never process.cwd())
        const targetToResolve = isAbsolute(decoded) ? resolve(decoded) : resolve(workspaceRoot, decoded);
        const resolvedLower = targetToResolve.toLowerCase();

        // 1. Lexical traversal check: must not resolve outside workspaceRoot
        const isLexicallyInside = resolvedLower === rootLower ||
            resolvedLower.startsWith(rootLower + '\\') ||
            resolvedLower.startsWith(rootLower + '/');

        if (!isLexicallyInside) {
            return { valid: false, error: 'path_outside_workspace' };
        }

        if (!existsSync(targetToResolve)) {
            if (!allowNonExistent) {
                return { valid: false, error: 'path_not_found' };
            }
            // For new files to write, resolve parent directory
            const parentDir = dirname(targetToResolve);
            if (!existsSync(parentDir)) {
                return { valid: false, error: 'parent_directory_not_found' };
            }
            const canonicalParent = realpathSync(parentDir);
            const isInside = canonicalParent.toLowerCase().startsWith(rootLower);
            if (!isInside) {
                return { valid: false, error: 'path_outside_workspace' };
            }
            return { valid: true, canonicalPath: resolve(canonicalParent, basename(targetToResolve)) };
        }

        // 2. Symlink/Junction check: canonical real path must strictly stay within canonicalRoot
        const canonicalTarget = realpathSync(targetToResolve);
        const targetLower = canonicalTarget.toLowerCase();

        const isChild = targetLower === rootLower ||
            targetLower.startsWith(rootLower + '\\') ||
            targetLower.startsWith(rootLower + '/');

        if (!isChild) {
            return { valid: false, error: 'path_outside_workspace' };
        }

        return { valid: true, canonicalPath: canonicalTarget };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}
