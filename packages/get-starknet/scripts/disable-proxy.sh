#!/bin/bash
# Helper script to disable macOS system proxy settings

set -e

echo "🔧 Disabling macOS system proxy settings..."
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only."
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

# Disable proxy
echo "Disabling HTTP proxy..."
networksetup -setwebproxystate "$ACTIVE_SERVICE" off

echo "Disabling HTTPS proxy..."
networksetup -setsecurewebproxystate "$ACTIVE_SERVICE" off

echo ""
echo "✅ System proxy disabled successfully!"
echo ""

