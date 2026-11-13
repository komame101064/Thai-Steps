import json,pathlib,sys
W=pathlib.Path(__file__).resolve().parent;chunk=sys.argv[1];n=int(sys.argv[2]) if len(sys.argv)>2 else 40
inp=[json.loads(l) for l in open(W/f'input/{chunk}.jsonl')];res=W/f'results/{chunk}.jsonl';done=set()
if res.exists():
    for l in open(res):
        l=l.strip()
        if l:
            try:done.add(json.loads(l)['id'])
            except Exception:pass
todo=[x for x in inp if x['id'] not in done]
if not todo:print('done');sys.exit()
print(f'# {len(done)}/{len(inp)} done; next {min(n,len(todo))}')
for x in todo[:n]:print(json.dumps(x,ensure_ascii=False))
