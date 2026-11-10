"""Apply scripts/full-review/pending-decisions.json to the senses left as needs-source by apply-full-review.py.

- exclude: remove the sense and its example from dist, archive both in
  scripts/full-review/excluded-senses.json, and drop relation links that only
  existed through that sense. Word IDs and remaining sourceSense numbers are kept.
- revise: patch wording/reading but keep needs-source (not quizzed).
- keep: leave as needs-source.

Idempotent: a sense already archived is skipped. Afterwards run
scripts/build-word-topics.py and scripts/build-kana-search.py.
"""
import json,pathlib
P=pathlib.Path(__file__).resolve().parents[1]
def read(n):return json.loads((P/n).read_text())
def write(n,o,pretty=False):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2 if pretty else None,separators=None if pretty else (',',':'))+'\n')
core=read('dist/word-bank.json');slang=read('dist/slang-bank.json');words=core+slang;by={w['id']:w for w in words}
coreEx=read('dist/sense-examples.json');slangEx=read('dist/slang-examples.json')
dec=read('scripts/full-review/pending-decisions.json')
arch_path=P/'scripts/full-review/excluded-senses.json'
archive=json.loads(arch_path.read_text()) if arch_path.exists() else []
archived={(a['id'],a['sourceSense']) for a in archive}
report=read('dist/full-review.json')

def exstore(key):return coreEx if key in coreEx else slangEx
for d in dec['decisions']:
 w=by[d['id']];n=d['sourceSense'];key=f"{d['id']}#{n}";assert w['th']==d['th'],key
 if d['action']=='exclude':
  if (d['id'],n) in archived:continue
  m=next(m for m in w['meanings'] if m['sourceSense']==n)
  assert m['reviewStatus']=='needs-source',(key,'only unresolved senses may be excluded')
  assert len(w['meanings'])>1,(key,'would leave the word without meanings')
  store=exstore(key);e=store.pop(key)
  w['meanings'].remove(m)
  archive.append({'id':d['id'],'th':d['th'],'sourceSense':n,'reason':d['reason'],'sources':d['sources'],'decided':dec['date'],'meaning':m,'example':e})
  # Outbound relation details: drop the sense; drop the link when it rested only on that sense.
  for t,ds in list((w.get('relationDetails') or {}).items()):
   keep=[]
   for x in ds:
    if n in x['sourceSenses']:
     x['sourceSenses']=[s for s in x['sourceSenses'] if s!=n]
     if not x['sourceSenses'] and not x['targetSenses']:
      w['relations'][t]=[i for i in w['relations'].get(t,[]) if i!=x['id']];continue
    keep.append(x)
   w['relationDetails'][t]=keep
  # Inbound relation details from other words.
  for o in words:
   for t,ds in (o.get('relationDetails') or {}).items():
    for x in ds:
     if x['id']==d['id'] and n in x['targetSenses']:
      x['targetSenses']=[s for s in x['targetSenses'] if s!=n]
  for t in list(w.get('relations',{})):
   if not w['relations'][t]:del w['relations'][t]
  for t in list(w.get('relationDetails',{})):
   if not w['relationDetails'][t]:del w['relationDetails'][t]
  first=w['meanings'][0];w['pos']=first['pos']
  if first.get('use')=='よく使う別の意味':first['use']='よく使う意味'
  if first.get('ro'):w['ro']=first['ro']
  if first.get('speechStyle'):w['speechStyle']=first['speechStyle']
 elif d['action']=='revise':
  m=next(m for m in w['meanings'] if m['sourceSense']==n);e=exstore(key)[key]
  for k,v in d.get('wordPatch',{}).items():w[k]=v
  for k,v in d.get('meaningPatch',{}).items():m[k]=v
  for k,v in d.get('examplePatch',{}).items():e[k]=v
  for t in (m,e):t['checked']=False;t['reviewStatus']='needs-source';t['reviewed']=dec['date'];t['reviewMethod']='AIによる個別校閲（要確認のまま修正）'
  m['reviewSources']=d['sources']
 else:assert d['action']=='keep',d

# Word-level tags are the union of the senses' registerTags everywhere else in the bank.
# (Slang entries keep their own tags; 'keep' decisions change nothing.)
for d in dec['decisions']:
 if d['action']=='keep' or by[d['id']].get('collection')=='slang':continue
 w=by[d['id']];union={t for m in w['meanings'] for t in m.get('registerTags',[])}
 if 'tags' in w:w['tags']=[t for t in w['tags'] if t in union]+sorted(union-set(w['tags']))
# Integrity: every remaining sense has exactly one example, and no example is orphaned.
keys={f"{w['id']}#{m['sourceSense']}" for w in words for m in w['meanings']}
assert keys==set(coreEx)|set(slangEx),'sense/example mismatch'
pending=[{'id':w['id'],'th':w['th'],'sourceSense':m['sourceSense'],'issue':next((d.get('issue') for d in dec['decisions'] if d['id']==w['id'] and d['sourceSense']==m['sourceSense']),'追加の出典確認が必要')} for w in words for m in w['meanings'] if m['reviewStatus']=='needs-source']
report['pendingSourceChecks']=len(pending);report['unresolved']=pending
report['excludedSenses']=[{k:a[k] for k in ('id','th','sourceSense','reason')} for a in archive]
report['activeSenses']=len(keys);report['allItemsVerified']=False
# Origin labels are per sense: drop labels of archived senses (build-word-origins.py also rewrites the banks).
osrc=(P/'dist/word-origins.js').read_text();head,_,body=osrc.partition('const WORD_ORIGINS=')
origins=json.loads(body.rstrip().rstrip(';'))
for a in archive:
 o=origins.get(a['id'])
 if o and str(a['sourceSense']) in o['senses']:
  del o['senses'][str(a['sourceSense'])]
  if not o['senses']:del origins[a['id']]
(P/'dist/word-origins.js').write_text(head+'const WORD_ORIGINS='+json.dumps(origins,ensure_ascii=False,separators=(',',':'))+';\n')
write('dist/word-bank.json',core);write('dist/slang-bank.json',slang)
write('dist/sense-examples.json',coreEx);write('dist/slang-examples.json',slangEx)
write('dist/full-review.json',report);write('scripts/full-review/excluded-senses.json',archive,True)
print(json.dumps({'activeSenses':len(keys),'excluded':len(archive),'pending':len(pending)},ensure_ascii=False))
