#!/bin/zsh
set -euo pipefail

REPO_DIR="/Users/canozgel-macmini/.openclaw/workspace"
LOG_DIR="$REPO_DIR/logs"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S %Z')"

mkdir -p "$LOG_DIR"
cd "$REPO_DIR"

# Refresh index and exit early if nothing changed.
git add -A
if git diff --cached --quiet; then
  echo "[$TIMESTAMP] No changes to sync."
  exit 0
fi

GIT_AUTHOR_NAME="Celine"
GIT_AUTHOR_EMAIL="celine@local"
GIT_COMMITTER_NAME="Celine"
GIT_COMMITTER_EMAIL="celine@local"
export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL

git commit -m "chore: automated workspace sync ($TIMESTAMP)"
git push origin main

echo "[$TIMESTAMP] Synced workspace to GitHub."
