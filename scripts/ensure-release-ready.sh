#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Checking release readiness...${NC}"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if version was passed as argument
TARGET_VERSION="$1"

# If on main, create release branch automatically
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${YELLOW}⚠️  You're on main branch${NC}"
    
    # Check if main is up to date
    echo "🔄 Fetching latest changes..."
    git fetch origin main
    
    # Check if local main is behind remote
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo -e "${RED}❌ Local main is not up to date with origin/main${NC}"
        echo "💡 Run: git pull origin main"
        exit 1
    fi
    
    # Check if working directory is clean
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${RED}❌ Working directory is not clean${NC}"
        echo "💡 Commit or stash your changes first"
        exit 1
    fi
    
    # Get current version from package.json
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    echo "📦 Current version: $CURRENT_VERSION"
    echo ""
    
    # Get target version (from argument or user input)
    if [ -z "$TARGET_VERSION" ]; then
        echo -e "${YELLOW}🎯 What version do you want to release?${NC}"
        echo "💡 Examples: 0.3.0 (minor), 0.2.1 (patch), 1.0.0 (major)"
        echo -n "Enter version: "
        read -r TARGET_VERSION
    else
        echo "🎯 Target version: $TARGET_VERSION (from argument)"
    fi
    
    # Validate version format (basic semver check)
    if ! echo "$TARGET_VERSION" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9\-\.]+)?$' > /dev/null; then
        echo -e "${RED}❌ Invalid version format. Use semver: x.y.z${NC}"
        exit 1
    fi
    
    # Create release branch name
    RELEASE_BRANCH="release/v$TARGET_VERSION"
    
    # Check if branch already exists
    if git branch -a | grep -q "$RELEASE_BRANCH"; then
        echo -e "${RED}❌ Branch $RELEASE_BRANCH already exists${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✨ Creating release branch: $RELEASE_BRANCH${NC}"
    git checkout -b "$RELEASE_BRANCH"
    
    # Set git config to push to this branch
    git config branch."$RELEASE_BRANCH".remote origin
    git config branch."$RELEASE_BRANCH".merge refs/heads/"$RELEASE_BRANCH"
    
    echo -e "${GREEN}✅ Release branch created successfully!${NC}"
    echo "📋 After release completes:"
    echo "   1. Push: git push -u origin $RELEASE_BRANCH"
    echo "   2. Create PR: $RELEASE_BRANCH → main"
    echo "   3. Merge PR and publish GitHub release"
    
elif [[ "$CURRENT_BRANCH" == release/* ]]; then
    echo -e "${GREEN}✅ Already on release branch: $CURRENT_BRANCH${NC}"
    
else
    echo -e "${RED}❌ Must be on 'main' branch or 'release/*' branch${NC}"
    echo "💡 Current branch: $CURRENT_BRANCH"
    echo "💡 Switch to main: git checkout main"
    exit 1
fi

echo -e "${GREEN}🎯 Release readiness check passed!${NC}"
