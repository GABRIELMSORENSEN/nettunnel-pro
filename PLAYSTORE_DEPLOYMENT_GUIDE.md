# Google Play Store Deployment Guide

## Overview

This guide explains how to set up and use the automated Google Play Store deployment pipeline for NetTunnel Pro.

## Prerequisites

1. **Google Play Developer Account**
   - Active subscription ($25 one-time fee)
   - Verified identity
   - Accepted agreements

2. **App Signing Certificate**
   - RSA-2048 key
   - Valid keystore file
   - Credentials stored securely

3. **GitHub Secrets Configured**
   - `PLAYSTORE_SERVICE_ACCOUNT_JSON`
   - `PLAYSTORE_PACKAGE_NAME`
   - `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`

## Setup Instructions

### Step 1: Create Google Play Service Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (NetTunnel Pro)
3. Navigate to **Settings → API access**
4. Click **Create new service account**
5. Follow Google Cloud Console link
6. Create service account with name: `github-actions-deploy`
7. Grant roles:
   - `Editor` (for app management)
   - `Service Account User`

### Step 2: Generate Service Account Key

1. In Google Cloud Console, go to **Service Accounts**
2. Select `github-actions-deploy`
3. Go to **Keys** tab
4. Click **Add Key → Create new key**
5. Choose **JSON** format
6. Download the JSON file

### Step 3: Grant Play Store Permissions

1. Back in Google Play Console
2. Go to **Settings → API access**
3. Click **Grant access** next to the service account
4. Grant these roles:
   - `Admin` (full access)
   - Or specific roles:
     - `Release Manager`
     - `App Viewer`
     - `Financials Viewer`

### Step 4: Add GitHub Secrets

1. Go to GitHub repository **Settings → Secrets and variables → Actions**
2. Add these secrets:

| Secret | Value | Description |
|--------|-------|-------------|
| `PLAYSTORE_SERVICE_ACCOUNT_JSON` | JSON file content | Service account credentials (base64 encoded) |
| `PLAYSTORE_PACKAGE_NAME` | `com.example.nettunnel` | Your app's package name |
| `KEYSTORE_BASE64` | Base64 encoded keystore | APK signing keystore |
| `KEYSTORE_PASSWORD` | Password | Keystore password |
| `KEY_ALIAS` | Alias name | Key alias in keystore |
| `KEY_PASSWORD` | Password | Key password |
| `SLACK_WEBHOOK` | Webhook URL | (Optional) Slack notifications |

### Step 5: Encode Service Account JSON

```bash
# On macOS/Linux
base64 -i service-account.json | pbcopy

# On Linux
base64 service-account.json | xclip -selection clipboard

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | Set-Clipboard
```

## Workflow: playstore-deploy.yml

### Triggers

**Automatic:**
- After successful `apk-signing.yml` workflow on main branch
- Deploys to `internal` testing track by default

**Manual:**
- Via GitHub Actions UI
- Choose release track: internal, alpha, beta, or production

### Jobs

#### 1. Validate Play Store Configuration
- Verify all required secrets are set
- Check app bundle configuration
- Validate version code

#### 2. Build App Bundle (AAB)
- Build frontend with Vite
- Sync Capacitor
- Build signed App Bundle (AAB format)
- Verify bundle creation

#### 3. Test App Bundle
- Validate bundle signature
- Check bundle structure
- Generate bundle report
- Verify AndroidManifest.xml

#### 4. Deploy to Play Store
- Decode Play Store credentials
- Determine release track
- Upload AAB to appropriate track:
  - **Internal**: For testing (draft status)
  - **Alpha**: For early adopters (draft status)
  - **Beta**: For wider testing (draft status)
  - **Production**: For public release (completed status)

#### 5. Post-Deployment Tasks
- Generate deployment report
- Send Slack notification
- Create GitHub issue for monitoring
- Track deployment metrics

## Release Tracks

### Internal Testing
- **Purpose**: Internal QA testing
- **Users**: Up to 100 testers
- **Status**: Draft (manual review before publishing)
- **Duration**: Unlimited
- **Use case**: First deployment, critical fixes

### Alpha
- **Purpose**: Early adopter testing
- **Users**: Up to 1,000 testers
- **Status**: Draft
- **Duration**: Typically 1-2 weeks
- **Use case**: Beta features, new functionality

### Beta
- **Purpose**: Wider user testing
- **Users**: Up to 10,000 testers
- **Status**: Draft
- **Duration**: Typically 1-2 weeks
- **Use case**: Pre-release validation

### Production
- **Purpose**: Public release
- **Users**: All users
- **Status**: Completed (live immediately)
- **Duration**: Permanent
- **Use case**: Stable releases

## Deployment Process

### Step 1: Prepare Release

```bash
# Update version in android/app/build.gradle
versionCode 2
versionName "1.1.0"

# Update CHANGELOG.md
# Create release notes in whats-new/en-US/

# Commit and push to main
git add .
git commit -m "chore: prepare v1.1.0 release"
git push origin main
```

### Step 2: Automatic Deployment

1. CI/CD pipeline runs on push to main
2. All tests pass
3. APK is signed
4. `playstore-deploy.yml` triggers automatically
5. App deployed to `internal` testing track

### Step 3: Manual Deployment (Optional)

For specific tracks:

1. Go to **Actions → Google Play Store Deployment**
2. Click **Run workflow**
3. Select release track:
   - `internal` (default)
   - `alpha`
   - `beta`
   - `production`
4. Click **Run workflow**

### Step 4: Review in Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Select NetTunnel Pro
3. Go to **Releases** section
4. Review the new release
5. If status is "Draft":
   - Review changes
   - Click **Review release**
   - Click **Start rollout to [track]**

### Step 5: Monitor Deployment

1. Check GitHub issue created for monitoring
2. Monitor Slack notifications
3. Watch Firebase Crashlytics for crashes
4. Monitor user ratings and reviews
5. Check analytics in Play Store Console

## What's New Directory Structure

Create release notes in `whats-new/` directory:

```
whats-new/
├── en-US/
│   └── whatsnew
├── pt-BR/
│   └── whatsnew
├── es-ES/
│   └── whatsnew
└── fr-FR/
    └── whatsnew
```

Each file contains release notes (max 500 characters):

```
NetTunnel Pro v1.1.0

✨ New Features:
- DNSTT protocol support
- Captive portal bypass
- SNI auto-scanning

🐛 Bug Fixes:
- Fixed keep-alive timeout
- Improved battery optimization

🚀 Performance:
- 30% faster connection establishment
- Reduced memory usage
```

## Troubleshooting

### Error: "Invalid service account credentials"

**Solution:**
1. Verify `PLAYSTORE_SERVICE_ACCOUNT_JSON` is correctly base64 encoded
2. Check service account has Play Store permissions
3. Verify JSON file is valid (use `jq` to validate)

```bash
echo "$PLAYSTORE_SERVICE_ACCOUNT_JSON" | base64 -d | jq .
```

### Error: "App bundle signature invalid"

**Solution:**
1. Verify keystore file is valid
2. Check `KEY_ALIAS` matches keystore
3. Verify passwords are correct
4. Regenerate keystore if needed

### Error: "Version code already used"

**Solution:**
1. Increment `versionCode` in `android/app/build.gradle`
2. Version code must be higher than previous release
3. Cannot reuse version codes

```gradle
android {
    defaultConfig {
        versionCode 3  // Must be > 2
        versionName "1.1.0"
    }
}
```

### Error: "App not found in Play Store"

**Solution:**
1. Verify `PLAYSTORE_PACKAGE_NAME` is correct
2. Check app exists in Play Store Console
3. Verify service account has access to app
4. Check app is not in "Removed" state

### Deployment stuck in "Draft" status

**Solution:**
1. Go to Play Store Console
2. Navigate to **Releases → [Track]**
3. Review the draft release
4. Click **Review release**
5. Address any warnings/errors
6. Click **Start rollout**

## Monitoring & Analytics

### Firebase Crashlytics
- Monitor crash reports in real-time
- Set up alerts for critical crashes
- Track crash-free users percentage

### Play Store Analytics
- Monitor installs and uninstalls
- Track user retention
- Analyze user demographics
- Monitor ratings and reviews

### GitHub Issues
- Automated monitoring issue created
- Track deployment status
- Document any issues found
- Plan rollback if needed

## Rollback Procedure

If critical issues are found after deployment:

### Step 1: Immediate Actions
1. Go to Play Store Console
2. Navigate to **Releases → [Track]**
3. Click **Stop rollout**
4. Select reason for rollout stop

### Step 2: Fix Issues
1. Create hotfix branch
2. Fix critical issues
3. Increment version code
4. Create PR and merge to main

### Step 3: Re-deploy
1. Push hotfix to main
2. CI/CD pipeline runs automatically
3. Deploy to same track
4. Monitor for issues

## Best Practices

1. **Test thoroughly before production**
   - Use internal → alpha → beta progression
   - Monitor each stage for issues
   - Get user feedback

2. **Keep version codes sequential**
   - Never reuse version codes
   - Increment for every release
   - Document version history

3. **Monitor crashes immediately**
   - Set up Firebase alerts
   - Check Crashlytics daily
   - Prepare hotfix if needed

4. **Communicate with users**
   - Write clear release notes
   - Highlight new features
   - Mention bug fixes
   - Thank users for feedback

5. **Maintain rollback readiness**
   - Keep previous version available
   - Document rollback procedure
   - Have hotfix ready

## References

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Bundle Format](https://developer.android.com/guide/app-bundle)
- [Service Account Setup](https://cloud.google.com/iam/docs/service-accounts)
- [GitHub Actions Upload Google Play](https://github.com/r0adkll/upload-google-play)

## Support

For issues or questions:
1. Check Google Play Console documentation
2. Review GitHub Actions logs
3. Check Firebase Crashlytics
4. Create GitHub issue with details
5. Contact maintainers
