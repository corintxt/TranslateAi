import json
import sys
import requests


print("Executing translate.py")

## Arguments
# 0. Config / API key
config_file = sys.argv[1]
# 1. Text to translate
input_file = sys.argv[2]
# 2. Target language
## This could also be entered into config.json
target_language = input("Enter target language: ")
# 3. Source language

# Read API key from config
with open(config_file) as f:
    config = json.load(f)
    api_key = config["apiKey"]

# Get text from input file
with open(input_file) as f:
    text = f.read()

# Return translated text / bash script writes to output file
