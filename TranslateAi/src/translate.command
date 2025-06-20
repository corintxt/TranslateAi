#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~~AFP-TRANSLATE-AI~~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

# Define document paths
DOCS_DIR="$HOME/Documents/TranslateAi"
SCRIPT_DIR="$(dirname "$0")"
CURRENT_DOC="$DOCS_DIR/current_doc.txt"
CERT_PATH="$SCRIPT_DIR/_.afp.com.pem"

# Remove any stale completion flags
if [ -f "$DOCS_DIR/translation_complete.flag" ]; then
    rm "$DOCS_DIR/translation_complete.flag"
fi

# Verify certificate exists
if [ ! -f "$CERT_PATH" ]; then
    echo "Error: Certificate file not found at $CERT_PATH"
    exit 1
fi

# Read all document names from temp file, removing any carriage returns
TRANSLATION_SUCCESS=false

while IFS= read -r document_name; do
    # Clean the document name by removing any carriage returns or spaces
    document_name=$(echo "$document_name" | tr -d '\r' | xargs)
    
    if [ -n "$document_name" ]; then
        echo "Processing document: $document_name"
        
        CONFIG="$SCRIPT_DIR/config.json"
        INPUT="$DOCS_DIR/${document_name}.json"
        
        echo "Found text to translate. Executing translate.py"
        python "$SCRIPT_DIR/translate.py" "$CONFIG" "$INPUT" "$CERT_PATH"
        
        # Check if translation was successful by looking for the output file
        if [ -f "$DOCS_DIR/T-${document_name}.json" ]; then
            TRANSLATION_SUCCESS=true
            echo "Translation successful for: $document_name"
        else
            echo "Translation failed for: $document_name"
        fi
        
        echo "Completed processing: $document_name"
        echo "------------------------"
    fi
done < "$CURRENT_DOC"

# If no translation flag was created by translate.py, create one here as backup
if [ "$TRANSLATION_SUCCESS" = true ] && [ ! -f "$DOCS_DIR/translation_complete.flag" ]; then
    # Get the first document name as fallback
    document_name=$(head -n 1 "$CURRENT_DOC" | tr -d '\r' | xargs)
    echo "$document_name" > "$DOCS_DIR/translation_complete.flag"
fi

echo "~~~~~~~~~FINISHED~~~~~~~~~~~"