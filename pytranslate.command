#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~AFP-TRANSLATE-TEXT~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

CONFIG="$(dirname "$0")/config.json"
INPUT_FILE="/tmp/translate_input.txt"
OUTPUT_FILE="$(dirname "$INPUT_FILE")/translation.json"

echo "Found text to translate. Executing translate.py..."
# Run translate.py with arguments, assign output to RESPONSE
RESPONSE=$(python /Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/translate.py "$CONFIG" "$INPUT_FILE")
# Write everything in RESPONSE after | symbol to OUTPUT_FILE, stripping lead space
echo $RESPONSE | sed 's/.*|//' | sed 's/^ *//' > $OUTPUT_FILE
echo "Translation saved to: $OUTPUT_FILE"

echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "=> Ready to import translation."
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"