#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~AFP-TRANSLATE-TEXT~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

# Read all document names from temp file, removing any carriage returns
while IFS= read -r document_name; do
    # Clean the document name by removing any carriage returns or spaces
    document_name=$(echo "$document_name" | tr -d '\r' | xargs)
    
    if [ -n "$document_name" ]; then
        echo "Processing document: $document_name"
        
        CONFIG="$(dirname "$0")/config.json"
        DEV_INPUT="/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/test/${document_name}.json"
        
        echo "Found text to translate. Executing translate.py..."
        python /Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/translate.py "$CONFIG" "$DEV_INPUT"
        
        echo "Completed processing: $document_name"
        echo "------------------------"
    fi
done < /tmp/current_doc.txt

echo "~~~~~~~~~FINISHED~~~~~~~~~~~"