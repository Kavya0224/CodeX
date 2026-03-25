#!/bin/bash

set -e

LANGUAGE="$1"
FILE_PATH="$2"
INPUT_PATH="$3"

if [ "$LANGUAGE" = "javascript" ]; then
  timeout 5s node "$FILE_PATH" < "$INPUT_PATH"
  exit 0
fi

if [ "$LANGUAGE" = "cpp" ]; then
  OUTPUT_BINARY="/tmp/program.out"
  g++ "$FILE_PATH" -o "$OUTPUT_BINARY"
  timeout 5s "$OUTPUT_BINARY" < "$INPUT_PATH"
  exit 0
fi

echo "Unsupported language: $LANGUAGE" >&2
exit 1