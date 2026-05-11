#!/usr/bin/env bash

set -e

START_TAG="<ailovecode-workflow>"
END_TAG="</ailovecode-workflow>"

BLOCK=$(cat <<'EOF'
<ailovecode-workflow>
This project uses AILoveCode Workflow.

Before implementation:

1. Read `workflow/guidelines.md`.
2. Read the relevant `workflow/tasks/*/task.md`.
3. Use `implementation-plan.md` for planning and progress.
4. Do not modify `task.md` unless explicitly requested.

Core rules:

- `task.md` is the user-owned source of truth.
- AI should create or update `implementation-plan.md` before implementation.
- Keep documentation minimal and practical.
- Keep task-related files inside the relevant task folder.
</ailovecode-workflow>
EOF
)

update_file() {
  local file="$1"

  if [ -f "$file" ]; then
    if grep -q "$START_TAG" "$file" && grep -q "$END_TAG" "$file"; then
      awk -v start="$START_TAG" -v end="$END_TAG" -v block="$BLOCK" '
        BEGIN { in_block = 0 }
        index($0, start) {
          print block
          in_block = 1
          next
        }
        index($0, end) {
          in_block = 0
          next
        }
        !in_block { print }
      ' "$file" > "$file.tmp"
      mv "$file.tmp" "$file"
      echo "Updated existing AILoveCode Workflow block in $file"
    else
      {
        echo ""
        echo "$BLOCK"
      } >> "$file"
      echo "Appended AILoveCode Workflow block to $file"
    fi
  else
    {
      echo "# $file"
      echo ""
      echo "$BLOCK"
    } > "$file"
    echo "Created $file"
  fi
}

update_file "AGENTS.md"
update_file "CLAUDE.md"

echo ""
echo "AILoveCode Workflow installation completed."
echo "AI tools should now reference workflow/guidelines.md."
