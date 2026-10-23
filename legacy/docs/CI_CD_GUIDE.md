# NetTunnel Pro - CI/CD Pipeline Guide

## Overview

This document describes the automated CI/CD pipeline for NetTunnel Pro using GitHub Actions. The pipeline automates testing, building, signing, and releasing APKs.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼────────┐ ┌──▼──────────┐ ┌──▼──────────┐
        │  Lint & Format │ │ PR Validate │ │ APK Signing │
        └───────┬────────┘ └──┬──────────┘ └──┬──────────┘
                │             │               │
        ┌───────▼─────────────▼───────────────▼───────┐
        │         Frontend & Backend Tests             │
        └───────┬─────────────────────────────────────┘
                │
        ┌───────▼──────────────────┐
        │   Android Build (APK)    │
        └───────┬──────────────────┘
                │
        ┌───────▼──────────────────┐
        │  Security Scan & Lint    │
        └───────┬──────────────────┘
                │
        ┌───────▼──────────────────┐
        │  Release & Deployment    │
        └──────────────────────────┘
```

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual trigger via `workflow_dispatch`

**Jobs:**

#### Lint & Format Check
- ESLint validation
- Prettier formatting check
- TypeScript type checking
- **Status:** Required to pass

#### Frontend Tests (Jest/Vitest)
- Unit tests for React components
- Coverage reports uploaded to Codecov
- **Status:** Required to pass

#### Backend Tests (Vitest)
- Unit tests for tRPC procedures
- Database migrations tested
- Coverage reports uploaded to Codecov
- **Status:** Required to pass

#### Security Scan
- Trivy vulnerability scanning
- Results uploaded to GitHub Security tab
- **Status:** Informational (warnings allowed)

#### Android Build (APK)
- Frontend build with Vite
- Capacitor sync
- Gradle build (debug + release)
- APK artifacts uploaded
- **Status:** Required to pass

#### Android Lint
- Android linting checks
- HTML reports generated
- **Status:** Informational

#### Dependency Check
- npm audit
- Outdated packages check
- **Status:** Informational

#### Release & Deployment
- Changelog generation
- GitHub Release creation
- APK upload to release
- **Triggers:** Only on push to main

### 2. APK Signing Workflow (`apk-signing.yml`)

**Triggers:**
- After successful CI/CD pipeline on main

**Jobs:**

#### Sign and Release
- Download APK artifacts
- Sign with keystore (RSA-2048)
- Align APK (zipalign)
- Upload signed APK
- Create GitHub Release with signed APK

**Requirements:**
- `KEYSTORE_BASE64` - Base64 encoded keystore file
- `KEYSTORE_PASSWORD` - Keystore password
- `KEY_ALIAS` - Key alias in keystore
- `KEY_PASSWORD` - Key password

### 3. PR Validation Workflow (`pr-validation.yml`)

**Triggers:**
- Pull request opened/synchronized/reopened

**Jobs:**

#### Validate PR
- Check PR title format (must start with: feat, fix, docs, style, refactor, perf, test, chore)
- Check PR description (must not be empty)
- Check for merge conflicts
- List changed files
- Warn about large files (>5MB)

#### Code Review Checks
- Detect console.log statements
- Detect TODO/FIXME comments
- Detect possible hardcoded secrets

#### Test Coverage Check
- Run tests with coverage
- Verify coverage meets 80% threshold
- Fail if below threshold

#### Dependency Audit
- Run npm audit
- Check for deprecated packages
- Warn about outdated packages

#### Summary
- Aggregate all check results
- Fail if any critical check fails

## Setup Instructions

### 1. Create Keystore for APK Signing

```bash
# Generate keystore (valid for 10 years)
keytool -genkey -v -keystore nettunnel.jks \
  -keyalg RSA -keysize 2048 \
  -validity 3650 \
  -alias nettunnel \
  -storepass your_keystore_password \
  -keypass your_key_password
```

### 2. Encode Keystore to Base64

```bash
# On macOS/Linux
base64 -i nettunnel.jks | pbcopy

# On Linux
base64 nettunnel.jks | xclip -selection clipboard

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("nettunnel.jks")) | Set-Clipboard
```

### 3. Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `KEYSTORE_BASE64` | Base64 encoded keystore |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias (e.g., `nettunnel`) |
| `KEY_PASSWORD` | Key password |
| `SLACK_WEBHOOK` | (Optional) Slack webhook for notifications |

### 4. Configure Branch Protection

Go to **Settings → Branches → main** and enable:

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require code reviews before merging (minimum 1)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass: `lint-and-format`, `frontend-tests`, `backend-tests`, `android-build`

## Usage

### Running Workflows

**Automatic (on push/PR):**
```bash
git push origin main
# CI/CD pipeline runs automatically
```

**Manual Trigger:**
```bash
# Via GitHub UI: Actions → CI/CD Pipeline → Run workflow
# Or via CLI:
gh workflow run ci-cd.yml -r main
```

### Monitoring Pipeline

1. Go to **Actions** tab
2. Select workflow run
3. View job logs in real-time
4. Download artifacts

### Troubleshooting

#### Build Fails: "Keystore not found"
- Verify `KEYSTORE_BASE64` secret is set correctly
- Ensure keystore file is valid

#### Tests Fail: "Coverage below threshold"
- Add more tests to increase coverage
- Run locally: `pnpm test -- --coverage`

#### APK Build Fails: "Gradle sync error"
- Check Android SDK version in workflow
- Verify `android/build.gradle` is valid
- Run locally: `cd android && ./gradlew assembleDebug`

#### PR Validation Fails: "Invalid PR title"
- Use format: `feat: description` or `fix: description`
- Valid prefixes: feat, fix, docs, style, refactor, perf, test, chore

## Performance Metrics

| Workflow | Duration | Status |
|----------|----------|--------|
| Lint & Format | ~2 min | ✅ Fast |
| Frontend Tests | ~3 min | ✅ Fast |
| Backend Tests | ~4 min | ✅ Fast |
| Android Build | ~8 min | ⚠️ Slow |
| Security Scan | ~2 min | ✅ Fast |
| Total Pipeline | ~15-20 min | ⚠️ Medium |

## Best Practices

### 1. Keep Tests Fast
- Use mocking for external services
- Avoid real database queries in tests
- Use `beforeEach`/`afterEach` for setup/teardown

### 2. Commit Messages
```
feat: add SNI scanning feature
fix: resolve keep-alive timeout issue
docs: update README with setup instructions
test: add tests for VPN connection
chore: update dependencies
```

### 3. PR Guidelines
- Keep PRs focused on single feature
- Add tests for new features
- Update documentation
- Request review from maintainers

### 4. Release Process
1. Merge PR to main
2. CI/CD pipeline runs automatically
3. APK is signed and released
4. GitHub Release created with changelog

## Monitoring & Alerts

### Slack Notifications
Set `SLACK_WEBHOOK` secret to receive notifications:
- Build status (success/failure)
- Test results
- Security scan alerts

### Email Notifications
GitHub sends emails for:
- Failed workflow runs
- Completed workflow runs (if subscribed)

### Dashboard
Monitor pipeline health:
- Go to **Insights → Actions**
- View workflow run history
- Track success rate

## Advanced Configuration

### Custom Environment Variables
Add to workflow:
```yaml
env:
  CUSTOM_VAR: value
```

### Matrix Testing
Test multiple configurations:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
    java-version: [11, 17]
```

### Conditional Steps
Run steps conditionally:
```yaml
if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Gradle Android Build](https://developer.android.com/build)
- [Xray-core Build Guide](https://xtls.github.io/)
- [Codecov Integration](https://codecov.io/)

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review this guide for troubleshooting
3. Create an issue on GitHub
4. Contact maintainers
