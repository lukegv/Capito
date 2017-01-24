import dbm;
import furl;
import http.server;
import json;
import mimetypes;
import requests;
import shutil;
import socketserver;

import capito.changelogs;
import capito.parse;

def run(port):
    if not mimetypes.inited:
        mimetypes.init();
    server = ThreadedHTTPServer(('127.0.0.1', port), RequestHandler);
    server.serve_forever();
    
class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    pass;
    
class RequestHandler(http.server.BaseHTTPRequestHandler):
    
    # Handle GET requests
    def do_GET(self):
        # Parse url parameters
        self.params = furl.furl(self.path).args;
        if self.path == '/':
            self.serve_resource('capito.html');
        elif self.path.startswith('/res/'):
            self.serve_resource();
        elif self.path.startswith('/list'):
            self.list_logs();
        elif self.path.startswith('/log'):
            self.load_log();
        elif self.path.startswith('/parse'):
            self.parse_remote();
        else:
            self.error(404, 'Invalid path');
    
    # Handle POST requests
    def do_POST(self):
        # Parse url parameters
        self.params = furl.furl(self.path).args;
        if self.path.startswith('/log'):
            self.save_log();
        elif self.path.startswith('/delete'):
            self.delete_log();
        else:
            self.error(404, 'Invalid path');
    
    def list_logs(self):
        with dbm.open('store', 'c') as store:
            keys = list(map(lambda v: v.decode(), store.keys()));
            result = json.dumps(keys);
            self.respond(200, 'application/json');
            self.wfile.write(bytes(result, 'UTF-8'));
    
    def load_log(self):
        name = self.params.get('name', None);
        if name == None:
            self.error(400, 'Changelog name required');
            return;
        with dbm.open('store', 'c') as store:
            content = store.get(name, None);
            if content == None:
                self.error(404, 'Changelog not found');
                return;
            self.respond(200, 'application/json');
            self.wfile.write(content);
    
    def save_log(self):
        length = int(self.headers['Content-Length']);
        content = self.rfile.read(length).decode();
        name = capito.changelogs.extract_name(content);
        if name == None:
            self.error(400, 'Changelog name required');
            return;
        with dbm.open('store', 'c') as store:
            store[name] = content;
        self.respond(204, '');
    
    def delete_log(self):
        name = self.params.get('name', None);
        if name == None:
            self.error(400, 'Changelog name required');
            return;
        with dbm.open('store', 'c') as store:
            del store[name];
        self.respond(204, None);
    
    def parse_remote(self):
        url = self.params['url'] or '';
        result = None;
        try:
            result = requests.get(url);
        except requests.exceptions.RequestException:
            self.error(404, 'Remote source unavailable: Connection failed');
            return;
        if result.ok:
            mime = result.headers.get('Content-type', None);
            changelog = capito.parse.process(url, mime, result.text);
            if changelog != None:
                pass;
            else:
                self.error(404, 'No changelog found');
        else:
            self.error(result.status_code, 'Remote source unavailable: ' + result.reason);
    
    def serve_resource(self, path = None):
        self.path = path or self.path[1:];
        stream = None;
        try:
            stream = open(self.path, 'rb');
            (mime, encoding) = mimetypes.guess_type(self.path, False); # @UnusedVariable
            self.respond(200, mime);
            shutil.copyfileobj(stream, self.wfile);
        except:
            self.error(404, 'Resource not found');
        finally:
            if stream:
                stream.close();
    
    def error(self, code, message):
        self.respond(code, 'text/plain');
        self.wfile.write(bytes('ERROR: ' + message, 'UTF-8'));

    def respond(self, code, mime):
        self.send_response(code);
        self.send_header('Content-type', mime);
        self.end_headers();

if (__name__ == '__main__'):
    run(8080);