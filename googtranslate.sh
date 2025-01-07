#!/bin/bash

# Set your Google Cloud project ID.
PROJECT_ID="your-project-id" # Replace with your project ID

# Function to translate text.
translate_text() {
  local text="$1"
  local target_language="$2"

  # Construct the API request URL.
  local url="https://translation.googleapis.com/v3/projects/$PROJECT_ID/locations/global:translateText"

  # Construct the request body.
  local request_body=$(jq -n \
    --arg text "$text" \
    --arg targetLanguage "$target_language" \
    '{
      "contents": [
        $text
      ],
      "targetLanguageCode": $targetLanguage
    }')

  # Make the API request using curl with service account authentication.
  local response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -d "$request_body" \
    "$url")

  # Extract the translated text using jq.
  local translated_text=$(echo "$response" | jq -r '.translations[0].translatedText')

  # Check for errors
  if [[ -z "$translated_text" ]]; then
      local error_message=$(echo "$response" | jq -r '.error.message')
      echo "Error: $error_message" >&2
      return 1 # Indicate failure
  fi

  echo "$translated_text"
}

# Check if text is provided as an argument.
if [ -z "$1" ]; then
  echo "Usage: $0 \"text to translate\" [target_language]"
  echo "       Defaults to translating to French (fr)"
  exit 1
fi

text_to_translate="$1"
target_language="${2:-fr}" # Default to French if no target language is provided.

# Set Google Application Credentials if not already set.
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service_account_key.json" # Replace with your key path
    if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        echo "Error: GOOGLE_APPLICATION_CREDENTIALS not set and key file not found." >&2
        exit 1
    fi
fi

translated_text=$(translate_text "$text_to_translate" "$target_language")

if [[ $? -eq 0 ]]; then # Check the exit status of the function
    echo "Translated text: $translated_text"
else
    exit 1 # Exit with error if translation failed
fi

exit 0