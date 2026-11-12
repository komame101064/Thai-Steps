"""Collect the reviewers' text fixes, frequency proposals and issues into scripts/word-review/proposals.json for vetting."""
import json,pathlib,csv
W=pathlib.Path(__file__).resolve().parent
idx={r['id']:r for r in csv.DictReader(open(W/'index.tsv'),delimiter='\t')}
R={}
for f in sorted(W.glob('results/*.jsonl'),key=lambda p:(p.stem!='pilot',p.stem)):
    for l in open(f):
        l=l.strip()
        if not l:continue
        try:r=json.loads(l)
        except ValueError:print("skip bad line in",f.name);continue
        r["_chunk"]=f.stem;R[r["id"]]=r
out={'fixes':[],'freq':[],'issues':[]}
for i,r in R.items():
    w=idx[i]
    for fx in r.get('fix') or []:out['fixes'].append({'id':i,'th':w['th'],**fx})
    if r.get('freq'):out['freq'].append({'id':i,'th':w['th'],'from':int(w['freq']),**r['freq']})
    if r.get('issue'):out['issues'].append({'id':i,'th':w['th'],'issue':r['issue']})
(W/'proposals.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n')
print(len(R),'reviewed;',{k:len(v) for k,v in out.items()})
