#!/bin/zsh
set -euo pipefail

WORKDIR="/Users/canozgel-macmini/.openclaw/workspace"
PROMPT_FILE="$WORKDIR/scripts/italy-agriculture-property-watch-prompt.md"
TARGET="+971585126812"
SESSION_KEY="agent:main:italy-agriculture-property-watch"
DELIVER="${ITALY_AGRI_WATCH_DELIVER:-1}"

cd "$WORKDIR"

cmd=(
  openclaw agent
  --agent main
  --session-key "$SESSION_KEY"
  --message-file "$PROMPT_FILE"
  --thinking high
  --timeout 1200
)

if [[ "$DELIVER" == "1" ]]; then
  cmd+=(
    --deliver
    --reply-channel whatsapp
    --reply-to "$TARGET"
  )
fi

"${cmd[@]}"
