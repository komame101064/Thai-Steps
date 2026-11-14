"""Write the reviewed study-order promotions (and demotions, scripts/level-review/demote.json: {id, th, target: 基本|日常, reason},
which move an early word to no earlier than the start of that range) (scripts/level-review/promote.json) into dist/words-app.js.

Each entry {id, th, target: 日常|実用, reason} moves a general word to at least the 2000 (日常) or 3000 (実用) stage of the
study order. Only the order changes; frequency labels and records are untouched.
"""
import json,pathlib,re
P=pathlib.Path(__file__).resolve().parents[1]
words={w['id']:w for n in ('word-bank.json','word-bank-more.json') for w in json.loads((P/'dist'/n).read_text())}
B={'日常':1000,'実用':2000};out={}  # 1000 = inside 日常, 2000 = inside 実用 (see placePromoted in words-app.js);out={}
for e in json.loads((P/'scripts/level-review/promote.json').read_text()):
    w=words.get(e['id']);assert w and w['th']==e['th'] and w.get('collection')!='slang',e;out[e['id']]=B[e['target']]
# Textbook core (scripts/level-review/core.json): basic words beginners' textbooks teach first (family, food, animals,
# body, places, transport, colours, days...) that corpus counts place late. 必須 = within the first 300, 基本 = within 1,000.
for e in json.loads((P/'scripts/level-review/core.json').read_text()):
    w=words.get(e['id']);assert w and w['th']==e['th'] and w.get('collection')!='slang',e;out[e['id']]={'必須':1,'基本':2}[e['target']]
p=P/'dist/words-app.js';s=p.read_text()
s,n=re.subn(r'/\*STUDY_PROMOTE\*/.*?/\*END\*/','/*STUDY_PROMOTE*/'+json.dumps(out,separators=(',',':'))+'/*END*/',s,flags=re.S);assert n==1
D={'基本':300,'日常':1000};dem={}
dp=P/'scripts/level-review/demote.json'
for e in (json.loads(dp.read_text()) if dp.exists() else []):
    w=words.get(e['id']);assert w and w['th']==e['th'] and w.get('collection')!='slang',e;dem[e['id']]=D[e['target']]
s,n=re.subn(r'/\*STUDY_DEMOTE\*/.*?/\*END\*/','/*STUDY_DEMOTE*/'+json.dumps(dem,separators=(',',':'))+'/*END*/',s,flags=re.S);assert n==1
p.write_text(s);print('promotions',len(out),'demotions',len(dem))
