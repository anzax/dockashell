#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting release from main branch...${NC}"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Switch to main if not already there
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔄 Switching to main branch..."
    git checkout main
fi

# Pull latest changes
echo "🔄 Pulling latest changes..."
git pull origin main

# Now run the release readiness check with any arguments passed
./scripts/ensure-release-ready.sh "$@"
