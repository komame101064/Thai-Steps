"""Apply individually recorded editorial decisions only when every record/sense is covered.
Retain original word IDs, sense IDs, frequency and user learning-record keys.
"""
import json,pathlib,collections,hashlib
P=pathlib.Path(__file__).resolve().parents[1]
def read(n):return json.loads((P/n).read_text())
def write(n,o):
 (P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2 if n.startswith('scripts/') else None,separators=None if n.startswith('scripts/') else (',',':'))+'\n')
core=read('dist/word-bank.json');slang=read('dist/slang-bank.json');words=core+slang;by={w['id']:w for w in words};examples={**read('dist/sense-examples.json'),**read('dist/slang-examples.json')};parts=[read(f'scripts/full-review/part-{i}.json') for i in range(1,7)]
reviews={};counts=collections.Counter();unresolved=[];changes=[]
for part in parts:
 start,end=part['range'];expected=words[start:end]
 assert len(part['reviewed'])==len(expected),(part['part'],'incomplete review')
 assert {r['id'] for r in part['reviewed']}=={w['id'] for w in expected},(part['part'],'record coverage')
 for r in part['reviewed']:
  assert r['id'] not in reviews;w=by[r['id']];assert r['th']==w['th'];reviews[r['id']]=r
  assert {m['sourceSense'] for m in w['meanings']}=={m['sourceSense'] for m in r['senses']},(w['id'],'sense coverage')
assert len(reviews)==len(words)
for w in words:
 r=reviews[w['id']]
 for k,v in r.get('wordPatch',{}).items():
  assert k in {'ro','pos','speechStyle','speechText'},(w['id'],k)
  if w.get(k)!=v:changes.append({'id':w['id'],'field':k,'before':w.get(k),'after':v});w[k]=v;counts['wordFieldsChanged']+=1
 for s in r['senses']:
  n=s['sourceSense'];m=next(m for m in w['meanings'] if m['sourceSense']==n);e=examples[w['id']+'#'+str(n)]
  assert s['status'] in {'reviewed','needs-source'},(w['id'],n,s['status'])
  for kind,target,allowed in [('meaningPatch',m,{'ja','en','ro','pos','note','speechStyle'}),('examplePatch',e,{'th','ro','ja','en','speechStyle','context','speechText'})]:
   patch=s.get(kind,{})
   changed=False
   for k,v in patch.items():
    assert k in allowed,(w['id'],n,kind,k)
    if target.get(k)!=v:changes.append({'id':w['id'],'sourceSense':n,'field':kind+'.'+k,'before':target.get(k),'after':v});target[k]=v;changed=True
   if changed:counts['meaningChanges' if kind=='meaningPatch' else 'exampleChanges']+=1
  for target in [m,e]:target['checked']=s['status']=='reviewed';target['reviewStatus']=s['status'];target['reviewed']='2026-11-10';target['reviewMethod']='AIによる個別校閲'
  counts['sensesInspected']+=1
  if s['status']=='needs-source':unresolved.append({'id':w['id'],'th':w['th'],'sourceSense':n,'issue':s.get('issue','追加の出典確認が必要')})
  if s.get('sources'):m['reviewSources']=s['sources']
 w['pos']=w['meanings'][0]['pos']
 # Default reading belongs to the first sense; alternate readings stay on the corresponding sense.
 if w['meanings'][0].get('ro'):w['ro']=w['meanings'][0]['ro']
write('dist/word-bank.json',core);write('dist/slang-bank.json',slang)
basekeys=read('dist/sense-examples.json');slangkeys=read('dist/slang-examples.json')
write('dist/sense-examples.json',{k:examples[k] for k in basekeys});write('dist/slang-examples.json',{k:examples[k] for k in slangkeys})
# Preserve reviewed corrections in the existing reproducible source stores.
edits=read('scripts/review-overrides.json');manual=read('scripts/example-ja-reviewed.json')
for w in core:
 for m in w['meanings']:
  if m['checked']:
   edits.setdefault(w['id'],{'th':w['th'],'senses':{}})['senses'][str(m['sourceSense'])]={k:m[k] for k in ['ja','en','pos','note','ro'] if k in m}
  e=examples[w['id']+'#'+str(m['sourceSense'])]
  if e['checked']:manual[e['th']]=e['ja']
write('scripts/review-overrides.json',edits);write('scripts/example-ja-reviewed.json',manual)
write('scripts/slang-word-review.json',{w['id']:w for w in slang});write('scripts/slang-example-review.json',{k:examples[k] for k in slangkeys})
report={'date':'2026-11-10','method':'AIによる全登録語義・用例の個別校閲','nativeReview':False,'records':len(words),'uniqueHeadwords':len({w['th'] for w in words}),'senses':counts['sensesInspected'],'examples':len(examples),'changes':dict(counts),'pendingSourceChecks':len(unresolved),'unresolved':unresolved,'fullEditorialPassComplete':True,'allItemsVerified':not unresolved,'note':'全項目を個別に読み直しました。人間のタイ語母語話者による校閲・音声の実聴確認ではありません。判断がつかない語義は要確認として出題から除外します。','grammar':read('scripts/full-review/grammar.json')}
write('dist/full-review.json',report);write('scripts/full-review/applied-changes.json',changes)
print(json.dumps({k:v for k,v in report.items() if k not in ['grammar','unresolved']},ensure_ascii=False))
