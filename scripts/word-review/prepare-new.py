"""Prepare review batches for words added after the full review (editorial batches given on the command line).
Original: Prepare review batches for the full-word review (formality 1-10, 文語 senses, relations, error check).

Writes scripts/word-review/index.tsv (lookup of every entry: id, th, ro, collection, frequency, first meanings)
and scripts/word-review/input/chunk-XX.jsonl (entries grouped by theme and part of speech so that
related words sit together). Run once; reviewers write scripts/word-review/results/chunk-XX.jsonl.
"""
import json,pathlib,re,sys
P=pathlib.Path(__file__).resolve().parents[2];W=P/'scripts/word-review'
FILES=['word-bank.json','word-bank-more.json','slang-bank.json','slang-bank-more.json']
B=[(f,w) for f in FILES for w in json.loads((P/'dist'/f).read_text())]
src=(P/'dist/word-topics.js').read_text()
idx=json.loads(re.search(r'const WORD_TOPIC_INDEX=(\{.*?\});\n',src,re.S).group(1)) if 'WORD_TOPIC_INDEX=' in src else {}
labels={t['id']:t['label'] for t in json.loads(re.search(r'const WORD_TOPICS=(\[.*?\]);\n',src,re.S).group(1))}
topic=idx
by={w['id']:w for _,w in B}
def gl(w,n=3):return ' / '.join(m['ja'] for m in w['meanings'][:n])
with open(W/'index.tsv','w') as o:
    o.write('id\tth\tro\tdeck\tfreq\tpos\tmeanings(ja)\n')
    for f,w in B:o.write('\t'.join([w['id'],w['th'],w['ro'],'slang' if w.get('collection')=='slang' else 'general',str(w['frequency']),w['pos'],gl(w,4).replace('\t',' ')])+'\n')
def compact(f,w):
    rel={k:[f"{x}:{by[x]['th']}" for x in v if x in by] for k,v in (w.get('relations') or {}).items() if v}
    return {'id':w['id'],'file':f,'th':w['th'],'ro':w['ro'],'pos':w['pos'],'freq':w['frequency'],'deck':'slang' if w.get('collection')=='slang' else 'general',
      'style':w.get('speechStyle'),'topics':[labels.get(t,t) for t in topic.get(w['id'],[])] or [w.get('category')],
      'senses':[{'n':m['sourceSense'],'ja':m['ja'],'en':m.get('en',''),'pos':m.get('pos'),'style':m.get('speechStyle'),'tags':m.get('registerTags',[]),**({'note':m['note']} if m.get('note') else {})} for m in w['meanings']],
      **({'ex':w['example']['th']} if w.get('example') else {}),'rel':rel}
batches=set(sys.argv[1].split(','));n=int(sys.argv[2]) if len(sys.argv)>2 else 6
items=[compact(f,w) for f,w in B if w.get('expansion') in batches]
items.sort(key=lambda x:(x['topics'][0] or '',x['pos'],-x['freq'],x['id']))
size=-(-len(items)//n);tag=sys.argv[3] if len(sys.argv)>3 else 'new'
for i in range(n):
    with open(W/f'input/{tag}-{i+1:02d}.jsonl','w') as o:
        for x in items[i*size:(i+1)*size]:o.write(json.dumps(x,ensure_ascii=False)+'\n')
print(len(items),'entries in',n,'chunks of',size)
