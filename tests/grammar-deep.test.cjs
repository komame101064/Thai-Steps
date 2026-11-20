const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{},document:{}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','grammar-deep'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext('this.g={lessons,romanizeThai,GRAMMAR_DEEP}',ctx);const {lessons,romanizeThai,GRAMMAR_DEEP}=ctx.g;
// Every lesson has a 使い分けを深める section: near forms, contrast examples with readings, pitfalls.
for(const l of lessons){const d=GRAMMAR_DEEP[l.id];assert(d,'deep section for lesson '+l.id);assert(d.lead&&d.compare.length>=2&&d.cases.length>=3&&d.pitfalls.length>=2,'shape '+l.id);
 for(const c of d.compare)assert(c.form&&c.ro&&c.use&&c.style,'compare '+l.id);for(const c of d.cases)assert(c.th&&c.ro&&c.ja&&c.note,'case '+l.id);
 for(const t of [d.lead,...d.compare.map(c=>c.use),...d.cases.flatMap(c=>[c.ja,c.note]),...d.pitfalls])for(const m of String(t).matchAll(/[฀-๿]+/g))assert(!romanizeThai(m[0]).includes('□'),'reading for '+m[0]+' in lesson '+l.id);
 assert(!/SVO|\bS\b|\bV\b/.test(JSON.stringify(d)),'no S/V/O symbols in '+l.id)}
// The passive lesson covers โดน as well as ถูก (user's request).
assert(GRAMMAR_DEEP[29].compare.some(c=>c.form==='โดน')&&GRAMMAR_DEEP[29].compare.some(c=>c.form==='ถูก'));{const l=lessons[28];assert(l.head.includes('โดน')&&l.intro.includes('โดน')&&l.examples.filter(e=>e.th.includes('โดน')).length>=2,'the passive lesson itself teaches โดน')}
console.log(`PASS: 使い分けを深める for all ${lessons.length} grammar lessons — near forms, contrast examples with readings, pitfalls; passive covers ถูก and โดน.`);
// Thai inside the grammar check questions is shown as romanization: none may fall back to boxes (□).
{vm.runInContext(fs.readFileSync('dist/lesson-quizzes.js','utf8')+';this.LQ=LESSON_QUIZZES',ctx);const walk=x=>typeof x==='string'?[x]:Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?Object.values(x).flatMap(walk):[];
 const bad=walk(ctx.LQ).flatMap(t=>[...t.matchAll(/[฀-๿]+/g)].map(m=>m[0])).filter(t=>romanizeThai(t).includes('□'));assert.deepEqual(bad,[],'readings missing in check questions');
 console.log('PASS: every Thai word in the grammar check questions has a reading.')}
// Emphasis (red / marker): every span is an exact substring of its lesson's texts, so nothing silently fails to show.
{vm.runInContext(fs.readFileSync('dist/script-data.js','utf8')+';'+fs.readFileSync('dist/lesson-emphasis.js','utf8')+';this.E=LESSON_EMPHASIS;this.SD=SCRIPT_DATA',ctx);const E=ctx.E;
 assert.equal(Object.keys(E.g).length,lessons.length);assert.equal(Object.keys(E.s).length,ctx.SD.lessons.length);
 for(const l of lessons){const d=GRAMMAR_DEEP[l.id],ts=[l.intro,...l.points,...(l.extra||[]),d.lead,...d.compare.map(c=>c.use),...d.pitfalls],e=E.g[l.id];assert(e.red.length>=1&&e.red.length<=3,'red spans '+l.id);for(const sp of [...e.red,...e.mark])assert(ts.some(t=>t.includes(sp)),'span in lesson '+l.id+': '+sp)}
 for(const l of ctx.SD.lessons){const ts=[l.intro,...(l.points||[])],e=E.s[l.id];for(const sp of [...e.red,...e.mark])assert(ts.some(t=>t.includes(sp)),'span in '+l.id+': '+sp)}
 console.log('PASS: important parts marked (red / marker) in all grammar and script lessons; every span matches its text.')}
