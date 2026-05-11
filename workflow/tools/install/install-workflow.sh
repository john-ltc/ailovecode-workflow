#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

append_if_missing() {
  local file="$1"

  if [ ! -f "$file" ]; then
    echo "# $(basename "$file")" > "$file"
    echo "" >> "$file"
  fi

  if grep -q "<ailovecode-workflow>" "$file"; then
    echo "Already installed: $file"
  else
    cat >> "$file" <<'EOF'

<ailovecode-workflow>
This project uses AILoveCode Workflow.

Before working on any task, read and follow:

`workflow/guidelines.md`

Core rule:

Do not modify `task.md` unless explicitly requested.
</ailovecode-workflow>
EOF

    echo "Appended: $file"
  fi
}

append_if_missing "$PROJECT_ROOT/AGENTS.md"
append_if_missing "$PROJECT_ROOT/CLAUDE.md"

echo ""
echo "AILoveCode Workflow installed."
echo "Project root: $PROJECT_ROOT"