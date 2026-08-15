#!/bin/zsh
set -euo pipefail

REPO_DIR="/Users/canozgel-macmini/.openclaw/workspace"
LOG_DIR="$REPO_DIR/logs"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S %Z')"

mkdir -p "$LOG_DIR"
cd "$REPO_DIR"

# Skip the whole sync when the workspace is unchanged.
if [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]]; then
  exit 0
fi

git add -A

GIT_AUTHOR_NAME="Celine"
GIT_AUTHOR_EMAIL="celine@local"
GIT_COMMITTER_NAME="Celine"
GIT_COMMITTER_EMAIL="celine@local"
export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL

git commit -m "chore: automated workspace sync ($TIMESTAMP)"
git push origin main

echo "[$TIMESTAMP] Synced workspace to GitHub."
