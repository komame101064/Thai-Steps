"""Build dist/lesson-emphasis.js from scripts/emphasis/*.json: the spans shown in red (the rule not to miss) and with a
yellow marker (secondary points) in grammar lessons (grammar-*.json, keyed by lesson id) and script lessons (script.json,
keyed by s01…). Spans are exact substrings of the lesson texts (AI-chosen). A span that no longer occurs in its lesson
(because the text was edited) is dropped with a warning, as is one that overlaps an earlier span.

  python3 scripts/build-emphasis.py
"""
import json,pathlib,subprocess,sys
P=pathlib.Path(__file__).resolve().parents[1];D=P/'scripts/emphasis'
js=r"""
const fs=require('fs'),vm=require('vm');const ctx={console,window:{},document:{}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','grammar-deep','script-data'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext('this.g={lessons,GRAMMAR_DEEP,SCRIPT_DATA}',ctx);const {lessons,GRAMMAR_DEEP,SCRIPT_DATA}=ctx.g;
const g={};for(const l of lessons){const d=GRAMMAR_DEEP[l.id]||{};g[l.id]=[l.intro,...l.points,...(l.extra||[]),d.lead,...(d.compare||[]).map(c=>c.use),...(d.pitfalls||[])].filter(Boolean)}
const s={};for(const l of SCRIPT_DATA.lessons)s[l.id]=[l.intro,...(l.points||[])].filter(Boolean);
console.log(JSON.stringify({g,s}));
"""
texts=json.loads(subprocess.run(['node','-e',js],cwd=P,capture_output=True,text=True,check=True).stdout)
out={'g':{},'s':{}};dropped=0;kept=0
def take(kind,lid,spec):
    global dropped,kept
    ts=texts[kind].get(str(lid))
    if not ts:print('warn: unknown lesson',kind,lid);return
    used=[];res={'red':[],'mark':[]}
    for cls in ('red','mark'):
        for sp in spec.get(cls,[]):
            sp=str(sp)
            if len(sp)<2 or '<' in sp or not any(sp in t for t in ts):dropped+=1;print(f'warn: {kind}{lid} span not found: {sp[:30]}');continue
            if any(sp in u or u in sp for u in used):dropped+=1;continue
            used.append(sp);res[cls].append(sp);kept+=1
    total=sum(len(t) for t in ts)
    if sum(map(len,used))>total*0.3:print(f'warn: {kind}{lid} emphasises {sum(map(len,used))}/{total} characters')
    if res['red'] or res['mark']:out[kind][str(lid)]=res
for f in sorted(D.glob('grammar-*.json')):
    for lid,spec in json.loads(f.read_text()).items():take('g',lid,spec)
f=D/'script.json'
if f.exists():
    for lid,spec in json.loads(f.read_text()).items():take('s',lid,spec)
(P/'dist/lesson-emphasis.js').write_text('// Important parts of lesson texts: red = the rule not to miss, mark = a secondary point. Built by scripts/build-emphasis.py (AI-chosen spans).\nconst LESSON_EMPHASIS='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print(f"grammar {len(out['g'])} lessons, script {len(out['s'])} lessons, {kept} spans kept, {dropped} dropped")
