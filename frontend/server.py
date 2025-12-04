#!/usr/bin/env python3
"""
Simple HTTP server for Single Page Application.
Serves index.html for all routes except static assets.
"""

import http.server
import socketserver
import os
import mimetypes
from urllib.parse import urlparse

PORT = 8080

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers if needed
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def guess_type(self, path):
        """Override to ensure correct MIME types"""
        mimetype, encoding = mimetypes.guess_type(path)
        if mimetype is None:
            # Default MIME types for common files
            if path.endswith('.js') or path.endswith('.mjs'):
                mimetype = 'application/javascript'
            elif path.endswith('.json'):
                mimetype = 'application/json'
            elif path.endswith('.css'):
                mimetype = 'text/css'
            elif path.endswith('.html'):
                mimetype = 'text/html'
        # Ensure JavaScript files always get the correct MIME type
        elif path.endswith('.js') or path.endswith('.mjs'):
            mimetype = 'application/javascript'
        return mimetype, encoding
    
    def send_head(self):
        """Override to ensure correct Content-Type for JavaScript modules"""
        path = self.translate_path(self.path)
        f = None
        if os.path.isdir(path):
            parts = urlparse(self.path)
            if not parts.path.endswith('/'):
                # redirect browser - doing basically what apache does
                self.send_response(301)
                self.send_header("Location", parts.path + "/")
                self.end_headers()
                return None
            for index in "index.html", "index.htm":
                index = os.path.join(path, index)
                if os.path.exists(index):
                    path = index
                    break
            else:
                return self.list_directory(path)
        # Get mimetype and encoding - extract just the mimetype string
        mimetype, encoding = self.guess_type(path)
        ctype = mimetype if mimetype else 'application/octet-stream'
        if encoding:
            ctype += f'; charset={encoding}'
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None
        try:
            fs = os.fstat(f.fileno())
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(fs[6]))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f
        except:
            f.close()
            raise
    
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Normalize path - remove any route prefix to get actual file path
        # If path contains /assets/ or /manifest.json, extract the actual file path
        if '/assets/' in path:
            # Extract everything after /assets/
            # e.g., /student/assets/js/app.js -> /assets/js/app.js
            parts = path.split('/assets/')
            if len(parts) > 1:
                path = '/assets/' + parts[-1]
        elif '/manifest.json' in path or path.endswith('manifest.json'):
            path = '/manifest.json'
        
        # Check if it's a static file (assets, manifest, or actual file)
        if path.startswith('/assets/') or path == '/manifest.json':
            # Update the path and serve the file
            self.path = path
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        # Check if the requested path is an actual file
        filepath = self.translate_path(path)
        if os.path.exists(filepath) and os.path.isfile(filepath):
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        # For all other routes, serve index.html (SPA routing)
        self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
        print(f"Serving Student Complaint Hub frontend on port {PORT}")
        print(f"Access the application at: http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()
