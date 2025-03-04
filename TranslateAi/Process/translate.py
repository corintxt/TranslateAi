#!/usr/bin/env python3

import os
import sys
import requests
import json
import datetime
import uuid
import socket
import platform

## LOGGING STUFF
def log_via_http(message, logging_endpoint, api_key=None, client_id=None):
    """
    Adaptable function to log data to Google Cloud Storage via HTTP endpoint.
    
    Args:
        message: JSON string containing data
        logging_endpoint: URL of logging service
        api_key: Key for authentication
        client_id: Optional identifier for the client
    
    Returns:
        Server response
    """
    # Set up headers with authentication (if provided)
    headers = {
        "Content-Type": "application/json"
    }
    
    if api_key:
        headers["X-API-Key"] = api_key
    
    # Send the data to the logging endpoint
    try:
        response = requests.post(
            logging_endpoint,
            headers=headers,
            data=message,
            timeout=10
        )
        
        # Check if the request was successful
        response.raise_for_status()
        return response.json()
    
    except requests.exceptions.RequestException as e:
        print(f"Error sending log: {e}", file=sys.stderr)
        return None


def log_translation_event(config, 
                          input_file, 
                          target_language, 
                          status_code, 
                          got_translation):
    """
    Specific function to log data from Translate.Ai translation event.
    """
    job = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "client_id": str(uuid.uuid4())[:8],
        "hostname": socket.gethostname(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "input_file": os.path.basename(input_file),
        "target_language": target_language,
        "status_code": status_code,
        "translation_returned": got_translation,
        "error_message": None
    }
    
    logging_endpoint = config.get('loggingEndpoint')
    api_key = config.get('logging-key')
    
    response = log_via_http(
        message=json.dumps(job),
        logging_endpoint=logging_endpoint,
        api_key=api_key
    )
    
    if not response:
        print("Warning: Failed to log translation event", file=sys.stderr)

## JSON STUFF
def merge_translations(input_json, translations):
    """Merge translation contents with original JSON input."""
    for key in input_json['frames']:
        if key in translations:
            input_json['frames'][key]['contents'] = translations[key]
    return input_json


def write_json(filename, json_data):
    """Write data to a JSON file."""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing to file: {e}")

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


## THE API PART
def main():
    """
    Take config file and input file from system arguments.
    Read input file, send contents to translation API, and write to output file.
    """
    # Argument handling
    if len(sys.argv) < 3:
        print("Usage: translate.py <config_file> <input_file>")
        sys.exit(1)
        
    config_file = sys.argv[1]
    input_file = sys.argv[2]

    # Normalize paths for cross-platform compatibility
    config_file = os.path.normpath(config_file)
    input_file = os.path.normpath(input_file)

     # Load configuration and input file
    config = load_config(config_file)
    input_data, target_language, contents = load_input_file(input_file)

    print(f"Reading file: {input_file}")
    print()

    # Send to translation API
    data = {
        'inputText': json.dumps(contents), 
        'provider': 'OpenAiChatGpt',
        'destination_lang': target_language
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    prod_url = config.get('prodUrl')
    print(f"Making request to {prod_url}")
    print()
    response = requests.post(prod_url, data=data, headers=headers, verify=False)
    status_code = response.status_code
    print(f"Status: {status_code}")
    print()

    # Continue with response handling
    response_json = json.dumps(response.json())
    r = json.loads(response_json)

    # Check if translationText is empty string
    if r['translationText'] != '':
        got_translation = True
        # Escape some characters that break JSON
        string_check = r['translationText'].replace("\\'", "'")
        translation = json.loads(string_check)
    else:
        print("!! Translate API returned no text !!")
        got_translation = False

    # Log translation event
    log_translation_event(config, input_file, target_language, status_code, got_translation)

    # Write to file if translation is successful
    if got_translation:
        merged = merge_translations(input_data, translation)
        # Get base filename without path
        base_name = os.path.basename(input_file)
        # Write to file - same directory as input
        output_path = os.path.join(os.path.dirname(input_file), f'T-{base_name}')
        write_json(output_path, merged)
        print(f"** Translation successful **")

if __name__ == "__main__":
   main()