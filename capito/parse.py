import mistune;

from capito import changelogs;
from capito.changelogs import Changelog, Version, Change;

class TextParser():
    
    def check(self, url, mime):
        confidence = 10 if url.endswith('.txt') else 0;
        confidence += 50 if mime == 'text/plain' else 0;
        return confidence;
    
    def parse(self, content, url):
        return None;

class MarkdownParser():
    
    def __init__(self):
        self.markdown = mistune.BlockLexer();
    
    def check(self, url, mime):
        confidence = 10 if url.endswith('.md') else 0;
        confidence += 70 if mime == 'text/markdown' else 0;
        return confidence;
        
    def parse(self, content, url):
        tokens = self.markdown(content);
        return None;
    
class GitHubConnector():
    
    def check(self, url, mime):
        return 0;
    
    def parse(self, content, url):
        return None;

class UclfReader():
    
    def check(self, url, mime):
        return 90 if mime == 'application/json' else 0;
    
    def parse(self, content, url):
        return changelogs.from_json(content);

# List all parsers
parsers = [TextParser(), MarkdownParser(), GitHubConnector(), UclfReader()];

def process(url, mime, content):
    sequence = sorted(parsers, key=lambda p: p.check(url, mime));
    result = sequence.pop(0).parse(content, url);
    while result == None and len(sequence) > 0:
        result = sequence.pop(0).parse(content, url);
    return result;
        