const fs=require('fs'),assert=require('assert');const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));
const words=[...read('word-bank.json'),...read('slang-bank.json')],ex={...read('sense-examples.json'),...read('slang-examples.json')},report=read('full-review.json');
const archive=JSON.parse(fs.readFileSync('scripts/full-review/excluded-senses.json','utf8'));
const excluded=new Set(['tl-03108#2','tl-03381#2','tl-00419#2','tl-05113#1']);
const pending=new Set(['tl-02259#2','tl-02192#1','tl-05054#1','tl-10029#1']);let n=0;
for(const w of words){
 assert(w.meanings.length,w.id);
 for(const m of w.meanings){const k=w.id+'#'+m.sourceSense,e=ex[k];assert(e,k);n++;assert(!excluded.has(k),k+' should be excluded');const ok=!pending.has(k);
  assert.equal(m.checked,ok,k);assert.equal(e.checked,ok,k);assert.equal(m.reviewStatus,ok?'reviewed':'needs-source',k)}
 // Relation details may only point at senses that still exist.
 for(const ds of Object.values(w.relationDetails||{}))for(const d of ds){const t=words.find(x=>x.id===d.id);if(!t)continue;
  for(const s of d.sourceSenses)assert(w.meanings.some(m=>m.sourceSense===s),`${w.id} -> ${d.id} source ${s}`);
  for(const s of d.targetSenses)assert(t.meanings.some(m=>m.sourceSense===s),`${w.id} -> ${d.id} target ${s}`)}}
assert.equal(Object.keys(ex).length,n,'no orphaned examples');
// Excluded senses are archived with their original meaning and example, not silently dropped.
assert.deepEqual(new Set(archive.map(a=>a.id+'#'+a.sourceSense)),excluded);
for(const a of archive){assert(a.meaning&&a.example&&a.reason&&a.sources.length,a.id);assert.equal(a.meaning.reviewStatus,'needs-source')}
assert.equal(n+excluded.size,report.senses);assert.equal(report.activeSenses,n);
assert.equal(report.pendingSourceChecks,pending.size);assert.equal(report.nativeReview,false);assert.equal(report.allItemsVerified,false);
// Specific fixes kept while still unverified.
const by=Object.fromEntries(words.map(w=>[w.id,w]));
assert.equal(ex['tl-02192#1'].ja.includes('陛下'),false);assert.equal(by['tl-05054'].ro,'khɛ́p');assert.equal(by['tl-00419'].pos,'数詞');assert.deepEqual(by['tl-00419'].relations,{});
console.log(`PASS: full editorial review merged; ${n-pending.size} senses checked, ${pending.size} needs-source kept out of quizzes, ${excluded.size} doubtful senses excluded and archived; not native-verified.`);
