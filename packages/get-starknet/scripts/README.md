# Local get-starknet Proxy Setup

This directory contains scripts to proxy requests from the production get-starknet CDN to your local development server, allowing you to test local changes on external dapps.

## Prerequisites

1. **Python 3.7+** - Required for mitmproxy
2. **mitmproxy** - Install via pip:
   ```bash
   pip install mitmproxy
   ```
   Or via homebrew (macOS):
   ```bash
   brew install mitmproxy
   ```

## Quick Start

1. **Start the local get-starknet dev server:**
   ```bash
   cd packages/get-starknet
   yarn start
   ```
   This will start the dev server on `http://localhost:8082`

2. **Start the mitmproxy:**
   ```bash
   cd packages/get-starknet
   mitmproxy -s scripts/proxy-local.py
   ```
   
   Or use the npm script:
   ```bash
   yarn proxy:local
   ```

   The proxy will run on port `8888` (default).

3. **Configure your system/browser to use the proxy:**
   
   **Option A: macOS System Proxy (Recommended - applies to all apps):**
   ```bash
   cd packages/get-starknet
   ./scripts/setup-proxy.sh
   ```
   This automatically configures macOS system proxy settings. To disable later:
   ```bash
   ./scripts/disable-proxy.sh
   ```
   
   **Option B: Browser-only proxy:**
   - **Chrome/Edge**: Use a proxy extension like [Proxy SwitchOmega](https://chrome.google.com/webstore/detail/proxy-switchomega/padekgcemlokbadohgkifijomclgjgif) or [FoxyProxy](https://chrome.google.com/webstore/detail/foxyproxy-standard/gcknhkkoolaabfmlnjonogaaifnjlfnp)
   - **Firefox**: Settings → Network Settings → Manual proxy configuration
     - HTTP Proxy: `localhost`, Port: `8888`
     - Check "Use this proxy server for all protocols"
   - **Safari**: System Preferences → Network → Advanced → Proxies
     - Check "Web Proxy (HTTP)" and "Secure Web Proxy (HTTPS)"
     - Server: `localhost`, Port: `8888`

4. **Install mitmproxy CA certificate** (one-time setup):
   - When you first visit a site through the proxy, mitmproxy will generate a CA certificate
   - Open `http://mitm.it` in your browser while the proxy is running
   - Download and install the certificate for your platform:
     - **macOS**: Download the certificate, double-click to install, then add it to Keychain and trust it
     - **Windows**: Download and install the certificate, then trust it in Certificate Manager
     - **Linux**: Follow the instructions on the mitm.it page

5. **Visit an external dapp** - Requests to `https://snaps.consensys.io/starknet/get-starknet/v1/*` will be automatically redirected to your local server at `http://localhost:8082/*`

## How It Works

The proxy script (`proxy-local.py`) intercepts HTTP/HTTPS requests and:

1. **Detects requests** to the production CDN: `https://snaps.consensys.io/starknet/get-starknet/v1/*`
2. **Redirects them** to the local development server: `http://localhost:8082/*`
3. **Preserves the path** - e.g., `/remoteEntry.js`, `/main.*.js`, etc.
4. **Adds CORS headers** to ensure cross-origin requests work properly

**Important**: mitmproxy is an HTTP proxy, which means applications (browsers, curl, etc.) must be configured to use it. It cannot intercept traffic automatically without being configured as a proxy. This is why `curl -x http://localhost:8888` works, but regular `curl` doesn't - you need to configure your system or browser to route traffic through the proxy.

## Alternative mitmproxy Interfaces

- **mitmproxy** (console UI): `mitmproxy -s scripts/proxy-local.py`
- **mitmweb** (web UI): `mitmweb -s scripts/proxy-local.py` - Opens a web interface at `http://127.0.0.1:8081`
- **mitmdump** (console output): `mitmdump -s scripts/proxy-local.py` - Shows all requests in console

## Troubleshooting

### Certificate Issues

If you see SSL/TLS errors:
- Make sure you've installed the mitmproxy CA certificate
- On macOS, you may need to trust the certificate in Keychain Access
- Try visiting `http://mitm.it` again to re-download the certificate

### Proxy Not Working

- Verify the local dev server is running on port 8082
- Check that your browser is configured to use the proxy
- Look at the mitmproxy console for redirect messages like `[PROXY] Redirecting: ...`
- Try using `mitmweb` to see a visual interface of all requests

### CORS Errors

The script automatically adds CORS headers, but if you still see CORS errors:
- Check that the response headers are being set correctly
- Verify the local dev server also has CORS enabled (it should via webpack.config.local.js)
- Try clearing your browser cache

### Port Conflicts

If port 8888 is already in use:
- Change the port in the mitmproxy command: `mitmproxy -p 8889 -s scripts/proxy-local.py`
- Update your browser proxy settings to use the new port

## Example Output

When working correctly, you should see output like:
```
[PROXY] Redirecting: https://snaps.consensys.io/starknet/get-starknet/v1/remoteEntry.js -> http://localhost:8082/remoteEntry.js
[PROXY] Redirecting: https://snaps.consensys.io/starknet/get-starknet/v1/main.abc123.js -> http://localhost:8082/main.abc123.js
```

## Stopping the Proxy

Press `Ctrl+C` in the terminal where mitmproxy is running, or close the terminal window.

Don't forget to disable the proxy in your browser settings when you're done testing!

