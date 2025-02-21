#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~AFP-TRANSLATE-TEXT~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

# Get document name from temp file
document_name=$(cat /tmp/current_doc.txt)
echo "Processing document: $document_name"

CONFIG="$(dirname "$0")/config.json"
INPUT_FILE="/tmp/$document_name.json"
DEV_INPUT="/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/test/$document_name.json"

echo "Found text to translate. Executing translate.py..."
# Run translate.py with arguments
python /Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/translate.py "$CONFIG" "$DEV_INPUT"

echo "~~~~~~~~~FINISHED.~~~~~~~~~~~"