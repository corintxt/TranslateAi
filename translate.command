#!/bin/bash

CONFIG=$(cat "$(dirname "$0")/config.json")
API_KEY=$(echo "$CONFIG" | grep -o '"apiKey": *"[^"]*"' | cut -d'"' -f4)
PROJECT_ID=$(echo "$CONFIG" | grep -o '"projectId": *"[^"]*"' | cut -d'"' -f4)

INPUT_FILE="/Users/cfaife/Documents/MATERIALS/Code/Illustrator/IllustratorTextConvert/translate.txt"
OUTPUT_FILE="$(dirname "$INPUT_FILE")/translation.txt"
TEXT=$(cat "$INPUT_FILE")
SOURCE_LANGUAGE="en" # ISO-639-1 code
TARGET_LANGUAGE="fr" # ISO-639-1 code

JSON_PAYLOAD='{
    "targetLang": "'"$TARGET_LANGUAGE"'",
    "q": "'"$TEXT"'"
}'

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" \
    "https://translation.googleapis.com/translate_text:translateText?key=${API_KEY}" )

if [[ "$response" == *"error"* ]]; then
    echo "Error: API request failed"
    echo "API Response: $response"
    exit 1
else
    echo "$response" | grep -o '"translatedText": *"[^"]*"' | cut -d'"' -f4 | sed 's/\[-----/\n[-----/g' > "$OUTPUT_FILE"
    echo "Translation saved to: $OUTPUT_FILE"
fi