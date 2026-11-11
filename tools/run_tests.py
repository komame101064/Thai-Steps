"""Run existing Node regression tests from any current working directory."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
# Every tests/*.test.cjs, the same set `npm test` runs, so a new test can never be skipped here.
names=sorted(p.name[:-len('.test.cjs')] for p in (root/'tests').glob('*.test.cjs'))
failed=[]
for name in names:
 try:r=subprocess.run(['node',str(root/'tests'/f'{name}.test.cjs')],cwd=root)
 except FileNotFoundError:
  print('Node.jsをインストールしてください。',file=sys.stderr);sys.exit(2)
 if r.returncode:failed.append(name)
print(f'PASS ({len(names)} test files)' if not failed else 'FAILED: '+', '.join(failed))
sys.exit(bool(failed))
