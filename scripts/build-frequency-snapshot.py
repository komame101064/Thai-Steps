"""Write scripts/source-snapshots/corpus-counts.json.gz: corpus counts for the headwords the build needs.

Usage: python3 scripts/build-frequency-snapshot.py <pythainlp/corpus directory>
(the directory inside the PyThaiNLP 5.4.0 wheel holding phupha_word_freqs.txt and tnc_freq.txt).
Only exact headword entries are kept (plus the form without ฯ), so the build never needs PyThaiNLP.
"""
import json,gzip,sys,pathlib
P=pathlib.Path(__file__).resolve().parents[1];C=pathlib.Path(sys.argv[1])
def load(name):
    d={}
    for line in (C/name).read_text(encoding='utf-8').splitlines():
        a=line.split('\t')
        if len(a)>=2 and a[1].strip().isdigit():d[a[0]]=d.get(a[0],0)+int(a[1])
    return d
need=set()
for n in ('word-bank.json','slang-bank.json'):need|={w['th'] for w in json.loads((P/'dist'/n).read_text())}
for f in (P/'scripts/expansion').glob('*/*.json'):
    try:data=json.loads(f.read_text())
    except Exception:continue
    if not isinstance(data,list):continue
    for it in data:
        if isinstance(it,dict):
            for x in (it,it.get('fixed') or {}):
                if isinstance(x,dict) and isinstance(x.get('th'),str):need.add(x['th'])
keys=need|{t.replace('ฯ','').strip() for t in need}
out={'sources':{
  'phupha':{'file':'phupha_word_freqs.txt','title':'Phupha: Thai Word Frequency Dataset (Common Crawl)','citation':'Phatthiyaphaibun, W. (2026). Zenodo. https://doi.org/10.5281/zenodo.18490474','license':'CC0 1.0','via':'PyThaiNLP 5.4.0'},
  'tnc':{'file':'tnc_freq.txt','title':'Thai National Corpus word frequency','license':'CC0 (PyThaiNLP corpus)','via':'PyThaiNLP 5.4.0'}},
  'counts':{}}
for k,name in (('phupha','phupha_word_freqs.txt'),('tnc','tnc_freq.txt')):
    d=load(name);out['counts'][k]={t:d[t] for t in sorted(keys) if t in d}
with gzip.open(P/'scripts/source-snapshots/corpus-counts.json.gz','wt',encoding='utf-8') as f:json.dump(out,f,ensure_ascii=False,separators=(',',':'))
print({k:len(v) for k,v in out['counts'].items()},'of',len(keys))
