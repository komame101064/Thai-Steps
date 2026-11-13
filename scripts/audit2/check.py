import json,pathlib,sys,re
W=pathlib.Path(__file__).resolve().parent;chunk=sys.argv[1]
inp={json.loads(l)['id']:json.loads(l) for l in open(W/f'input/{chunk}.jsonl')}
FIELDS={'ro','sense.ja','sense.note','ex.th','ex.ro','ex.ja'};errs=[];seen=set();n=0
for i,l in enumerate(open(W/f'results/{chunk}.jsonl'),1):
    l=l.strip()
    if not l:continue
    try:r=json.loads(l)
    except Exception as e:errs.append(f'line {i}: bad JSON {e}');continue
    n+=1;x=inp.get(r.get('id'))
    if not x:errs.append(f'line {i}: id not in chunk');continue
    if r['id'] in seen:errs.append(f'line {i}: duplicate {r["id"]}')
    seen.add(r['id'])
    for f in r.get('fix') or []:
        if f.get('field') not in FIELDS:errs.append(f'{r["id"]}: bad field {f.get("field")}');continue
        if not isinstance(f.get('to'),str) or not f.get('reason'):errs.append(f'{r["id"]}: fix needs string "to" and "reason"');continue
        if f['field']!='ro':
            s=next((s for s in x['senses'] if s['n']==f.get('sense')),None)
            if not s:errs.append(f'{r["id"]}: sense {f.get("sense")} not found');continue
            if f['field'].startswith('ex.') and 'ex' not in s:errs.append(f'{r["id"]}: sense {f["sense"]} has no example')
            if f['field']=='ex.th' and x['th'].replace(' ','') not in f['to'].replace(' ',''):errs.append(f'{r["id"]}: new example must contain the headword')
            if f['field'] in('ex.ro',) and re.search('[฀-๿]',f['to']):errs.append(f'{r["id"]}: Thai script in ro')
        if f['field']!='sense.note' and not f['to'].strip():errs.append(f'{r["id"]}: empty "to" only allowed for sense.note')
missing=len(inp)-len(seen)
print(f'{n} results, {missing} entries still to do, {len(errs)} errors');print('\n'.join(errs[:40]))
