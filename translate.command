#!/bin/bash

# Read config and API key
CONFIG=$(cat "$(dirname "$0")/config.json")
API_KEY=$(echo "$CONFIG" | grep -o '"apiKey": *"[^"]*"' | cut -d'"' -f4)

# Read the input file
TEXT=$(cat /Users/cfaife/Documents/MATERIALS/Code/Illustrator/IllustratorTextConvert/translate.txt)
TARGET_LANGUAGE="French"

# Function to escape JSON string
escape_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//\//\\/}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    echo "$s"
}

# Escape the text content
ESCAPED_TEXT=$(escape_json "$TEXT")

# Create JSON payload
JSON_PAYLOAD='{
    "model": "claude-3-sonnet-20240229",
    "system": "You are a helpful translator. Translate the following text into '"$TARGET_LANGUAGE"'. Preserve all line breaks and formatting.",
    "messages": [
        {
            "role": "user",
            "content": "'"$ESCAPED_TEXT"'"
        }
    ],
    "max_tokens": 4096
}'

# Make the API request
response=$(curl -s -X POST "https://api.anthropic.com/v1/messages" \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$JSON_PAYLOAD")

# Extract translated text using grep and sed
if [[ "$response" == *"error"* ]]; then
    echo "Error: API request failed"
    echo "API Response: $response"
    exit 1
else
    echo "$response" | grep -o '"text":"[^"]*"' | sed 's/"text":"\(.*\)"/\1/'
fi