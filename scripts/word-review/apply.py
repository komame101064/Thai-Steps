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
    def link(a,typ,b,s=None,t=None):
        if a is b or (not slang(a) and slang(b)):return 0
        rels=a.setdefault('relations',{})
        if any(b['id'] in (rels.get(k) or []) for k in REL):return 0
        rels.setdefault(typ,[]).append(b['id'])
        sv=[s] if isinstance(s,int) and any(m['sourceSense']==s for m in a['meanings']) else []
        tv=[t] if isinstance(t,int) and any(m['sourceSense']==t for m in b['meanings']) else []
        a.setdefault('relationDetails',{}).setdefault(typ,[]).append({'id':b['id'],'sourceSenses':sv,'targetSenses':tv,'review':'ai-2026-11'})
        return 1
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
