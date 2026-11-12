"""Turn the vetted review fixes into scripts/native-review/fixes.json entries (idempotent).

Adds (1) the reviewers' ro / sense.ja fixes from proposals.json, except those listed in REJECT, and
(2) the spelling-based romanization of เจ้า (câo) and ใต้ (tâi) in every entry, settled earlier for ใต้.
"""
import json,pathlib,re
P=pathlib.Path(__file__).resolve().parents[2];W=P/'scripts/word-review';FIX=P/'scripts/native-review/fixes.json'
FILES=['word-bank.json','word-bank-more.json','slang-bank.json','slang-bank-more.json']
REJECT=set()
fixes=json.loads(FIX.read_text());have={(f['file'],f.get('id'),f['field'],f.get('sense')) for f in fixes}
where={w['id']:(n,w) for n in FILES for w in json.loads((P/'dist'/n).read_text())}
def add(n,i,field,sense,frm,to,reason):
    k=(n,i,field,sense)
    if k in have or frm==to:return 0
    f={'file':n,'id':i,'field':field,'from':frm,'to':to,'reason':reason}
    if sense is not None:f['sense']=sense
    fixes.append(f);have.add(k);return 1
added=0
for x in json.loads((W/'proposals.json').read_text())['fixes']:
    if x['id'] in REJECT:continue
    n,w=where[x['id']]
    if x['field']=='ro':added+=add(n,x['id'],'ro',None,x['from'],x['to'],x['reason']+'（AI精査 2026-11）')
    elif x['field']=='sense.ja':added+=add(n,x['id'],'sense.ja',x['sense'],x['from'],x['to'],x['reason']+'（AI精査 2026-11）')
RULES=[('เจ้า',r'câao','câo','เจ้า は綴りどおり短母音 câo に統一（AI精査 2026-11）'),('ใต้',r'tâai','tâi','ใต้ は綴りどおり短母音 tâi に統一（AI精査 2026-11）')]
for i,(n,w) in where.items():
    for th,a,b,why in RULES:
        if th not in w['th']:continue
        k=(n,i,'ro',None)
        cur=next((f['to'] for f in fixes if (f['file'],f.get('id'),f['field'],f.get('sense'))==k),w['ro'])
        if a in cur:
            if k in have:
                f=next(f for f in fixes if (f['file'],f.get('id'),f['field'],f.get('sense'))==k);f['to']=f['to'].replace(a,b)
            else:added+=add(n,i,'ro',None,w['ro'],w['ro'].replace(a,b),why)
        for m in w['meanings']:
            if m.get('ro') and a in m['ro']:added+=add(n,i,'sense.ro',m['sourceSense'],m['ro'],m['ro'].replace(a,b),why)
FIX.write_text(json.dumps(fixes,ensure_ascii=False,indent=0)+'\n')
print('added',added,'total',len(fixes))
