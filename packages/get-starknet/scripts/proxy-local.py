#!/usr/bin/env python3
"""
mitmproxy script to redirect get-starknet requests from production to local or dev.

This script intercepts get-starknet requests and redirects them based on configuration:
- Set GET_STARKNET_PROXY_TARGET=local to redirect to localhost:8082
- Set GET_STARKNET_PROXY_TARGET=dev to redirect to dev.snaps.consensys.io
- Default: local

Usage:
    # Use local development server
    GET_STARKNET_PROXY_TARGET=local mitmproxy -s scripts/proxy-local.py
    
    # Use dev server
    GET_STARKNET_PROXY_TARGET=dev mitmproxy -s scripts/proxy-local.py
    
    # Or use mitmweb/mitmdump
    GET_STARKNET_PROXY_TARGET=dev mitmweb -s scripts/proxy-local.py
"""

import os
from mitmproxy import http


# Production CDN host
PRODUCTION_HOST = "snaps.consensys.io"
# Development CDN host
DEV_HOST = "dev.snaps.consensys.io"
# Local development server
LOCAL_SERVER = "http://localhost:8082"

# Get proxy target from environment variable (default: dev)
PROXY_TARGET = os.environ.get("GET_STARKNET_PROXY_TARGET", "dev").lower()

def request(flow: http.HTTPFlow) -> None:
    """
    Intercept HTTP requests and redirect get-starknet requests based on configuration.
    """
    # Only handle get-starknet requests
    if PRODUCTION_HOST in flow.request.pretty_host and "/starknet/get-starknet/v1/" in flow.request.path:
        original_url = flow.request.pretty_url
        
        # Extract the path after the prefix
        path_prefix = "/starknet/get-starknet/v1/"
        path_after_prefix = flow.request.path[len(path_prefix):]
        
        # Log original request
        print(f"[PROXY] Intercepted get-starknet: {original_url}")
        print(f"[PROXY] Proxy target: {PROXY_TARGET}")
        
        if PROXY_TARGET == "dev":
            # Redirect to dev environment
            flow.request.host = DEV_HOST
            # Keep the same scheme (https) and path
            flow.request.headers["Host"] = DEV_HOST
            
            new_url = f"{flow.request.scheme}://{DEV_HOST}{flow.request.path}"
            print(f"[PROXY] Redirected to dev: {original_url} → {new_url}")
        
        else:  # default to local
            # Redirect to local server
            flow.request.scheme = "http"
            flow.request.host = "localhost"
            flow.request.port = 8082
            flow.request.path = f"/{path_after_prefix}"
            flow.request.headers["Host"] = "localhost:8082"
            
            new_url = f"{LOCAL_SERVER}{flow.request.path}"
            print(f"[PROXY] Redirected to local: {original_url} → {new_url}")

def response(flow: http.HTTPFlow) -> None:
    """
    Modify response headers to ensure CORS works properly.
    """
    # Add CORS headers if the response is from our local server
    if flow.request.host == "localhost" and flow.request.port == 8082:
        flow.response.headers["Access-Control-Allow-Origin"] = "*"
        flow.response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        flow.response.headers["Access-Control-Allow-Headers"] = "X-Requested-With, content-type, Authorization"
        flow.response.headers["Access-Control-Allow-Credentials"] = "true"
        
        # Log response for debugging
        if flow.response.status_code != 200:
            print(f"[PROXY] ⚠️  Response status: {flow.response.status_code} for {flow.request.path}")
    
    # Log non-200 responses from dev environment for debugging
    elif flow.request.host == DEV_HOST and flow.response.status_code != 200:
        print(f"[PROXY] ⚠️  Dev response status: {flow.response.status_code} for {flow.request.path}")