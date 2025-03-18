#!/usr/bin/env python3

import os
import sys
import requests
import json


## CONFIG AND INPUT HANDLING
def load_config(config_file):
    """Load and parse the configuration file."""
    try:
        with open(config_file, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Config file not found: {config_file}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in config file: {config_file}")
        sys.exit(1)

def load_input_file(input_file):
    """Load and parse the input file, extracting target language and contents."""
    try:
        with open(input_file, encoding='utf-8') as f:
            input_data = json.load(f)
            
            target_language = input_data.get('targetLanguage')
            if not target_language:
                print("Error: targetLanguage not set")
                sys.exit(1)

            frames = input_data.get('frames', {})
            contents = {}
            for k, v in frames.items():
                text = v.get('contents', '')
                safe_text = json.loads(json.dumps(text))
                contents[k] = safe_text
                
            return input_data, target_language, contents
    except FileNotFoundError:
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in input file: {input_file}")
        sys.exit(1)


def write_json(filename, json_data):
    """Write data to a JSON file."""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing to file: {e}")


## THE API PART
def main():
    """
    Take config file and input file from system arguments.
    Read input file, send contents to translation API, and write to output file.
    """
    # Argument handling
    if len(sys.argv) < 2:
        print("Usage: translate.py <input_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    tl = sys.argv[2]

     # Load configuration and input file
    config = load_config('../Process/config.json')
    input_data, target_language, contents = load_input_file(input_file)

    print(f"Reading file: {input_file}")

    # Send to translation API
    data = {
        'inputText': json.dumps(contents), 
        'provider': 'OpenAiChatGpt',
        'destination_lang': tl
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    prod_url = config.get('prodUrl')
    print(f"Making request to {prod_url}")
    print(data)
    ## Add path to certificate to fix SSL warning
    cert_path = '_.afp.com.pem'
    response = requests.post(prod_url, data=data, 
                             headers=headers, 
                             verify=cert_path)
    status_code = response.status_code
    print(f"Status: {status_code}")
    print()

    # Continue with response handling
    response_json = json.dumps(response.json())
    r = json.loads(response_json)

    # Debugging: print response
    print(f"Response: {r}")

    # Check if translationText is empty string
    if r['translationText'] != None:
        got_translation = True
        # Escape some characters that break JSON
        string_check = r['translationText'].replace("\\'", "'")
        translation = json.loads(string_check)
    else:
        print("!! Translate API returned no text !!")
        got_translation = False

    # Write to file if translation is successful
    if got_translation:
        # Get base filename without path
        base_name = os.path.basename(input_file)
        # Write to file - same directory as input
        output_path = os.path.join(os.path.dirname(input_file), f'T-{base_name}')
        write_json(output_path, translation) # We could even switch this off for testing
        print(f"** Translation successful **")

if __name__ == "__main__":
   main()