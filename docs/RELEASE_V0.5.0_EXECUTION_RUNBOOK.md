# Predictrix v0.5.0 Execution Runbook

This runbook executes the full release flow on Windows PowerShell:
1. Build Expo Android + iOS artifacts.
2. Publish GitHub release `v0.5.0` with uploaded assets.
3. Deploy backend to Fly and verify runtime health.

## 1) Preconditions

- Run from repository root: `C:\Users\Acer\Desktop\Forex-Signal-App`
- Required tools:
  - `git`
  - `node` + `npm`
  - `eas` CLI (EAS CLI >= 12)
  - `gh` (GitHub CLI)
  - `fly` (Fly CLI)
- Expected app/runtime settings from repo:
  - Mobile version source files: `mobile_app/package.json`, `mobile_app/app.json`
  - EAS config: `mobile_app/eas.json`
  - Fly app: `predictrix-api` (region `nrt`)

Tool check commands:

```powershell
Get-Command git, node, npm, eas, gh, fly | Select-Object Name, Source
node -v
npm -v
eas --version
gh --version
fly version
```

Verification point:
- All commands must resolve successfully and print versions.

## 2) Release Session Variables

```powershell
$ReleaseVersion = "0.5.0"
$Tag = "v$ReleaseVersion"
$RepoRoot = "C:\Users\Acer\Desktop\Forex-Signal-App"
$MobileDir = Join-Path $RepoRoot "mobile_app"
$BackendDir = Join-Path $RepoRoot "backend"
$AssetDir = Join-Path $RepoRoot ("release-assets\\" + $Tag)
$AndroidAsset = Join-Path $AssetDir ("predictrix-" + $Tag + "-android.aab")
$IosAsset = Join-Path $AssetDir ("predictrix-" + $Tag + "-ios.ipa")
$IosSimulatorAsset = Join-Path $AssetDir ("predictrix-" + $Tag + "-ios-simulator.tar.gz")

New-Item -ItemType Directory -Force -Path $AssetDir | Out-Null
Set-Location $RepoRoot
```

Verification point:
- `Test-Path $AssetDir` returns `True`.

## 3) Preflight: Git State + Auth

### 3.1 Git clean state

```powershell
Set-Location $RepoRoot
git fetch --tags
git status --short
git branch --show-current
```

Verification point:
- Prefer clean working tree before release. If non-empty output, either commit/stash intentionally or stop.

### 3.2 EAS auth handling

```powershell
Set-Location $MobileDir
eas whoami
```

If not authenticated:

```powershell
# Interactive login
eas login

# Or token-based session (CI/non-interactive style)
# $env:EXPO_TOKEN = "<expo-token>"
# eas whoami
```

Verification point:
- `eas whoami` returns expected account/owner (project owner is `asura08`).

### 3.3 GitHub auth handling

```powershell
Set-Location $RepoRoot
gh auth status
```

If not authenticated:

```powershell
gh auth login --web --git-protocol https --scopes repo

# Or token-based session
# $env:GH_TOKEN = "<github-token-with-repo-scope>"
# gh auth status
```

Verification point:
- `gh auth status` must show logged-in account and `repo` scope.

### 3.4 Fly auth handling

```powershell
Set-Location $BackendDir
fly auth whoami
```

If not authenticated:

```powershell
fly auth login
```

Verification point:
- `fly auth whoami` returns active identity.

## 4) Bump Version to 0.5.0 (mobile)

```powershell
Set-Location $MobileDir

# package.json version
$pkg = Get-Content .\package.json -Raw | ConvertFrom-Json
$pkg.version = $ReleaseVersion
$pkg | ConvertTo-Json -Depth 100 | Set-Content .\package.json

# app.json expo.version
$app = Get-Content .\app.json -Raw | ConvertFrom-Json
$app.expo.version = $ReleaseVersion
$app | ConvertTo-Json -Depth 100 | Set-Content .\app.json

# Verify
(Get-Content .\package.json -Raw | ConvertFrom-Json).version
(Get-Content .\app.json -Raw | ConvertFrom-Json).expo.version
```

Verification point:
- Both commands print `0.5.0`.

## 5) Run Quality Gates Before Build/Release

```powershell
Set-Location $RepoRoot
python tests/test_api_contract.py
python -m unittest discover -s tests -p "test_*.py" -v

Set-Location $MobileDir
npm ci
npm test -- --watch=false
```

Verification point:
- Tests pass with no blocking failures.

## 6) Build Expo Artifacts (Android + iOS)

### 6.1 Android production AAB

```powershell
Set-Location $MobileDir
$androidRaw = eas build --platform android --profile production --non-interactive --wait --json
$androidBuild = $androidRaw | ConvertFrom-Json
if ($androidBuild -is [array]) { $androidBuild = $androidBuild[0] }
$AndroidBuildId = $androidBuild.id
$AndroidBuildUrl = $androidBuild.artifacts.buildUrl
$AndroidBuildId
$AndroidBuildUrl

Invoke-WebRequest -Uri $AndroidBuildUrl -OutFile $AndroidAsset
Get-Item $AndroidAsset | Select-Object Name, Length, LastWriteTime
```

Verification points:
- Build status is `finished` in EAS.
- Downloaded file exists and size is greater than 0.

### 6.2 iOS production IPA

```powershell
Set-Location $MobileDir
$iosRaw = eas build --platform ios --profile production --non-interactive --wait --json
$iosBuild = $iosRaw | ConvertFrom-Json
if ($iosBuild -is [array]) { $iosBuild = $iosBuild[0] }
$IosBuildId = $iosBuild.id
$IosBuildUrl = $iosBuild.artifacts.buildUrl
$IosBuildId
$IosBuildUrl

Invoke-WebRequest -Uri $IosBuildUrl -OutFile $IosAsset
Get-Item $IosAsset | Select-Object Name, Length, LastWriteTime
```

Verification points:
- Build status is `finished` in EAS.
- Downloaded file exists and size is greater than 0.

Optional direct build details:

```powershell
eas build:view $AndroidBuildId
eas build:view $IosBuildId
```

## 7) Commit, Tag, and Push

```powershell
Set-Location $RepoRoot
git add mobile_app/package.json mobile_app/app.json
git commit -m "chore(release): bump mobile version to v0.5.0"
git tag -a $Tag -m "Predictrix $Tag"
git push origin HEAD
git push origin $Tag
```

Verification points:
- `git tag --list $Tag` shows `v0.5.0`.
- `git ls-remote --tags origin $Tag` resolves the tag remotely.

## 8) Create GitHub Release and Upload Assets

Prepare release notes file:

```powershell
$ReleaseNotesFile = Join-Path $RepoRoot "docs\spikes\release-v0.5.0-notes.md"
@"
# Predictrix v0.5.0

## Highlights
- Mobile release artifacts for Android and iOS.
- Backend deployment target: Fly app predictrix-api.

## Verification
- Mobile artifacts built by EAS and attached to this release.
- Backend /health verified after deployment.
"@ | Set-Content $ReleaseNotesFile
```

Create release and upload assets:

```powershell
Set-Location $RepoRoot
gh release create $Tag --title "Predictrix $Tag" --notes-file $ReleaseNotesFile --verify-tag

gh release upload $Tag $AndroidAsset --clobber
gh release upload $Tag $IosAsset --clobber
```

Verification points:

```powershell
gh release view $Tag --json url,isDraft,isPrerelease,publishedAt,assets
```

- Release exists and is not draft unless intentionally set as draft.
- Assets list includes Android AAB and iOS IPA.

## 9) Deploy Backend to Fly

Use repository deployment script (includes auth, app existence, secrets preflight, deploy, scale checks):

```powershell
Set-Location $BackendDir
.\deploy_fly.ps1 -AppName predictrix-api -Region nrt -KeepRunning
```

Verification commands:

```powershell
fly status -a predictrix-api
fly checks list -a predictrix-api
fly machine list -a predictrix-api
Invoke-WebRequest -Uri "https://predictrix-api.fly.dev/health" -UseBasicParsing | Select-Object StatusCode, Content
fly logs -a predictrix-api --no-tail
```

Verification points:
- `fly status` shows app healthy and processes running.
- Health check endpoint returns HTTP 200.
- Logs show successful startup and no crash loop.

## 10) Credential-Unavailable Fallbacks

### 10.1 EAS credentials unavailable

If Expo auth or Apple signing is unavailable:

```powershell
# Fallback iOS artifact for testing distribution (simulator tar.gz)
Set-Location $MobileDir
$iosSimRaw = eas build --platform ios --profile preview --non-interactive --wait --json
$iosSimBuild = $iosSimRaw | ConvertFrom-Json
if ($iosSimBuild -is [array]) { $iosSimBuild = $iosSimBuild[0] }
$IosSimUrl = $iosSimBuild.artifacts.buildUrl
Invoke-WebRequest -Uri $IosSimUrl -OutFile $IosSimulatorAsset

# Upload simulator artifact instead of production IPA
Set-Location $RepoRoot
gh release upload $Tag $IosSimulatorAsset --clobber
```

If no Expo auth at all, stop mobile build and keep release as draft:

```powershell
gh release edit $Tag --draft --notes "Draft: Expo credentials unavailable, mobile artifacts pending."
```

### 10.2 GitHub credentials unavailable

- Build artifacts can still be generated locally.
- Keep local tag + artifacts and create handoff note:

```powershell
Set-Location $RepoRoot
$handoff = Join-Path $RepoRoot "docs\spikes\release-v0.5.0-handoff.md"
@"
# Release handoff for v0.5.0

GitHub auth was unavailable on release machine.

## Local artifacts
- $AndroidAsset
- $IosAsset

## Next operator actions
1. Authenticate gh CLI.
2. Push tag v0.5.0.
3. Create GitHub release and upload assets.
"@ | Set-Content $handoff
```

### 10.3 Fly deployment credentials unavailable

If `fly auth whoami` fails and cannot be resolved immediately:
- Do not run partial deploy commands.
- Keep release as draft (or update existing release notes) with deployment pending state.

```powershell
Set-Location $RepoRoot
gh release edit $Tag --draft --notes "Draft: Fly credentials unavailable, backend deploy pending."
```

Optional fallback if team policy allows Azure manual deployment through GitHub workflow (`.github/workflows/azure-deploy.yml`):

```powershell
Set-Location $RepoRoot
gh workflow run "Quality Gates and Azure Deploy" -f git_ref=$Tag -f environment=production -f run_smoke_tests=true -f confirm_deploy=DEPLOY_AZURE
```

Verification:

```powershell
gh run list --workflow "Quality Gates and Azure Deploy" --limit 1
```

## 11) Final Sign-off Checklist

- Mobile versions in `mobile_app/package.json` and `mobile_app/app.json` are `0.5.0`.
- Git tag `v0.5.0` exists on origin.
- GitHub release `v0.5.0` contains expected assets.
- Fly deployment completed and `/health` returns 200.
- Any credential fallback is documented in release notes/handoff file.
