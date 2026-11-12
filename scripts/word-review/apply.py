"""Apply the full-word review (scripts/word-review/results/*.jsonl) to the published data in dist/.

Sets `formality` (1-10), marks 文語 senses (registerTags 'literary', speechStyle 文語) and adds reviewed relations
(syn / ant / related, with sense details, mirrored on the target). Idempotent: existing links are never duplicated
and nothing is removed. Text fixes and frequency proposals are not applied here; they are vetted separately
(fixes go to scripts/native-review/fixes.json, frequency to FREQ_REVIEW in build-expansion.py).
This is an AI review, not a native-speaker check. build-expansion.py calls apply() for the files it rewrites.
"""
import json,pathlib,sys
P=pathlib.Path(__file__).resolve().parents[2];W=P/'scripts/word-review'
FILES=['word-bank.json','word-bank-more.json','slang-bank.json','slang-bank-more.json']
REL=('syn','ant','related','similar')
# Entries whose relations were deliberately emptied in an earlier review (ห้า: neighbouring numbers are not useful links).
NO_NEW_REL={'tl-00419'}
def results():
    out={}
    files=sorted(W.glob('results/*.jsonl'),key=lambda p:(p.stem!='pilot',p.stem))  # chunk results override the pilot
    for f in files:
        for l in open(f):
            l=l.strip()
            if l:r=json.loads(l);out[r['id']]=r
    return out
def apply(only=None):
    R=results()
    data={n:json.loads((P/'dist'/n).read_text()) for n in FILES}
    by={w['id']:w for n in FILES for w in data[n]}
    slang=lambda w:w.get('collection')=='slang'
    stat={'formality':0,'literary':0,'rel':0}
    dropped={frozenset((i,d.get('id'))) for i,r in R.items() for d in (r.get('drop') or [])}
    def link(a,typ,b,s=None,t=None):
        if frozenset((a['id'],b['id'])) in dropped or a['id'] in NO_NEW_REL or b['id'] in NO_NEW_REL:return 0
        if a is b or (not slang(a) and slang(b)):return 0
        rels=a.setdefault('relations',{})
        if any(b['id'] in (rels.get(k) or []) for k in REL):return 0
        rels.setdefault(typ,[]).append(b['id'])
        sv=[s] if isinstance(s,int) and any(m['sourceSense']==s for m in a['meanings']) else []
        tv=[t] if isinstance(t,int) and any(m['sourceSense']==t for m in b['meanings']) else []
        a.setdefault('relationDetails',{}).setdefault(typ,[]).append({'id':b['id'],'sourceSenses':sv,'targetSenses':tv,'review':'ai-2026-11'})
        return 1
    # Vetted frequency changes (scripts/word-review/freq-approved.json): {id: {to, reason}}.
    FA=W/'freq-approved.json'
    for i,x in (json.loads(FA.read_text()) if FA.exists() else {}).items():
        w=by.get(i)
        if w and w['frequency']!=x['to']:w['frequency']=x['to'];w['frequencyReview']=x['reason'];stat['freq']=stat.get('freq',0)+1
    for i,r in R.items():
        w=by.get(i)
        if not w:continue
        f=r.get('formality')
        if isinstance(f,int) and 1<=f<=10 and w.get('formality')!=f:w['formality']=f;stat['formality']+=1
        lit=set(r.get('literary') or [])
        for m in w['meanings']:
            if m['sourceSense'] in lit:
                tags=m.setdefault('registerTags',[])
                if 'literary' not in tags:tags.append('literary');stat['literary']+=1
                if not m.get('speechStyle') or m['speechStyle'].startswith('標準') or m['speechStyle']=='改まった表現':m['speechStyle']='文語'
        if lit and all('literary' in (m.get('registerTags') or []) for m in w['meanings']) and (not w.get('speechStyle') or w['speechStyle'].startswith('標準') or w['speechStyle']=='改まった表現'):
            w['speechStyle']='文語'
            if 'literary' not in w.setdefault('tags',[]):w['tags'].append('literary')
        for d in r.get('drop') or []:
            b=by.get(d.get('id'))
            for x,y in ((w,d.get('id')),(b,i)):
                if not x:continue
                t=d.get('type');rels=x.get('relations') or {}
                # 'similar' is shown as 混同しやすい語 (look-alike words): those links are intended and never dropped.
                for k in [k for k in ([t] if t in rels else list(rels)) if k!='similar']:
                    if y in (rels.get(k) or []):
                        rels[k]=[v for v in rels[k] if v!=y];stat['drop']=stat.get('drop',0)+1
                        det=(x.get('relationDetails') or {}).get(k)
                        if det:x['relationDetails'][k]=[v for v in det if v.get('id')!=y]
        for e in r.get('rel') or []:
            b=by.get(e.get('id'))
            if not b or e.get('type') not in ('syn','ant','related'):continue
            stat['rel']+=link(w,e['type'],b,e.get('s'),e.get('t'))
            link(b,e['type'],w,e.get('t'),e.get('s'))
    for n in FILES:
        if only and n not in only:continue
        (P/'dist'/n).write_text(json.dumps(data[n],ensure_ascii=False,separators=(',',':'))+'\n')
    return stat
if __name__=='__main__':print(apply(set(sys.argv[1:]) or None))
