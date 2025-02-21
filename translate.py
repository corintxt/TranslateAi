import json
import sys
import requests

#### HANDLE ARGUMENTS, LOAD TEXT ####
## Arguments
# 1. Config file
config_file = sys.argv[1]
# 2. Text to translate
input_file = sys.argv[2]
# Optional: user can specify language through CLI dialogue
target_language = input("Enter target language code: ")

# Read config variables
with open(config_file) as f:
    config = json.load(f)
    # target_language = config["targetLanguage"]

print(f"Target language: {target_language}")

# Get text from input json, extract frame index and contents
with open(input_file) as f:
    input = json.load(f)
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
    # Add | spacer (command script looks for this)
    print("|")
    return(json.dumps(response.json()))

#Dev URL
dev_url = 'https://vspar-ia-t-transcript-01.afp.com:8046/translate'
#Prod URL
url = 'https://translate.afp.com/translateapi/translate'
data = {
    'inputText': json.dumps(contents), # this should be processed text 
    'provider': 'OpenAiChatGpt',
    'destination_lang': target_language
    }
headers = {'Content-Type': 'application/x-www-form-urlencoded'}
response = request_translation(dev_url, data, headers)
# Print response to stdout for command script to capture
# print(response)

#### PARSE RESPONSE & MERGE WITH FRAME PROPERTIES ####
r = json.loads(response)
# First we should check if translationText is more than empty string.
if r['translationText'] != '':
    # Escape some characters that break JSON
    string_check = r['translationText'].replace("\\'", "'")
    translation = json.loads(string_check)
else:
    print("!! Translate API returned no text !! Please try again.")
    translation = None

# Merge translation with frame 'contents', keeping other values
def merge_translations(input_json, translations):
    for key in input_json['frames']:
        if key in translations:
            input_json['frames'][key]['contents'] = translations[key]
    return input_json

# Write to file as JSON (for debugging)
def write_json(filename, json_data):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing to file: {e}")

if translation:
    merged = merge_translations(input, translation)
    write_json('/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/test/merged.json', merged)
    print("Translation complete!")


