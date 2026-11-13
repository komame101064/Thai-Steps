"""Apply reviewed text fixes (scripts/native-review/fixes.json) to the published data in dist/.

Each fix names a file, a record and a field, the exact current text and the replacement. A fix is applied only
when the field still holds `from`; when it already holds `to` it is skipped, anything else is an error. That keeps
the step idempotent and safe to run after every rebuild (build-expansion.py calls it for the files it rewrites).
Ids, sense numbers and example keys are never changed. Fixes are AI review findings, not native-speaker checks.
"""
import json,pathlib,sys
P=pathlib.Path(__file__).resolve().parents[1]
FIX=P/'scripts/native-review/fixes.json'
def apply(only=None):
    if not FIX.exists():return {}
    fixes=json.loads(FIX.read_text());by={}
    for f in fixes:
        if only and f['file'] not in only:continue
        by.setdefault(f['file'],[]).append(f)
    stat={}
    for name,rows in by.items():
        path=P/'dist'/name;data=json.loads(path.read_text());applied=skipped=0
        idx={w['id']:w for w in data} if isinstance(data,list) else None
        for f in rows:
            if idx is not None:
                w=idx.get(f['id']);assert w,f
                if f['field'] in ('ro','speechText','th'):obj,key=w,f['field']
                elif f['field'].startswith('sense.'):obj=next(m for m in w['meanings'] if m['sourceSense']==f['sense']);key=f['field'][6:]
                else:raise AssertionError(f)
            else:
                obj=data.get(f['key']);assert obj,f;key=f['field'].split('.',1)[1] if '.' in f['field'] else f['field']
            cur=obj.get(key)
            if cur==f['to']:skipped+=1;continue
            assert cur==f['from'],('fix does not match current text',f,cur)
            obj[key]=f['to'];applied+=1
        path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');stat[name]=(applied,skipped)
        # dist/slang-examples.json is a copy of scripts/slang-example-review.json (tests compare them): keep the source in step.
        if name=='slang-examples.json':
            src=P/'scripts/slang-example-review.json';sd=json.loads(src.read_text())
            for f in rows:
                e=sd[f['key']];k=f['field'].split('.',1)[1]
                if e[k]==f['from']:e[k]=f['to']
            src.write_text(json.dumps(sd,ensure_ascii=False,indent=2)+'\n')
    return stat
if __name__=='__main__':print(apply(set(sys.argv[1:]) or None))
