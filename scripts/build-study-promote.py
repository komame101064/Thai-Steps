"""Write the reviewed study-order promotions (scripts/level-review/promote.json) into dist/words-app.js.

Each entry {id, th, target: 日常|実用, reason} moves a general word to at least the 2000 (日常) or 3000 (実用) stage of the
study order. Only the order changes; frequency labels and records are untouched.
"""
import json,pathlib,re
P=pathlib.Path(__file__).resolve().parents[1]
words={w['id']:w for n in ('word-bank.json','word-bank-more.json') for w in json.loads((P/'dist'/n).read_text())}
B={'日常':1000,'実用':2000};out={}  # 1000 = inside 日常, 2000 = inside 実用 (see placePromoted in words-app.js);out={}
for e in json.loads((P/'scripts/level-review/promote.json').read_text()):
    w=words.get(e['id']);assert w and w['th']==e['th'] and w.get('collection')!='slang',e;out[e['id']]=B[e['target']]
p=P/'dist/words-app.js';s=p.read_text()
s,n=re.subn(r'/\*STUDY_PROMOTE\*/.*?/\*END\*/','/*STUDY_PROMOTE*/'+json.dumps(out,separators=(',',':'))+'/*END*/',s,flags=re.S);assert n==1
p.write_text(s);print('promotions',len(out))
