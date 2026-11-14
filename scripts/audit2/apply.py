"""Turn the second full audit's results (scripts/audit2/results/*.jsonl) into scripts/native-review/fixes.json
entries (idempotent), then apply them with scripts/apply-native-review.py. An existing fix for the same field
keeps its `from` and gets the new `to`. AI review findings, not native-speaker checks."""
import json,pathlib,subprocess,sys
P=pathlib.Path(__file__).resolve().parents[2];W=P/'scripts/audit2';FIX=P/'scripts/native-review/fixes.json'
FILES=['word-bank.json','word-bank-more.json','slang-bank.json','slang-bank-more.json'];EXF=['sense-examples.json','more-examples.json','slang-examples.json']
where={w['id']:(n,w) for n in FILES for w in json.loads((P/'dist'/n).read_text())}
ex={k:(n,v) for n in EXF for k,v in json.loads((P/'dist'/n).read_text()).items()}
fixes=json.loads(FIX.read_text());idx={(f['file'],f.get('id') or f.get('key'),f['field'],f.get('sense')):f for f in fixes}
stat={'added':0,'updated':0,'same':0,'skipped':0}
def put(file,ident,field,sense,cur,to,reason,key=False):
    k=(file,ident,field,sense)
    if cur is None or cur==to:stat['same' if cur==to else 'skipped']+=1;return
    if k in idx:idx[k]['to']=to;idx[k]['reason']=reason+'（AI再点検 2026-11）';stat['updated']+=1;return
    f={'file':file,('key' if key else 'id'):ident,'field':field,'from':cur,'to':to,'reason':reason+'（AI再点検 2026-11）'}
    if sense is not None:f['sense']=sense
    fixes.append(f);idx[k]=f;stat['added']+=1
for res in sorted(W.glob('results/*.jsonl')):
    for l in res.read_text().splitlines():
        l=l.strip()
        if not l:continue
        r=json.loads(l)
        for x in r.get('fix') or []:
            n,w=where[r['id']];fd=x['field']
            if fd=='ro':put(n,r['id'],'ro',None,w['ro'],x['to'],x['reason'])
            elif fd in('sense.ja','sense.note'):
                m=next((m for m in w['meanings'] if m['sourceSense']==x['sense']),None)
                if m:put(n,r['id'],fd,x['sense'],m.get(fd[6:]),x['to'],x['reason'])
            else:
                key=f"{r['id']}#{x['sense']}";e=ex.get(key)
                if e:put(e[0],key,'example.'+fd[3:],None,e[1].get(fd[3:]),x['to'],x['reason'],key=True)
FIX.write_text(json.dumps(fixes,ensure_ascii=False,indent=0)+'\n')
print(stat,'total fixes',len(fixes))
if '--apply' in sys.argv:print(subprocess.run([sys.executable,str(P/'scripts/apply-native-review.py')],capture_output=True,text=True).stdout[-600:])
