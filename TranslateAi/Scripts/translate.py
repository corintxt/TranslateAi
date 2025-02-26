#!/usr/bin/env python3

import os
import sys
import requests
import json
import datetime
import uuid
import socket
import platform


def log_via_http(message, logging_endpoint, api_key=None, client_id=None):
    """
    Log a message to Google Cloud Storage via an HTTP endpoint.
    
    Args:
        message: JSON string containing the message to log
        logging_endpoint: URL of the logging service
        api_key: API key for authentication
        client_id: Unique identifier for this client
    
    Returns:
        Server response
    """
    # Set up headers with authentication if provided
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
            data=message,  # Send message directly since it's already formatted
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
    Log translation event to Cloud Storage as JSON.
    """
    job = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "client_id": str(uuid.uuid4()),
        "hostname": socket.gethostname(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "input_file": os.path.basename(input_file),
        "target_language": target_language,
        "status_code": status_code,
        "got_translation": got_translation
    }
    
    logging_endpoint = config.get('devEndpoint')
    api_key = config.get('logging-key')
    
    response = log_via_http(
        message=json.dumps(job),
        logging_endpoint=logging_endpoint,
        api_key=api_key
    )
    
    if not response:
        print("Warning: Failed to log translation event", file=sys.stderr)

def main():
    # Argument handling
    if len(sys.argv) < 3:
        print("Usage: translate_log.py <config_file> <input_file>")
        sys.exit(1)
        
    config_file = sys.argv[1]
    input_file = sys.argv[2]

    # Read config variables
    with open(config_file) as f:
        config = json.load(f)
        dev_url = config.get('devUrl')
        prod_url = config.get('prodUrl')

    print(f"Reading file: {input_file}")
    print()

    # Get text from input json
    with open(input_file) as f:
        input = json.load(f)

        target_language = input.get('targetLanguage')
        if not target_language:
            print("Error: targetLanguage not set")
            sys.exit(1)

        frames = input['frames']
        contents = {}
        for k, v in frames.items():
            text = v['contents']
            safe_text = json.loads(json.dumps(text))
            contents[k] = safe_text

    # Send to translation API
    data = {
        'inputText': json.dumps(contents), 
        'provider': 'OpenAiChatGpt',
        'destination_lang': target_language
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    print(f"Making request to {prod_url}")
    response = requests.post(prod_url, data=data, headers=headers, verify=False)
    status_code = response.status_code
    print(f"Status: {status_code}")
    print()

    # Continue with response handling
    response_json = json.dumps(response.json())
    r = json.loads(response_json)

    # First we should check if translationText is more than empty string:
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
    if got_translation:
        merged = merge_translations(input, translation)
        # Get base filename without path
        base_name = os.path.basename(input_file)
        # Write to file - same directory as input
        output_path = os.path.join(os.path.dirname(input_file), f'T-{base_name}')
        write_json(output_path, merged)
        print(f"Translation successful!")

if __name__ == "__main__":
   main()