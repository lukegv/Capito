import json;

class Changelog:
    
    def __init__(self, name):
        self.name = name;
        self.versions = [];
    
    def add_version(self, version):
        self.versions.append(version);
    
    def add_new_version(self, name, date):
        self.versions.append(Version(name, date));
        
    def to_json(self):
        changelog_dic = { 'name': self.name, 'versions': [], 'uclf': True };
        for version_obj in self.versions:
            version_dic = {
                'name': version_obj.name,
                'date': version_obj.date,
                'changes': []
            };
            for change_obj in version_obj.changes:
                version_dic['changes'].append({ 
                    'description': change_obj.description,
                    'category': change_obj.category,
                    'tags': change_obj.tags
                });
            changelog_dic['versions'].append(version_dic);
        return json.dumps(changelog_dic);
        
class Version:
    
    def __init__(self, name, date):
        self.name = name;
        self.date = date;
        self.changes = [];
    
    def add_change(self, change):
        self.changes.append(change);
    
    def add_new_change(self, description, category = None, tags = []):
        self.changes.append(Change(description, category, tags));
        
class Change:
    
    def __init__(self, description, category, tags):
        self.description = description;
        self.category = category;
        self.tags = tags;


def from_json(content):
    try:
        changelog_dic = json.loads(content);
        if not changelog_dic['uclf']: return None;
        changelog_obj = Changelog(changelog_dic['name']);
        for version_dic in changelog_dic['versions']:
            version_obj = Version(version_dic['name'], version_dic['date']);
            for change_dic in version_dic['changes']:
                change_obj = Change(change_dic['description'], change_dic['category'], change_dic['tags']);
                version_obj.add_change(change_obj);
            changelog_obj.add_version(version_obj);
        return changelog_obj;
    except:
        return None;

def extract_name(content):
    dictionary = json.loads(content);
    return dictionary.get('name', None);