const fs=require('fs'),assert=require('assert');const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));
const words=[...read('word-bank.json'),...read('slang-bank.json')],ex={...read('sense-examples.json'),...read('slang-examples.json')},report=read('full-review.json');
const pending=new Set(['tl-00419#2','tl-02259#2','tl-02192#1','tl-05054#1','tl-03108#2','tl-03381#2','tl-05113#1','tl-10029#1']);let n=0;
for(const w of words)for(const m of w.meanings){const k=w.id+'#'+m.sourceSense,e=ex[k];assert(e,k);n++;const ok=!pending.has(k);
 assert.equal(m.checked,ok,k);assert.equal(e.checked,ok,k);assert.equal(m.reviewStatus,ok?'reviewed':'needs-source',k)}
assert.equal(n,report.senses);assert.equal(report.pendingSourceChecks,pending.size);assert.equal(report.nativeReview,false);assert.equal(report.allItemsVerified,false);
console.log(`PASS: full editorial review merged; ${n-pending.size} senses checked, ${pending.size} needs-source kept out of quizzes; not native-verified.`);
