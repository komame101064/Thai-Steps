"""Second full audit (2026-11): every published entry with its senses, notes and examples, in chunks.
Reviewers write scripts/audit2/results/<chunk>.jsonl (one line per entry; see BRIEF.md)."""
import json,pathlib,sys
P=pathlib.Path(__file__).resolve().parents[2];W=P/'scripts/audit2'
FILES=['word-bank.json','word-bank-more.json','slang-bank.json','slang-bank-more.json']
EX={}
for f in ['sense-examples.json','more-examples.json','slang-examples.json']:
    for k,v in json.loads((P/'dist'/f).read_text()).items():EX[k]=(f,v)
items=[]
for f in FILES:
    for w in json.loads((P/'dist'/f).read_text()):
        ss=[]
        for m in w['meanings']:
            s={'n':m['sourceSense'],'ja':m['ja'],'pos':m.get('pos')}
            if m.get('note'):s['note']=m['note']
            e=EX.get(f"{w['id']}#{m['sourceSense']}")
            if e:s['ex']={'th':e[1]['th'],'ro':e[1]['ro'],'ja':e[1]['ja']}
            ss.append(s)
        items.append({'id':w['id'],'th':w['th'],'ro':w['ro'],'deck':'slang' if w.get('collection')=='slang' else 'general','style':w.get('speechStyle'),'senses':ss})
n=int(sys.argv[1]) if len(sys.argv)>1 else 40
size=-(-len(items)//n)
for i in range(n):
    with open(W/f'input/a{i+1:02d}.jsonl','w') as o:
        for x in items[i*size:(i+1)*size]:o.write(json.dumps(x,ensure_ascii=False)+'\n')
print(len(items),'entries in',n,'chunks of',size)
