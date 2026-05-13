#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./create-task.sh \"task name\""
  exit 1
fi

TASK_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

SLUG=$(echo "$TASK_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//')

TIMESTAMP=$(date +"%Y%m%dT%H%M")

TASK_PATH="$SCRIPT_DIR/../../tasks/${TIMESTAMP}_${SLUG}"

mkdir -p "$TASK_PATH/supporting-materials"

: > "$TASK_PATH/task.md"
: > "$TASK_PATH/implementation-plan.md"

echo "Task created: $TASK_PATH"