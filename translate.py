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
# destination_language = input("Enter destination language: ")

# Read config variables
with open(config_file) as f:
    config = json.load(f)
    target_language = config["targetLanguage"]
print(f"Target language: {target_language}")

# Get text from input file
with open(input_file) as f:
    # text = json.load(f)
    text = f.read()
    # print(text)

# Parse JSON to extract content for translation

#### MAKE API CALL ####
def request_translation(url, data, headers):
    print("Making request to translate.afp.com")
    # Note: currently, verify=False is needed to avoid SSL error
    response = requests.post(url, data=data, headers=headers, verify=False)
    print(f"Status: {response.status_code}")
    # Add | spacer (command script looks for this)
    print("|")
    return(json.dumps(response.json()))

#Prod URL
url = 'https://translate.afp.com/translateapi/translate'
data = {
    'inputText': text, # this should be processed text 
    'provider': 'OpenAiChatGpt',
    'destination_lang': target_language
    }
headers = {'Content-Type': 'application/x-www-form-urlencoded'}

response = request_translation(url, data, headers)
print(response)