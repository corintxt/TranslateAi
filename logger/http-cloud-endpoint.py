# Cloud Function to receive logs and store them in Cloud Storage
import json
import os
import datetime
import uuid
from flask import Flask, request, jsonify
from google.cloud import storage

# Configuration - Set these as environment variables in Cloud Functions
BUCKET_NAME = os.environ.get("STORAGE_BUCKET", "your-log-bucket")
API_KEY = os.environ.get("API_KEY")  # Set this to secure your endpoint

def store_log_in_storage(log_data, run_dev=False):
    """
    Store the log data in a Cloud Storage bucket following GCS best practices.
    Uses JSONL format with proper partitioning for analytics.
    """
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    
    # Ensure the bucket exists
    if not bucket.exists():
        bucket.create()
    
    # Parse timestamp for partitioning
    timestamp_str = log_data.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat())
    try:
        # Handle both with and without timezone info
        if timestamp_str.endswith('Z'):
            timestamp_str = timestamp_str[:-1] + '+00:00'
        now = datetime.datetime.fromisoformat(timestamp_str)
        if now.tzinfo is None:
            now = now.replace(tzinfo=datetime.timezone.utc)
    except ValueError:
        # Fallback to current time if timestamp parsing fails
        now = datetime.datetime.now(datetime.timezone.utc)
    
    # Create hierarchical path following GCS best practices
    # Format: logs/year=YYYY/month=MM/day=DD/hour=HH/translation_logs_YYYYMMDD_HH_UUID.jsonl
    year = now.year
    month = f"{now.month:02d}"
    day = f"{now.day:02d}"
    hour = f"{now.hour:02d}"
    
    # Generate unique filename to prevent conflicts
    unique_id = str(uuid.uuid4())[:8]
    timestamp_prefix = now.strftime("%Y%m%d_%H%M%S")
    
    # Use JSONL extension for better analytics integration
    blob_name = f"logs/year={year}/month={month}/day={day}/hour={hour}/translation_logs_{timestamp_prefix}_{unique_id}.jsonl"
    
    # Check if file already exists (basic deduplication)
    blob = bucket.blob(blob_name)
    
    # Convert to JSONL format (single line JSON)
    jsonl_content = json.dumps(log_data, separators=(',', ':')) + '\n'
    
    # For existing files, append; for new files, create
    try:
        # Try to get existing content
        existing_content = blob.download_as_text()
        # Check for duplicate (simple content-based deduplication)
        if jsonl_content.strip() not in existing_content:
            content = existing_content + jsonl_content
        else:
            content = existing_content  # Skip duplicate
            if run_dev:
                print("Duplicate log entry detected, skipping")
    except Exception:
        # File doesn't exist, create new
        content = jsonl_content
    
    # Upload with optimized settings
    blob.upload_from_string(
        content,
        content_type="application/x-ndjson",  # Proper MIME type for JSONL
        timeout=30
    )
    
    # Set metadata for better organization
    blob.metadata = {
        "log_type": "translation_event",
        "client_id": log_data.get("client_id", "unknown"),
        "target_language": log_data.get("target_language", "unknown"),
        "created_by": "translate-ai-logger"
    }
    blob.patch()
    
    if run_dev:
        print(f"Log stored: {blob_name}")
        print(f"Content: {jsonl_content.strip()}")
    
    return f"gs://{BUCKET_NAME}/{blob_name}"

def log_handler(request, run_dev=False):
    """
    Cloud Function entry point to handle log requests.
    
    Args:
        request: Flask request object
    Returns:
        Flask response with status
    """
    # Check method
    if request.method != 'POST':
        return jsonify({"error": "Only POST method is allowed"}), 405
    
    # Check authentication if API key is set
    if API_KEY:
        auth_header = request.headers.get("X-API-Key")
        if auth_header != API_KEY:
            return jsonify({"error": "Unauthorized"}), 401
    
    # Get the JSON data from the request
    try:
        log_data = request.get_json()
        if not log_data:
            return jsonify({"error": "Missing log data"}), 400
    except Exception as e:
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400
    
    try:
        # Store the log in Cloud Storage
        storage_path = store_log_in_storage(log_data, run_dev)
        
        # Return success response
        return jsonify({
            "status": "success",
            "message": "Log stored successfully",
            "storage_path": storage_path,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })
    
    except Exception as e:
        # Return error response
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# For local testing with Flask
app = Flask(__name__)

@app.route("/", methods=["POST"])
def index():
    return log_handler(request, run_dev=True)

if __name__ == "__main__":
    # This is used when running locally
    app.run(host="127.0.0.1", port=8080, debug=True)
