#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~AFP-TRANSLATE-TEXT~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

# Define document paths
DOCS_DIR="$HOME/Documents/TranslateAi"
SCRIPT_DIR="$(dirname "$0")"
CURRENT_DOC="$DOCS_DIR/current_doc.txt"

# Read all document names from temp file, removing any carriage returns
while IFS= read -r document_name; do
    # Clean the document name by removing any carriage returns or spaces
    document_name=$(echo "$document_name" | tr -d '\r' | xargs)
    
    if [ -n "$document_name" ]; then
        echo "Processing document: $document_name"
        
        CONFIG="$SCRIPT_DIR/config.json"
        INPUT="$DOCS_DIR/${document_name}.json"
        
        echo "Found text to translate. Executing translate.py..."
        python "$SCRIPT_DIR/translate.py" "$CONFIG" "$INPUT"
        
        echo "Completed processing: $document_name"
        echo "------------------------"
    fi
done < "$CURRENT_DOC"

echo "~~~~~~~~~FINISHED~~~~~~~~~~~"