"""Build dist/grammar-deep.js from scripts/grammar-deep/NNN.json (使い分けを深める: near forms, contrast examples, pitfalls).

Each Thai word shown (case sentences and Thai inside the Japanese text) must split into words registered in the
word bank or scripts/expansion/ro-lexicon.tsv, so the app can show readings for it. The readings of those words
are added to the grammar reading lexicon (GRAMMAR_DEEP_READINGS). A case reading that differs from the
word-by-word reading is reported as a warning (tone changes in speech or a house convention can explain it).

  python3 scripts/build-grammar-deep.py          build (errors stop the build)
  python3 scripts/build-grammar-deep.py --check  check only, print warnings too
"""
import json,pathlib,re,sys,unicodedata
P=pathlib.Path(__file__).resolve().parents[1];D=P/'scripts/grammar-deep'
lex={}
for line in (P/'scripts/expansion/ro-lexicon.tsv').read_text().splitlines():
    p=line.split('\t')
    if len(p)>=2 and p[0] and p[1]:lex.setdefault(p[0],p[1])
words=[]
for n in ('word-bank.json','word-bank-more.json','slang-bank.json','slang-bank-more.json'):
    words+=json.loads((P/'dist'/n).read_text())
for w in sorted(words,key=lambda w:-w['frequency']):
    if ' ' not in w['th'] and 'ๆ' not in w['th'] and not re.search(r'[/()]',w['ro']):lex.setdefault(w['th'],w['ro'])
MAXL=max(map(len,lex))
def seg(s):
    best={len(s):()}
    for i in range(len(s)-1,-1,-1):
        cand=None
        for L in range(min(MAXL,len(s)-i),0,-1):
            t=s[i:i+L]
            if t in lex and best.get(i+L) is not None and (cand is None or len(best[i+L])+1<len(cand)):cand=(t,)+best[i+L]
        best[i]=cand
    return best[0]
def reading(th):
    th=re.sub(r'\s+ๆ','ๆ',th)  # ช้า ๆ is ช้าๆ
    out=[]
    for chunk in re.split(r'[^฀-๿]+',th):
        if not chunk:continue
        parts=chunk.split('ๆ')
        for k,p in enumerate(parts):
            if not p:continue
            s=seg(p)
            if s is None:return None,p
            out+=[lex[t] for t in s]
            if k<len(parts)-1:out.append(lex[s[-1]])
    return ' '.join(out),None
norm=lambda r:unicodedata.normalize('NFC',re.sub(r'[,.?!、。]','',r)).split()
check='--check' in sys.argv;errors=[];warns=[];deep={};need={}
for f in sorted(D.glob('[0-9][0-9][0-9].json')):
    d=json.loads(f.read_text());i=d.get('id')
    if i!=int(f.stem):errors.append(f'{f.name}: id');continue
    for k,n in (('compare',2),('cases',3),('pitfalls',2)):
        if not isinstance(d.get(k),list) or len(d[k])<n:errors.append(f'{f.name}: {k} needs >= {n}')
    if not d.get('lead'):errors.append(f'{f.name}: lead')
    for c in d.get('compare',[]):
        if not all(c.get(x) for x in ('form','ro','use','style')):errors.append(f'{f.name}: compare fields {c}')
    for c in d.get('cases',[]):
        if not all(c.get(x) for x in ('th','ro','ja','note')):errors.append(f'{f.name}: case fields {c}');continue
        r,bad=reading(c['th'])
        if r is None:errors.append(f'{f.name}: case word not registered: {bad!r} in {c["th"]}');continue
        if norm(r)!=norm(c['ro']):warns.append(f'{f.name}: {c["th"]}\n    given: {c["ro"]}\n    words: {r}')
    texts=[d.get('lead','')]+[c.get('use','') for c in d.get('compare',[])]+[x for c in d.get('cases',[]) for x in (c.get('ja',''),c.get('note',''))]+d.get('pitfalls',[])+[c.get('th','') for c in d.get('cases',[])]+[c.get('form','') for c in d.get('compare',[])]
    for t in texts:
        for m in re.findall(r'[฀-๿]+',t):
            for p in m.split('ๆ'):
                if not p:continue
                s=seg(p)
                if s is None:errors.append(f'{f.name}: Thai without a registered reading: {p!r} (in: {t[:40]}…)');continue
                for tok in s:need[tok]=lex[tok]
            # the whole run too: the app's reader matches greedily, so a run it would split wrongly still reads right
            r,_=reading(m)
            if r and len(m)>1:need[m]=r
    deep[i]={k:d[k] for k in ('lead','compare','cases','pitfalls')}
for w in warns:print('warn',w)
for e in errors:print('ERROR',e)
print(f'{len(deep)} lessons, {len(errors)} errors, {len(warns)} reading warnings')
if errors:sys.exit(1)
if not check:
    (P/'dist/grammar-deep.js').write_text('// 使い分けを深める: near forms, contrast examples and pitfalls per grammar lesson (built by scripts/build-grammar-deep.py from scripts/grammar-deep/*.json; AI-written, not native-verified).\n'
        'const GRAMMAR_DEEP='+json.dumps(deep,ensure_ascii=False,separators=(',',':'))+';\n'
        'const GRAMMAR_DEEP_READINGS='+json.dumps(dict(sorted(need.items())),ensure_ascii=False,separators=(',',':'))+';\n'
        "if(typeof readingLexicon!=='undefined'){for(const [t,r] of Object.entries(GRAMMAR_DEEP_READINGS))if(!(t in readingLexicon))readingLexicon[t]=r;readingKeys.splice(0,readingKeys.length,...Object.keys(readingLexicon).sort((a,b)=>b.length-a.length))}\n")
