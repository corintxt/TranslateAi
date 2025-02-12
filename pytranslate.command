#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~AFP-TRANSLATE-TEXT~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

CONFIG="$(dirname "$0")/config.json"
INPUT_FILE="/tmp/translateinput.json"
OUTPUT_FILE="$(dirname "$INPUT_FILE")/translation.json"
DEV_INPUT="/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/test/input.json"

echo "Found text to translate. Executing translate.py..."
# Run translate.py with arguments
python /Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/translate.py "$CONFIG" "$DEV_INPUT"

# Run translate.py with arguments, assign output to RESPONSE
# RESPONSE=$(python /Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/translate.py "$CONFIG" "$DEV_INPUT")
# Write everything in RESPONSE after | symbol to OUTPUT_FILE, stripping lead space
# echo $RESPONSE | sed 's/.*|//' | sed 's/^ *//' > $OUTPUT_FILE

# echo "Translation saved to: $OUTPUT_FILE"

echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "=> Ready to import translation."
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"