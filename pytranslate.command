#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~~~TRANSLATE.TEXT~~~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

CONFIG="$(dirname "$0")/config.json"
# ARG_FILE="/tmp/translate_args.txt"
INPUT_FILE="/tmp/translate_input.txt"
OUTPUT_FILE="$(dirname "$INPUT_FILE")/translation.txt"

echo "Found text to translate."

python /Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/translate.py "$CONFIG" "$INPUT_FILE"


echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "Ready to import translation!"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"