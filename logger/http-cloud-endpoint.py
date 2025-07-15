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
    """Store the log data in a Cloud Storage bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    
    # Ensure the bucket exists
    if not bucket.exists():
        bucket.create()
    
    # Extract client ID from the log data
    client_id = log_data.get("client_id", "unknown")
    
    # Create a timestamp-based filename
    now = datetime.datetime.fromisoformat(log_data.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat()))
    date_path = now.strftime("%Y/%m/%d")
    file_id = client_id
    
    # Create the blob path
    blob_name = f"{date_path}/{file_id}.json"
    blob = bucket.blob(blob_name)
    
    # Upload the log data
    blob.upload_from_string(
        json.dumps(log_data, indent=2),
        content_type="application/json"
    )
    if run_dev:
        print(log_data) # dev mode only
    
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
