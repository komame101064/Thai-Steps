"""Print the next N input lines of a chunk that have no result yet:  python3 scripts/chip-sense/next.py c01 40"""
import json,sys,pathlib
W=pathlib.Path(__file__).parent;c=sys.argv[1];n=int(sys.argv[2]) if len(sys.argv)>2 else 40
done=set()
R=W/'results'/f'{c}.jsonl'
if R.exists():done={json.loads(l)['k'] for l in R.read_text().splitlines() if l.strip()}
left=[l for l in (W/'input'/f'{c}.jsonl').read_text().splitlines() if l.strip() and json.loads(l)['k'] not in done]
print('done' if not left else '\n'.join(left[:n]))
if left:print(f'# {len(left)} left',file=sys.stderr)
