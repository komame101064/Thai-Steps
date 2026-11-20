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
assert(GRAMMAR_DEEP[29].compare.some(c=>c.form==='โดน')&&GRAMMAR_DEEP[29].compare.some(c=>c.form==='ถูก'));
console.log(`PASS: 使い分けを深める for all ${lessons.length} grammar lessons — near forms, contrast examples with readings, pitfalls; passive covers ถูก and โดน.`);
