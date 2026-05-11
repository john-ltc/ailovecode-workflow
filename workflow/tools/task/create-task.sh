#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./create-task.sh \"task name\""
  exit 1
fi

TASK_NAME="$1"

SLUG=$(echo "$TASK_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\\+/-/g' | sed 's/^-//' | sed 's/-$//')

TIMESTAMP=$(date +"%Y%m%d_%H%M")

TASK_PATH="../../tasks/${TIMESTAMP}_${SLUG}"

mkdir -p "$TASK_PATH/supporting-materials"

cat <<EOF > "$TASK_PATH/task.md"
# $TASK_NAME

## Notes

EOF

cat <<EOF > "$TASK_PATH/implementation-plan.md"
# Implementation Plan: $TASK_NAME

## Summary

## Goals

## Architecture

## Implementation Steps

## Testing

## Progress

EOF

echo "Task created: $TASK_PATH"