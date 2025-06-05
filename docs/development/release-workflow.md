# 🚀 DockaShell Release Workflow

## 📋 Simple Release Process

### 1️⃣ From main branch (recommended)

```bash
# Interactive (prompts for version)
npm run release:from-main

# Skip prompts (specify version directly)
npm run release:from-main -- 0.3.0
```

**What it does:** Switches to main, pulls latest, creates `release/vX.Y.Z`, runs release

### 1️⃣b Just create release branch (no release)

```bash
./scripts/ensure-release-ready.sh 0.3.0
```

**What it does:** Only creates `release/v0.3.0` branch, then manually run `npm run release:minor`

### 2️⃣ Manual release (if already on correct branch)

```bash
npm run release:patch    # 0.2.0 → 0.2.1
npm run release:minor    # 0.2.0 → 0.3.0
npm run release:major    # 0.2.0 → 1.0.0
```

## 🔄 What happens automatically

- ✅ Checks you're on main or release/\* branch
- ✅ Ensures main is up-to-date with origin
- ✅ Creates release branch (if on main)
- ✅ Runs format, tests, and lint
- ✅ Bumps version and creates git tag
- ✅ Publishes to npm
- ✅ Creates DRAFT GitHub release

## 📝 After release completes

1. **Push release branch:** `git push -u origin <branch-name>`
2. **Create PR:** release branch → main
3. **Merge PR**
4. **Edit and publish the GitHub release draft**

## 💡 Tips

- **Draft releases** let you write custom release notes
- **No more overwhelming auto-generated changelogs**
- **Release branches protect main** from release commits
- **Process works with protected main branches**

## 🔧 Configuration

Release behavior is configured in `.release-it.json`:

- **Format + Test + Lint** run before every release
- **Draft GitHub releases** are created (not published automatically)
- **No direct pushes to main** - uses release branches
- **Clean working directory** required before release

## 🚨 Troubleshooting

**"Working directory is not clean"**

```bash
git add . && git commit -m "fix: commit changes before release"
```

**"Local main is not up to date"**

```bash
git checkout main && git pull origin main
```

**"Branch release/vX.Y.Z already exists"**

```bash
git branch -D release/vX.Y.Z  # Delete local branch
git push origin --delete release/vX.Y.Z  # Delete remote if needed
```
