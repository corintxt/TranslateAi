import os
import sys
import requests
import json

#### HANDLE ARGUMENTS, LOAD TEXT ####
## Arguments
# 1. Config file
config_file = sys.argv[1]
# 2. Text to translate
input_file = sys.argv[2]

# Read config variables
with open(config_file) as f:
    config = json.load(f)
    dev_url = config.get('devUrl')
    prod_url = config.get('prodUrl')

print(f"Reading file: {input_file}")
print()

# Get text from input json, extract frame index and contents
with open(input_file) as f:
    input = json.load(f)

    target_language = input.get('targetLanguage')
    if not target_language:
        print("Error: targetLanguage not set")
        sys.exit(1)

    frames = input['frames']
    # Create new dictionary with just key and contents
    contents = {}
    for k, v in frames.items():
        text = v['contents']
        # Use json to sanitize string, handle apostrophes etc.
        safe_text = json.loads(json.dumps(text))
        contents[k] = safe_text

#### MAKE API CALL ####
def request_translation(url, data, headers):
    print(f"Making request to {url}")
    # Note: currently, verify=False is needed to avoid SSL error
    response = requests.post(url, data=data, headers=headers, verify=False)
    print(f"Status: {response.status_code}")
    print()
    return(json.dumps(response.json()))

data = {
    'inputText': json.dumps(contents), 
    'provider': 'OpenAiChatGpt',
    'destination_lang': target_language
    }
# Headers for form data (needed by translate API)
headers = {'Content-Type': 'application/x-www-form-urlencoded'}
# Make request - URL is read from config
response = request_translation(prod_url, data, headers)

print("---------Result:---------")

#### PARSE RESPONSE & MERGE WITH FRAME PROPERTIES ####
r = json.loads(response)
# First we should check if translationText is more than empty string.
if r['translationText'] != '':
    # Escape some characters that break JSON
    string_check = r['translationText'].replace("\\'", "'")
    translation = json.loads(string_check)
else:
    print("!! Translate API returned no text !!")
    translation = None

# Merge translation contents with original JSON input, keeping other values same
def merge_translations(input_json, translations):
    for key in input_json['frames']:
        if key in translations:
            input_json['frames'][key]['contents'] = translations[key]
    return input_json

# Write to file as JSON
def write_json(filename, json_data):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing to file: {e}")

# Write to file if translation is successful
if translation:
    merged = merge_translations(input, translation)
    # Get base filename without path
    base_name = os.path.basename(input_file)
    # Write to file - same directory as input
    output_path = os.path.join(os.path.dirname(input_file), f'T-{base_name}')
    write_json(output_path, merged)
    print(f"Translation successful!")