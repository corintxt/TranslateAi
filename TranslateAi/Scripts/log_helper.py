#!/usr/bin/env python3
"""
Simple HTTP-based logger that sends data to Google Cloud via a proxy service.
No Google Cloud libraries required.
Usage: python http_logger.py "Your message here"
"""

import sys
import uuid
import datetime
import platform
import socket
import requests


def log_via_http(message, logging_endpoint, api_key=None, client_id=None):
    """
    Log a message to Google Cloud Storage via an HTTP endpoint.
    
    Args:
        message: The message to log
        logging_endpoint: URL of the logging service
        api_key: API key for authentication
        client_id: Unique identifier for this client
    
    Returns:
        The server response
    """
    # Create a client ID if none provided
    if not client_id:
        client_id = str(uuid.uuid4())
    
    # Create log data with timestamp
    now = datetime.datetime.now(datetime.UTC)
    log_data = {
        "timestamp": now.isoformat(),
        "client_id": client_id,
        "hostname": socket.gethostname(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "job": message

    }
    
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
            json=log_data,
            timeout=10
        )
        
        # Check if the request was successful
        response.raise_for_status()
        return response.json()
    
    except requests.exceptions.RequestException as e:
        print(f"Error sending log: {e}", file=sys.stderr)
        return None