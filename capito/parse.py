import dateutil.parser;
import mistune;
import re;
import requests;

from capito import changelogs;
from capito.changelogs import Changelog, Version;

regex_version = "^(?:[^*#\s-]).*(\d+(?:\.\w+)+).*";
regex_version_name = "(\d+(?:\.\w+)+)";
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
        confidence = 40 if url.endswith('.txt') else 0;
        confidence += 30 if mime.startswith('text/plain') else 0;
        return confidence;
    
    def parse(self, content, url, mime, name=''):
        if not mime.startswith('text/plain'): return None;
        changelog = Changelog('');
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
    
    def check(self, url, mime):
        confidence = 50 if url.endswith('.md') else 0;
        confidence += 40 if mime.startswith('text/markdown') else 0;
        return confidence;
        
    def parse(self, content, url, mime):
        tokens = mistune.BlockLexer()(content);
        changelog = Changelog('');
        version = None;
        category = None;
        text = '';
        for token in tokens:
            if token['type'] == 'heading' and token['level'] == 2:
                if version:
                    changelog.add_version(version);
                    category = None;
                res1 = re.search(regex_version_name, token['text']);
                name = res1.group() if res1 else '';
                res2 = re.sub(regex_version_name, '', token['text']);
                version = Version(name, read_date(res2));
            if token['type'] == 'heading' and token['level'] == 3:
                category = token['text'];
            if token['type'] == 'list_item_end':
                version.add_new_change(text, category);
                text = '';
            if token['type'] == 'text':
                text = text + token['text'] + ' ';
        return changelog;
        
# Reads a changelog in the universal changelog format (based on JSON)
class UclfReader():
    
    def check(self, url, mime):
        confidence = 30 if mime.startswith('application/json') else 0;
        confidence += 70 if url.endswith('.uclf') else 0;
        return confidence;
    
    def parse(self, content, url, mime):
        return changelogs.from_json(content);
    
# Searches GitHub repositories for changelogs
class GitHubConnector():
    
    def check(self, url, mime):
        return 100 if re.search(regex_github, url) else 0;
    
    def parse(self, content, url, mime):
        # Determine the repository name
        result = re.search(regex_github, url);
        name = result.group(1).split('/')[1] if result else None;
        # Check for raw url
        if not re.search(regex_github_raw, url):
            # Check for blob url
            if re.search(regex_github_blob, url):
                url = url.replace('blob', 'raw');
                (mime, content) = self.request(url);
            else:
                # Check common changelog files
                project = re.search(regex_github, url);
                if not project: return None;
                urls = ['https://raw.githubusercontent.com/' + project.group(1) + '/master/CHANGELOG.md',
                        'https://raw.githubusercontent.com/' + project.group(1) + '/master/CHANGELOG.txt'];
                url = urls.pop(0);
                (mime, content) = self.request(url);
                while not content and len(urls) > 0:
                    url = urls.pop(0);
                    (mime, content) = self.request(url);
        # Check if any content is available
        if not content: return None;
        return process(url, mime, content, True, name);
    
    def request(self, url):
        result = requests.get(url);
        if not result.ok: return (None, None);
        mime = result.headers.get('Content-type', None);
        content = result.text;
        return (mime, content);

# List all parsers
parsers = [TextParser(), MarkdownParser(), UclfReader()];

# List all connectors
connectors = [GitHubConnector()];

# Sorts and applies the available parsers
def process(url, mime, content, parse_only=False, name=None):
    # Sort parsers by confidence
    sequence = sorted(parsers if parse_only else parsers + connectors,
        key=lambda p: p.check(url, mime), reverse=True);
    # Try each parser
    changelog = sequence.pop(0).parse(content, url, mime);
    while changelog == None and len(sequence) > 0:
        changelog = sequence.pop(0).parse(content, url, mime);
    # Apply possible name to parsed changelog
    if changelog and changelog.name == '' and not name == None:
        changelog.name = name;
    print(len(changelog.versions));
    return changelog;