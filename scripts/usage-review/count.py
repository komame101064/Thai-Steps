"""Count how often each headword is actually used in everyday Thai text (2026-11-27, 利用者「単語の実際の使用実態を調べて見直して」).

Sources (downloaded outside the repo; only the counts for our headwords are kept in usage-counts.json.gz):
  subs:   OPUS OpenSubtitles v2018 monolingual Thai (th.txt.gz, ~9.1M subtitle lines) — film/TV dialogue, the closest to speech.
  social: wisesight-sentiment kaggle train.txt (~24k social-media posts, PyThaiNLP, CC0).
Each line is segmented with PyThaiNLP newmm (default dictionary). A headword is segmented the same way and counted
as that token sequence, so compounds and single words are counted on the same footing.
Usage: python count.py <subs.txt.gz> <social.txt> <out.json.gz>
"""
import sys,gzip,json,pathlib,collections,multiprocessing as mp
from pythainlp.tokenize import word_tokenize
P=pathlib.Path(__file__).resolve().parents[2]
HEADS=set()
for f in ['word-bank','word-bank-more','slang-bank','slang-bank-more']:
    HEADS|={w['th'] for w in json.loads((P/'dist'/(f+'.json')).read_text())}
import re
MAI_YAMOK=re.compile(r'\s*ๆ')
# ๆ is written with or without a space before it (ค่อย ๆ / ค่อยๆ): join it to its word in text and headwords alike.
def tok(s):return tuple(t for t in word_tokenize(MAI_YAMOK.sub('ๆ',s),engine='newmm',keep_whitespace=False) if t.strip())
SEQ=None;MAXN=1
def init():
    global SEQ,MAXN
    SEQ={}
    for h in HEADS:
        t=tok(h)
        if t:SEQ.setdefault(t,[]).append(h)
    MAXN=max(len(t) for t in SEQ)
def count(lines):
    c=collections.Counter();n=0
    for line in lines:
        ts=tok(line);n+=len(ts)
        for i in range(len(ts)):
            for k in range(1,min(MAXN,len(ts)-i)+1):
                hs=SEQ.get(ts[i:i+k])
                if hs:
                    for h in hs:c[h]+=1
    return c,n
def chunks(it,size=20000):
    buf=[]
    for x in it:
        buf.append(x)
        if len(buf)>=size:yield buf;buf=[]
    if buf:yield buf
def run(lines):
    tot=collections.Counter();N=0
    with mp.Pool(4,initializer=init) as pool:
        for i,(c,n) in enumerate(pool.imap_unordered(count,chunks(lines))):
            tot.update(c);N+=n
            if i%50==0:print('chunk',i,N,flush=True)
    return tot,N
if __name__=='__main__':
    subs=(l.strip() for l in gzip.open(sys.argv[1],'rt',encoding='utf-8') if l.strip())
    social=(l.strip() for l in open(sys.argv[2],encoding='utf-8') if l.strip())
    out={'sources':{'subs':{'title':'OPUS OpenSubtitles v2018 monolingual Thai','url':'https://object.pouta.csc.fi/OPUS-OpenSubtitles/v2018/mono/th.txt.gz','note':'film/TV subtitles; counts only'},
                    'social':{'title':'wisesight-sentiment (kaggle train.txt)','url':'https://github.com/PyThaiNLP/wisesight-sentiment','license':'CC0'}},
         'tokenizer':'PyThaiNLP newmm (default dictionary)','tokens':{},'counts':{}}
    for k,src in (('social',social),('subs',subs)):
        c,N=run(src);out['tokens'][k]=N
        out['counts'][k]={h:c[h] for h in sorted(c)}
        print(k,N,'tokens',len(c),'headwords seen',flush=True)
    with gzip.open(sys.argv[3],'wt',encoding='utf-8') as f:json.dump(out,f,ensure_ascii=False,separators=(',',':'))
