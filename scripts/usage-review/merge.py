"""Check the usage review results and collect proposed frequency changes (GUIDE.md).

- Every input row must come back once, in order, with a frequency 1-10.
- Changes inside one band (5→6) are dropped (the app shows four bands).
- A compound is capped at the lowest frequency of the registered words it splits into (same rule as build-expansion.py).
- Words already in scripts/word-review/freq-approved.json are not touched (they were vetted earlier).
Writes proposals.json [{id, th, from, to, style, reason, note, evidence}].
"""
import json,pathlib,collections,sys
H=pathlib.Path(__file__).resolve().parent;P=H.parents[1]
B={w['id']:w for f in ['word-bank','word-bank-more'] for w in json.loads((P/'dist'/(f+'.json')).read_text())}
by_th={}
for w in B.values():by_th[w['th']]=max(by_th.get(w['th'],0),w['frequency'])
fa=json.loads((P/'scripts/word-review/freq-approved.json').read_text())
import re
_js=(P/'dist/words-app.js').read_text()
_pi=set(json.loads(re.search(r'PHRASE_IDS=new Set\((\[[^\]]*\])\)',_js).group(1)));_px=set(json.loads(re.search(r'PHRASE_EXCLUDE=new Set\((\[[^\]]*\])\)',_js).group(1)))
def is_phrase(i):w=B[i];return (i in _pi or re.match(r'^editorial-0(0[67]|19)$',w.get('expansion') or '')) and i not in _px  # phrase-deck frequencies were set for learners (フレーズの実生活での頻度); left as they are
band=lambda f:3 if f>=9 else 2 if f>=7 else 1 if f>=4 else 0
def parts_cap(th):
    """Lowest frequency among the parts, for the split into registered words with the fewest parts (None if no split)."""
    best={0:[]}
    for i in range(1,len(th)+1):
        for j in range(max(0,i-14),i):
            if j in best and th[j:i] in by_th and th[j:i]!=th:
                cand=best[j]+[th[j:i]]
                if i not in best or len(cand)<len(best[i]):best[i]=cand
    return min(by_th[x] for x in best[len(th)]) if len(th) in best and len(best[len(th)])>1 else None
out=[];stat=collections.Counter()
for inp in sorted((H/'input').glob('*.tsv')):
    rows=[l.split('\t') for l in inp.read_text().splitlines()[1:]]
    res=H/'results'/inp.name
    if not res.exists():sys.exit(f'missing {res.name}')
    got=[l.split('\t') for l in res.read_text().splitlines() if l.strip()]
    if [g[0] for g in got]!=[r[0] for r in rows]:sys.exit(f'{inp.name}: ids differ ({len(got)} vs {len(rows)})')
    for r,g in zip(rows,got):
        g+=['']*(5-len(g));i=r[0];cur=int(r[4]);to=int(g[1]);style=g[2].strip()
        assert 1<=to<=10 and style in('','口語','文語'),(i,g)
        if i in fa:stat['locked']+=1;continue
        if is_phrase(i):stat['phrase deck']+=1;continue
        if to!=cur and band(to)==band(cur):stat['same band']+=1;to=cur
        cap=parts_cap(B[i]['th'])
        if to>cur and cap is not None and to>cap:
            stat['capped']+=1;to=max(cur,cap) if band(max(cur,cap))!=band(cur) else cur
        if to==cur and not style:continue
        out.append({'id':i,'th':r[1],'from':cur,'to':to,'style':style,'reason':g[3].strip(),'note':g[4].strip(),
                    'evidence':dict(zip(['subs','web','written','subs_pm','social_pm'],r[5:10])),'basis':r[10]})
(H/'proposals.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n')
ch=[x for x in out if x['to']!=x['from']]
print(len(ch),'frequency changes:',collections.Counter('up' if x['to']>x['from'] else 'down' for x in ch),'| style marks:',collections.Counter(x['style'] for x in out if x['style']),'|',dict(stat))
