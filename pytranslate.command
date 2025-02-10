#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~~~TRANSLATE.TEXT~~~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

CONFIG="$(dirname "$0")/config.json"
INPUT_FILE="/tmp/translate_input.txt"
OUTPUT_FILE="$(dirname "$INPUT_FILE")/translation.txt"

# Python script called with arguments, output written to file
echo "Found text to translate. Executing translate.py..."
python /Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/translate.py "$CONFIG" "$INPUT_FILE" > "$OUTPUT_FILE"
echo "Translation saved to: $OUTPUT_FILE"

echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "Ready to import translation!"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"