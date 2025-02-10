import json
import sys
import requests

#### GET ARGUMENTS AND TEXT ####

## Arguments
# 0. Config file
config_file = sys.argv[1]
# 1. Text to translate
input_file = sys.argv[2]
# 2. Optional: user can specify language
# destination_language = input("Enter destination language: ")

# Read target lang. from config
with open(config_file) as f:
    config = json.load(f)
    target_language = config["targetLanguage"]

print(f"Target language: {target_language}")

# Get text from input file
with open(input_file) as f:
    text = f.read()
    # print(text)

#### MAKE API CALL ####
#Prod URL
url = 'https://translate.afp.com/translateapi/translate'

data = {
    'inputText': text,
    'provider': 'OpenAiChatGpt',
    'destination_lang': target_language
    }

headers = {'Content-Type': 'application/x-www-form-urlencoded'}

print("Making request to translate.afp.com...")

response = requests.post(url, data=data, headers=headers, verify=False)

print(f"Status: {response.status_code}")
print("|")
print(json.dumps(response.json()))