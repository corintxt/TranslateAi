#!/usr/bin/env python3

import os
import sys
import requests
import json
import datetime
import uuid
import socket
import platform
import time

## IP ADDRESS UTILITIES
def get_local_ip():
    """Get the local IP address of the machine."""
    try:
        # Connect to a remote address to determine local IP
        # This doesn't actually send data, just establishes which interface would be used
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "unknown"


def get_network_info():
    """Get comprehensive network information."""
    try:
        hostname = socket.gethostname()
        local_ip = get_local_ip()
        
        return {
            "hostname": hostname,
            "local_ip": local_ip,
        }
    except Exception as e:
        return {
            "hostname": "unknown",
            "local_ip": "unknown", 
            "error": str(e)
        }

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
                          got_translation,
                          error_message=None,
                          duration_seconds=None,
                          total_frames=0,
                          successful_frames=0,
                          failed_frames=None,
                          total_characters=0,
                          total_retries=0,
                          avg_time_per_frame=None):
    """
    Enhanced function to log comprehensive translation metrics.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Get network information
    network_info = get_network_info()
    
    # Calculate derived metrics
    failed_frame_count = len(failed_frames) if failed_frames else 0
    success_rate = (successful_frames / total_frames) if total_frames > 0 else 0
    frames_per_second = (successful_frames / duration_seconds) if duration_seconds and duration_seconds > 0 else 0
    characters_per_second = (total_characters / duration_seconds) if duration_seconds and duration_seconds > 0 else 0
    avg_characters_per_frame = (total_characters / total_frames) if total_frames > 0 else 0
    
    job = {
        # Temporal data
        "timestamp": now.isoformat(),
        "date": now.date().isoformat(),
        "hour": now.hour,
        
        # Session identification
        "session_id": str(uuid.uuid4())[:12],
        
        # Network & System information
        "hostname": network_info["hostname"],
        "local_ip": network_info["local_ip"],
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        
        # Job details
        "input_file": os.path.basename(input_file),
        "target_language": target_language,
        "status_code": status_code,
        "translation_returned": got_translation,
        "error_message": error_message,
        
        # Performance metrics
        "duration_seconds": round(duration_seconds, 2) if duration_seconds else None,
        "total_frames": total_frames,
        "successful_frames": successful_frames,
        "failed_frames": failed_frame_count,
        "success_rate": round(success_rate, 3),
        "avg_time_per_frame": round(avg_time_per_frame, 2) if avg_time_per_frame else None,
        "frames_per_second": round(frames_per_second, 2),
        
        # Content metrics
        "total_characters": total_characters,
        "characters_per_second": round(characters_per_second, 1),
        "avg_characters_per_frame": round(avg_characters_per_frame, 1),
        
        # Reliability metrics
        "total_retries": total_retries,
        "retry_rate": round(total_retries / total_frames, 2) if total_frames > 0 else 0,
        
        # Status flags for easy filtering
        "is_complete_success": got_translation and failed_frame_count == 0,
        "is_partial_success": successful_frames > 0 and failed_frame_count > 0,
        "is_complete_failure": successful_frames == 0,
        "has_retries": total_retries > 0,
        
        # Failed frame details (limited to prevent log bloat)
        "failed_frame_ids": failed_frames[:10] if failed_frames else []
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
def send_translation_request(url, data, cert_path, dev_mode=False):
    """
    Send translation request to the API endpoint.
    
    Args:
        url: URL of the translation service
        data: Request data
        cert_path: Path to SSL certificate
        
    Returns:
        Tuple of (status_code, response_json, got_translation, translation, error_message)
    """
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    print(f"Making request to {url}")
    
    # Debugging: print data
    if dev_mode:
        print("** Dev mode enabled. Request data: **")
        print(json.dumps(data, indent=4))
    
    try:
        response = requests.post(url, data=data, 
                                headers=headers, 
                                verify=cert_path)
        status_code = response.status_code
        print(f"Status: {status_code}")
        print()

        # Handle response
        r = response.json()

        # Debugging: print response
        print(f"Response: {json.dumps(r, indent=4)}")
        print()

        got_translation = False
        translation = None
        error_message = None

        # Check if translationText is empty string
        if r['translationText'] != '':
            got_translation = True
            # Since we're sending plain text, the response should be plain text too
            # No need to parse as JSON
            translation = r['translationText']
        else:
            print("!! Translate API returned no text !!")
            error_message = str(r)
            got_translation = False

        return status_code, r, got_translation, translation, error_message
        
    except Exception as e:
        print(f"Error during API request: {e}")
        return 500, {"error": str(e)}, False, None, str(e)


def translate_single_frame(frame_id, frame_content, target_language, url, cert_path, dev_mode=False, max_retries=5):
    """
    Translate a single frame's content with detailed timing metrics.
    
    Args:
        frame_id: ID of the frame being translated
        frame_content: Text content to translate
        target_language: Target language code
        url: API endpoint URL
        cert_path: Path to SSL certificate
        dev_mode: Development mode flag
        max_retries: Maximum number of retry attempts
        
    Returns:
        Tuple of (success, translated_text, error_message, frame_duration, retry_count)
    """
    start_time = time.time()
    print(f"Translating frame {frame_id}...")
    
    # Prepare data for single frame translation - send only the content as string
    data = {
        'inputText': frame_content, 
        'provider': 'OpenAiChatGpt',
        'destination_lang': target_language
    }
    
    # Send request and handle retries
    status_code, response_json, got_translation, translation, error_message = send_translation_request(
        url, data, cert_path, dev_mode=dev_mode
    )
    
    # Automatic retry mechanism
    retry_count = 0
    
    while not got_translation and retry_count < max_retries:
        retry_count += 1
        wait_time = retry_count * 2  # Exponential backoff
        
        print(f"Translation failed for frame {frame_id}. Retrying ({retry_count}/{max_retries}) in {wait_time} seconds...")
        time.sleep(wait_time)  # Wait before retrying
        
        status_code, response_json, got_translation, translation, error_message = send_translation_request(
            url, data, cert_path, dev_mode=dev_mode
        )
    
    frame_duration = time.time() - start_time
    
    if got_translation and translation:
        # Since we sent plain text and got plain text back, use it directly
        print(f"✓ Frame {frame_id} translated in {frame_duration:.2f}s (retries: {retry_count})")
        return True, translation, None, frame_duration, retry_count
    else:
        print(f"✗ Frame {frame_id} failed after {frame_duration:.2f}s (retries: {retry_count})")
        return False, None, error_message, frame_duration, retry_count


def translate_all_frames(contents, target_language, url, cert_path, dev_mode=False):
    """
    Translate all frames individually with comprehensive metrics collection.
    
    Args:
        contents: Dictionary of frame contents
        target_language: Target language code
        url: API endpoint URL
        cert_path: Path to SSL certificate
        dev_mode: Development mode flag
        
    Returns:
        Tuple of (success, translations_dict, failed_frames, metrics_dict)
    """
    translations = {}
    failed_frames = []
    frame_timings = []
    total_retries = 0
    
    for frame_id, frame_content in contents.items():
        success, translated_text, error_message, frame_duration, retry_count = translate_single_frame(
            frame_id, frame_content, target_language, url, cert_path, dev_mode
        )
        
        frame_timings.append(frame_duration)
        total_retries += retry_count
        
        if success:
            translations[frame_id] = translated_text
        else:
            failed_frames.append(frame_id)
    
    # Calculate metrics
    metrics = {
        'total_retries': total_retries,
        'frame_timings': frame_timings,
        'avg_time_per_frame': sum(frame_timings) / len(frame_timings) if frame_timings else 0,
        'min_time_per_frame': min(frame_timings) if frame_timings else 0,
        'max_time_per_frame': max(frame_timings) if frame_timings else 0
    }
    
    overall_success = len(failed_frames) == 0
    return overall_success, translations, failed_frames, metrics

def main():
    """
    Take config file and input file from system arguments.
    Read input file, send contents to translation API frame by frame, and write to output file.
    Enhanced with comprehensive metrics collection.
    """
    dev_mode = True  # Set to True for development mode
    start_time = time.time()

    # Argument handling
    if len(sys.argv) < 4:
        print("Usage: translate.py <config_file> <input_file> <cert_file>")
        sys.exit(1)
        
    config_file = sys.argv[1]
    input_file = sys.argv[2]
    cert_path = sys.argv[3]  # New: certificate path as third argument

    # Normalize paths for cross-platform compatibility
    config_file = os.path.normpath(config_file)
    input_file = os.path.normpath(input_file)
    cert_path = os.path.normpath(cert_path)

    # Verify certificate file exists
    if not os.path.exists(cert_path):
        print(f"Error: Certificate file not found: {cert_path}")
        sys.exit(1)

    # Load configuration and input file
    config = load_config(config_file)
    input_data, target_language, contents = load_input_file(input_file)

    # Calculate metrics for the input
    total_characters = sum(len(str(content)) for content in contents.values())
    total_frames = len(contents)

    print(f"Reading file: {input_file}")
    print(f"Using certificate: {cert_path}")
    print(f"Found {total_frames} frames to translate")
    print(f"Total characters: {total_characters}")
    print()

    prod_url = config.get('prodUrl')
    dev_url = config.get('devUrl')

    if dev_mode:
        api_url = dev_url
        print("** Development mode enabled **")
    else:
        api_url = prod_url

    # Translate all frames individually
    print("Starting individual frame translations...")
    translation_start = time.time()
    
    overall_success, translations, failed_frames, metrics = translate_all_frames(
        contents, target_language, api_url, cert_path, dev_mode
    )
    
    translation_end = time.time()
    total_duration = translation_end - start_time
    translation_duration = translation_end - translation_start
    
    # Calculate final metrics
    successful_frames = len(translations)
    
    print(f"\n=== Translation Summary ===")
    print(f"Total duration: {total_duration:.2f}s")
    print(f"Translation time: {translation_duration:.2f}s")
    print(f"Successful frames: {successful_frames}/{total_frames}")
    print(f"Average time per frame: {metrics['avg_time_per_frame']:.2f}s")
    print(f"Total retries: {metrics['total_retries']}")
    if successful_frames > 0:
        print(f"Characters per second: {total_characters / translation_duration:.1f}")
        print(f"Frames per second: {successful_frames / translation_duration:.2f}")
    
    # Log translation event with comprehensive metrics
    log_translation_event(
        config=config,
        input_file=input_file,
        target_language=target_language,
        status_code=200 if overall_success else 500,
        got_translation=overall_success,
        error_message=f"Failed frames: {failed_frames}" if failed_frames else None,
        duration_seconds=total_duration,
        total_frames=total_frames,
        successful_frames=successful_frames,
        failed_frames=failed_frames,
        total_characters=total_characters,
        total_retries=metrics['total_retries'],
        avg_time_per_frame=metrics['avg_time_per_frame']
    )
    
    # Write to file if we have any successful translations
    if translations:
        merged = merge_translations(input_data, translations)
        # Get base filename without path
        base_name = os.path.basename(input_file)
        # Write to file - same directory as input
        output_path = os.path.join(os.path.dirname(input_file), f'T-{base_name}')
        write_json(output_path, merged)
        
        if overall_success:
            print(f"** All translations successful **")
            print(f"Translated {len(translations)} frames successfully")
        else:
            print(f"** Partial translation completed **")
            print(f"Translated {len(translations)} frames successfully")
            print(f"Failed to translate {len(failed_frames)} frames: {failed_frames}")

        # Write completion flag (triggers import script)
        completion_flag_path = os.path.join(os.path.dirname(input_file), "translation_complete.flag")
        with open(completion_flag_path, 'w') as flag_file:
            flag_file.write(base_name)
    else:
        print(f"Translation failed completely. No frames were translated successfully.")
        print(f"Failed frames: {failed_frames}")

if __name__ == "__main__":
   main()