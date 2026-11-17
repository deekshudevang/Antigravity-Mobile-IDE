# Contributing to Antigravity Mobile IDE

Thank you for your interest in contributing! **Antigravity Mobile IDE** is an open-source, community-driven project dedicated to reliable, secure, and calm remote AI coding workflows.

---

## 1. Ground Rules & Guiding Principles

1. **Working Code & Evidence**: Plausibility is not correctness. Any pull request introducing a bug fix or new feature must include automated tests verifying the behavior.
2. **Minimalist & Surgical Diffs**: Solve problems with the minimum necessary new code. Avoid speculative abstractions, unnecessary dependencies, or drive-by refactorings.
3. **Security First**: Never commit private network credentials, pairing tokens, passwords, keystores, or `.env` files. Ensure all endpoints adhere to the capability RBAC system.
4. **Trademark & Integrity**: This is an independent community project. Do not copy proprietary Google/Antigravity logos, brand assets, or make claims of official affiliation.

---

## 2. Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ LTS recommended).
- **Android SDK & JDK**: JDK 17 (or 21), Android SDK with API 36 platform tools.
- **Git**: Configured for your GitHub account.

### Local Installation
```bash
# Clone your fork
git clone https://github.com/<your-username>/Antigravity-Mobile-IDE.git
cd Antigravity-Mobile-IDE

# Install backend dependencies
npm install

# Run backend tests
npm test

# Run Android unit tests
cd android
./gradlew testDebugUnitTest
```

---

## 3. Pull Request Guidelines

1. **Branching**: Branch from `main` with a descriptive name (e.g. `fix/composer-readback`, `feat/new-quick-action`).
2. **Commit Messages**: Follow Conventional Commits format (`feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `sec: ...`).
3. **Verification**: Run `npm test` and `node scripts/check-contrast.mjs` before submitting. Ensure all 75+ tests pass cleanly.
4. **No Secrets**: Verify with `git status` that no secret tokens (`data/.admin_token`) or generated build artifacts are staged.

---

## 4. Community & Support

Have questions or ideas? Start a discussion in [GitHub Discussions](https://github.com/deekshudevang/Antigravity-Mobile-IDE/discussions).
