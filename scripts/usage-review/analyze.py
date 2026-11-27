"""Compare app frequencies with real usage counts and list candidates for review (see count.py).

Each source is mapped onto the app's 1-10 scale by quantile matching on the base 5,000 general words
(their measured frequencies), like build-expansion.py does for the web/written corpora.
Writes candidates.json: words whose band (最高9-10/高7-8/中4-6/低1-3) differs from the subtitle evidence.
"""
import json,gzip,math,bisect,pathlib,collections
P=pathlib.Path(__file__).resolve().parents[2]
U=json.load(gzip.open(P/'scripts/source-snapshots/usage-counts.json.gz','rt'))
C=json.load(gzip.open(P/'scripts/source-snapshots/corpus-counts.json.gz','rt'))['counts']
N=U['tokens']
gen=[w for f in ['word-bank','word-bank-more'] for w in json.load(open(P/'dist'/(f+'.json')))]
base=[w for w in gen if w.get('frequencyBasis') is None]
def cnt(src,th):
    if src in U['counts']:return U['counts'][src].get(th,0)
    return C[src].get(th,0) or C[src].get(th.replace('ฯ','').strip(),0)
def scale(src):
    xs=sorted((math.log10(cnt(src,w['th'])),w.get('frequencyMeasured',w['frequency'])) for w in base if cnt(src,w['th']))
    vals=[x for x,_ in xs];levels=sorted(f for _,f in xs)
    def f(th):
        c=cnt(src,th)
        if not c:return 0
        q=bisect.bisect_left(vals,math.log10(c))/len(vals);return levels[min(len(levels)-1,int(q*len(levels)))]
    return f
S={k:scale(k) for k in ('subs','phupha','tnc')}
band=lambda f:'最高' if f>=9 else '高' if f>=7 else '中' if f>=4 else '低'
out=[]
for w in gen:
    lv={k:S[k](w['th']) for k in S}
    pm={k:round(cnt(k,w['th'])/N[k]*1e6,2) for k in ('subs','social')}
    f=w['frequency']
    if band(lv['subs'])!=band(f) and abs(lv['subs']-f)>=2:
        out.append({'id':w['id'],'th':w['th'],'ja':w['meanings'][0]['ja'],'pos':w['meanings'][0]['pos'],'freq':f,'basis':w.get('frequencyBasis') or 'base',
                    'subs':lv['subs'],'web':lv['phupha'],'written':lv['tnc'],'subs_pm':pm['subs'],'social_pm':pm['social'],
                    'dir':'up' if lv['subs']>f else 'down','reviewed':bool(w.get('frequencyReview'))})
(P/'scripts/usage-review/candidates.json').write_text(json.dumps(out,ensure_ascii=False,indent=0)+'\n')
c=collections.Counter((x['basis'],x['dir']) for x in out);print(len(out),'candidates',dict(c))
