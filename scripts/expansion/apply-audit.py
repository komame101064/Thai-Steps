"""Apply a final-audit file to an editorial batch: each audit item {id, verdict: reject|fix, issues, fixed?}
overrides that id's verdict in the batch's review-NN.json (the review file that holds the id).
Usage: python3 scripts/expansion/apply-audit.py editorial-012 audit.json [--skip id,id]"""
import json,sys,pathlib
P=pathlib.Path(__file__).resolve().parents[2]
batch,src=sys.argv[1],sys.argv[2];skip=set(sys.argv[sys.argv.index('--skip')+1].split(',')) if '--skip' in sys.argv else set()
d=P/'scripts/expansion'/batch;audit=[a for a in json.loads(pathlib.Path(src).read_text()) if a['id'] not in skip]
files={f:json.loads(f.read_text()) for f in sorted(d.glob('review-[0-9][0-9].json'))}
n=0
for a in audit:
    for f,rs in files.items():
        r=next((x for x in rs if x['id']==a['id']),None)
        if not r:continue
        r['verdict']=a['verdict'];r['issues']=list(r.get('issues',[]))+['最終監査: '+i for i in a.get('issues',[])]
        if a['verdict']=='fix':r['fixed']=a['fixed']
        else:r.pop('fixed',None)
        n+=1;break
    else:print('not found',a['id'])
for f,rs in files.items():f.write_text(json.dumps(rs,ensure_ascii=False,indent=1))
print('applied',n,'of',len(audit))
