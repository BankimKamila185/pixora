import os
import glob
import json
import urllib.parse
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import httpx

PORT = 8080
REDIRECT_URI = f"http://localhost:{PORT}/"
SCOPE = "https://www.googleapis.com/auth/drive.readonly"

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    auth_code = None

    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        if "code" in params:
            OAuthCallbackHandler.auth_code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"""
            <html>
                <head>
                    <title>OAuth Consent Successful</title>
                    <style>
                        body { font-family: -apple-system, sans-serif; text-align: center; background: #09090b; color: #f4f4f5; padding-top: 50px; }
                        .card { background: #18181b; max-width: 400px; margin: auto; padding: 30px; border-radius: 12px; border: 1px solid #27272a; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                        h1 { color: #f59e0b; margin-bottom: 15px; }
                        p { font-size: 14px; color: #a1a1aa; line-height: 1.5; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Authentication Successful!</h1>
                        <p>You have authorized Pixora to access Google Drive. You can close this tab and return to the terminal.</p>
                    </div>
                </body>
            </html>
            """)
        else:
            self.send_response(400)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"Failed to capture authorization code.")

def run_callback_server():
    server = HTTPServer(("localhost", PORT), OAuthCallbackHandler)
    print(f"\n[INFO] Starting temporary callback server on {REDIRECT_URI}...")
    server.handle_request() # Handles exactly one request, then returns
    server.server_close()
    return OAuthCallbackHandler.auth_code

def main():
    print("="*60)
    print("      GOOGLE DRIVE OAUTH CONFIGURATION HELPER FOR PIXORA")
    print("="*60)

    # 1. Search for client_secret_*.json
    downloads_path = os.path.expanduser("~/Downloads")
    client_secrets = glob.glob(os.path.join(downloads_path, "client_secret_*.json"))
    if client_secrets:
        client_secrets.sort(key=os.path.getmtime, reverse=True)
    
    client_id = None
    client_secret = None
    
    if client_secrets:
        secret_file = client_secrets[0]
        print(f"[FOUND] Detected client secret file: {secret_file}")
        try:
            with open(secret_file, "r") as f:
                data = json.load(f)
                cfg = data.get("web") or data.get("installed") or {}
                client_id = cfg.get("client_id")
                client_secret = cfg.get("client_secret")
        except Exception as e:
            print(f"[ERROR] Failed to read secret file: {e}")
            
    if not client_id or not client_secret:
        print("[PROMPT] No client secret file found in Downloads or failed to read.")
        client_id = input("Enter your Google Client ID: ").strip()
        client_secret = input("Enter your Google Client Secret: ").strip()

    if not client_id or not client_secret:
        print("[ABORTED] Client ID and Client Secret are required.")
        sys.exit(1)

    # 2. Build authorization URL
    auth_base = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent"
    }
    auth_url = f"{auth_base}?{urllib.parse.urlencode(params)}"
    
    print("\n" + "="*50)
    print("ACTION REQUIRED:")
    print("1. We will attempt to open your browser to log in to Google.")
    print("2. If it does not open, copy and paste this URL into your browser:")
    print(auth_url)
    print("="*50 + "\n")
    
    webbrowser.open(auth_url)
    
    # 3. Listen for code
    code = run_callback_server()
    if not code:
        print("[ERROR] Authorization code was not captured. Please try again.")
        sys.exit(1)
        
    print(f"[SUCCESS] Captured Authorization Code.")

    # 4. Exchange code for access_token and refresh_token
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    print("[INFO] Exchanging authorization code for tokens...")
    try:
        response = httpx.post(token_url, data=payload, timeout=12.0)
        if response.status_code != 200:
            print(f"[ERROR] Failed to exchange code for token: {response.status_code} - {response.text}")
            sys.exit(1)
            
        token_data = response.json()
        refresh_token = token_data.get("refresh_token")
        access_token = token_data.get("access_token")
        
        if not refresh_token:
            print("[WARNING] Did not receive a refresh_token from Google. This happens if the app was already authorized.")
            print("To resolve, go to Google Account Settings -> Security -> Connections -> Remove Pixora, then run this script again.")
            
        # 5. Write to .env
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        env_lines = []
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                env_lines = f.readlines()
                
        # Update or append keys
        env_dict = {}
        for line in env_lines:
            if "=" in line:
                k, v = line.strip().split("=", 1)
                env_dict[k] = v
                
        env_dict["GOOGLE_CLIENT_ID"] = client_id
        env_dict["GOOGLE_CLIENT_SECRET"] = client_secret
        if refresh_token:
            env_dict["GOOGLE_REFRESH_TOKEN"] = refresh_token
            
        with open(env_path, "w") as f:
            for k, v in env_dict.items():
                f.write(f"{k}={v}\n")
                
        print("\n" + "="*50)
        print("[SUCCESS] GOOGLE DRIVE CONFIGURATION COMPLETE!")
        print(f"Updated backend configuration in: {env_path}")
        print("Backend will now dynamically refresh access tokens automatically!")
        if refresh_token:
            print("Long-lived Refresh Token stored successfully.")
        print("="*50)
        
    except Exception as ex:
        print(f"[ERROR] Connection failed during token exchange: {ex}")
        sys.exit(1)

if __name__ == "__main__":
    main()
