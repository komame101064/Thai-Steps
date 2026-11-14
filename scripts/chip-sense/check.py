"""Validate a chunk's results:  python3 scripts/chip-sense/check.py c01"""
import json,sys,pathlib
W=pathlib.Path(__file__).parent;c=sys.argv[1]
inp={json.loads(l)['k']:json.loads(l) for l in (W/'input'/f'{c}.jsonl').read_text().splitlines() if l.strip()}
R=W/'results'/f'{c}.jsonl';err=0;seen=set()
for i,l in enumerate(R.read_text().splitlines() if R.exists() else []):
  if not l.strip():continue
  try:r=json.loads(l)
  except Exception as e:print('line',i+1,'bad json');err+=1;continue
  x=inp.get(r.get('k'))
  if not x:print('line',i+1,'unknown k',r.get('k'));err+=1;continue
  if r['k'] in seen:print('dup',r['k']);err+=1
  seen.add(r['k']);p=r.get('p',{})
  for t in x['toks']:
    v=p.get(t['t'])
    if v not in [0]+[s[0] for s in t['s']]:print(r['k'],t['t'],'bad sense',v);err+=1
print(f'{c}: {len(seen)}/{len(inp)} done, {err} errors')
