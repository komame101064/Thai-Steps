"""Run existing Node regression tests from any current working directory."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
names=['words','examples','slang','topics','levels-search','origins','refinement']
failed=[]
for name in names:
 try:r=subprocess.run(['node',str(root/'tests'/f'{name}.test.cjs')],cwd=root)
 except FileNotFoundError:
  print('Node.jsをインストールしてください。',file=sys.stderr);sys.exit(2)
 if r.returncode:failed.append(name)
print('PASS' if not failed else 'FAILED: '+', '.join(failed))
sys.exit(bool(failed))
