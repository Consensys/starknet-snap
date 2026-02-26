#!/bin/bash
# Helper script to configure macOS system proxy settings for mitmproxy
# This sets the HTTP and HTTPS proxy to localhost:8888

set -e

PROXY_HOST="127.0.0.1"
PROXY_PORT="8088"

echo "🔧 Configuring macOS system proxy settings..."
echo "   Proxy: $PROXY_HOST:$PROXY_PORT"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only."
    echo "   For other systems, configure proxy manually in your browser/system settings."
    exit 1
fi

# Get the active network service (usually Wi-Fi or Ethernet)
ACTIVE_SERVICE=$(networksetup -listallnetworkservices | grep -E "^(Wi-Fi|Ethernet)" | head -1)

if [ -z "$ACTIVE_SERVICE" ]; then
    echo "❌ Could not find active network service (Wi-Fi or Ethernet)"
    exit 1
fi

echo "📡 Active network service: $ACTIVE_SERVICE"
echo ""

# Set HTTP proxy
echo "Setting HTTP proxy..."
networksetup -setwebproxy "$ACTIVE_SERVICE" "$PROXY_HOST" "$PROXY_PORT"

# Set HTTPS proxy
echo "Setting HTTPS proxy..."
networksetup -setsecurewebproxy "$ACTIVE_SERVICE" "$PROXY_HOST" "$PROXY_PORT"

# Enable proxy
echo "Enabling proxy..."
networksetup -setwebproxystate "$ACTIVE_SERVICE" on
networksetup -setsecurewebproxystate "$ACTIVE_SERVICE" on

echo ""
echo "✅ System proxy configured successfully!"
echo ""
echo "⚠️  IMPORTANT: Install mitmproxy CA certificate:"
echo "   1. Make sure mitmproxy is running"
echo "   2. Visit http://mitm.it in your browser"
echo "   3. Download and install the certificate for macOS"
echo ""
echo "To disable the proxy later, run:"
echo "   ./scripts/disable-proxy.sh"
echo ""

