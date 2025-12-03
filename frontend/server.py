#!/usr/bin/env python3
"""
Simple HTTP server for Single Page Application.
Serves index.html for all routes except static assets.
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

PORT = 8080

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Check if it's a static file
        if path.startswith('/assets/') or path.startswith('/manifest'):
            # Serve the file normally
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        # Check if the file exists
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
