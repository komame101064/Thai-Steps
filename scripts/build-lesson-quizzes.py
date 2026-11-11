"""Build dist/lesson-quizzes.js: nine extra check questions per grammar lesson (10 with the lesson's own).

Input: scripts/grammar-quiz/quiz-*.json  {lessonId: {existingRo:[...], questions:[9 × {kind,q,sentence?,options[3],answer,why}]}}
       scripts/grammar-quiz/review-*.json {lessonId: {"<index>": {verdict: ok|fix|reject, issues, fixed?}}}  (optional)
A question the reviewer rejected is left out; a fixed one replaces the original. Every lesson must end with 9.
The app (app.js) treats the lesson's own question as index 0 and these as 1..9; missed questions are stored
as "lessonId:index", so do not reorder questions of a published lesson.
"""
import json,pathlib,re,sys
P=pathlib.Path(__file__).resolve().parents[1];D=P/'scripts/grammar-quiz'
sys.path.insert(0,str(P/'scripts/expansion'));import validate as V
THAI=re.compile(r'[฀-๿]')
out={};errors=[]
def check_ro(ro,where):
    for s in ro.replace('＿＿',' ').replace('？',' ').replace('?',' ').replace('/',' ').split():
        base,_,n=V.split_tone(s.strip('.,!'))
        if base and not V.SYL.match(base):errors.append(f'{where}: ro syllable "{s}"')
for f in sorted(D.glob('quiz-*.json')):
    data=json.loads(f.read_text());rev={}
    r=f.with_name(f.name.replace('quiz-','review-'))
    if r.exists():rev=json.loads(r.read_text())
    for lid,x in data.items():
        qs=[]
        for i,q in enumerate(x['questions']):
            v=rev.get(lid,{}).get(str(i))
            if v and v['verdict']=='reject':continue
            if v and v['verdict']=='fix':q=v['fixed']
            w=f'{lid}#{i}'
            if not q.get('q') or not q.get('why'):errors.append(f'{w}: q/why')
            if len(q['options'])!=3 or q['answer'] not in (0,1,2):errors.append(f'{w}: options/answer')
            for o in q['options']+([q['sentence']] if q.get('sentence') else []):
                if o.get('th'):
                    if not o.get('ro'):errors.append(f'{w}: Thai without ro')
                    else:check_ro(o['ro'],w)
                elif not o.get('ja') and o is not q.get('sentence'):errors.append(f'{w}: empty option')
            if len({json.dumps(o,ensure_ascii=False) for o in q['options']})<3:errors.append(f'{w}: duplicate options')
            qs.append({k:q[k] for k in ('kind','q','sentence','options','answer','why') if k in q})
        if len(qs)!=9:errors.append(f'lesson {lid}: {len(qs)} questions after review (need 9)')
        out[lid]={'existingRo':x.get('existingRo',[]),'questions':qs}
if errors:
    print('\n'.join(errors[:60]));print(len(errors),'errors');sys.exit(1)
(P/'dist/lesson-quizzes.js').write_text('// Check questions 2–10 of each grammar lesson (AI-authored, AI-reviewed). Built by scripts/build-lesson-quizzes.py.\nconst LESSON_QUIZZES='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(out),'lessons',sum(len(v['questions']) for v in out.values()),'questions')
