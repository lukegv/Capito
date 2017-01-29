import dateutil.parser;
import mistune;
import re;
import requests;

from capito import changelogs;
from capito.changelogs import Changelog, Version;

regex_version = "^(?:[^*#\s-]).*(\d+(?:\.\d+)+).*";
regex_version_name = "(\d+(?:\.\d+)+)";
regex_date = "([0-9].*[0-9])";
regex_change = "(?:[*#-])\s.*";

regex_github = ".*github.com\/([\w-]*\/[\w-]*)\/?.*";
regex_github_raw = ".*raw.githubusercontent.com.*";
regex_github_blob = ".*github.com\/([\w-]*\/[\w-]*)\/blob\/.*";

# Reads a date from an unknown format string
def read_date(string):
    res = re.search(regex_date, string);
    if not res: return '';
    try:
        date = dateutil.parser.parse(res.group(), fuzzy=True);
        return date.date().isoformat();
    except:
        return '';

# Parses plain text changelogs
class TextParser():
    
    def check(self, url, mime):
        confidence = 10 if url.endswith('.txt') else 0;
        confidence += 50 if mime.startswith('text/plain') else 0;
        return confidence;
    
    def parse(self, content, url, mime, name=''):
        if not mime.startswith('text/plain'): return None;
        changelog = Changelog(name);
        version = None;
        lines = content.splitlines();
        for line in lines:
            if re.match(regex_version, line):
                if version: changelog.add_version(version);
                res1 = re.search(regex_version_name, line);
                name = res1.group() if res1 else '';
                res2 = re.sub(regex_version_name, '', line);
                version = Version(name, read_date(res2));
            if version and re.match(regex_change, line):
                version.add_new_change(line[2:]);
        return changelog;

# Parses markdown changelogs
class MarkdownParser():
    
    def __init__(self):
        self.markdown = mistune.BlockLexer();
    
    def check(self, url, mime):
        confidence = 10 if url.endswith('.md') else 0;
        confidence += 60 if mime.startswith('text/markdown') else 0;
        return confidence;
        
    def parse(self, content, url, mime, name=''):
        tokens = self.markdown(content);
        return None;

# Searches GitHub repositories for changelogs
class GitHubConnector():
    
    def check(self, url, mime):
        return 90 if re.search(regex_github, url) else 0;
    
    def parse(self, content, url, mime):
        # Get the repository name
        name = None;
        res = re.search(regex_github, url);
        if res: name = res.group(1).split('/')[1];
        # Check for raw url
        if not re.search(regex_github_raw, url):
            # Check for blob url
            if re.search(regex_github_blob, url):
                url = url.replace('blob', 'raw');
                (mime, content) = self.request(url);
            else:
                # Check common changelog files
                res = re.search(regex_github, url);
                if not res: return None;
                url = 'https://raw.githubusercontent.com/' + res.group(1) + '/master/CHANGELOG.md';
                (mime, content) = self.request(url);
                if not content:
                    url = 'https://raw.githubusercontent.com/' + res.group(1) + '/master/CHANGELOG.txt';
                    (mime, content) = self.request(url);
        if not content: return None;
        return self.parse_content(content, url, mime, name);
    
    def request(self, url):
        result = requests.get(url);
        if not result.ok: return (None, None);
        mime = result.headers.get('Content-type', None);
        content = result.text;
        return (mime, content);
    
    def parse_content(self, content, url, mime, name):
        if mime.startswith('text/markdown'):
            return MarkdownParser().parse(content, url, mime, name);
        elif mime.startswith('text/plain'):
            return TextParser().parse(content, url, mime, name);
        elif mime.startswith('application/json'):
            return UclfReader().parse(content, url, mime);
        return None;
        
# Reads a changelog in the universal changelog format (based on JSON)
class UclfReader():
    
    def check(self, url, mime):
        return 80 if mime.startswith('application/json') else 0;
    
    def parse(self, content, url, mime):
        return changelogs.from_json(content);

# List all parsers
parsers = [TextParser(), MarkdownParser(), GitHubConnector(), UclfReader()];

# Sorts and applies the listes parsers
def process(url, mime, content):
    sequence = sorted(parsers, key=lambda p: p.check(url, mime), reverse=True);
    result = sequence.pop(0).parse(content, url, mime);
    while result == None and len(sequence) > 0:
        result = sequence.pop(0).parse(content, url, mime);
    return result;