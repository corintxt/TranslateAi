#!/bin/bash
CONFIG=$(cat "$(dirname "$0")/config.json")
API_KEY=$(echo "$CONFIG" | grep -o '"apiKey": *"[^"]*"' | cut -d'"' -f4)
TEXT=$(cat /tmp/translate_args.txt)

/usr/bin/curl -X POST 'https://api.anthropic.com/v1/messages' \
 -H "x-api-key: $API_KEY" \
 -H 'Content-Type: application/json' \
 -H 'anthropic-version: 2023-06-01' \
 -d '{"model":"claude-3-sonnet-20240229","max_tokens":1024,"messages":[{"role":"user","content":"Translate to French: '"$TEXT"'"}]}'