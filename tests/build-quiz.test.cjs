const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','word-topics','words-app','lesson-quizzes','reorder-items','build-quiz'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};renderBuild=()=>{};toast=()=>{};this.t={lessons,lessonQuestions,startLessonQuiz,openBuildSetup,startFreeBuild,buildCandidates,buildPick,buildCheck,buildNext,buildView,lesson,course,BUILD_LEVELS,getState:()=>state,getBuild:()=>build,getView:()=>view,getQuiz:()=>quiz,setCurrent:x=>{current=x}}",ctx);
const t=ctx.t,R=vm.runInContext('REORDER_ITEMS',ctx);
// Every lesson has reorder items whose words join to the sentence and carry a reading.
let total=0;for(const l of t.lessons){const qs=R[l.id];assert(qs.length>=5,`lesson ${l.id}`);total+=qs.length;for(const q of qs){assert(q.ja&&q.th&&q.ro);assert.equal(q.t.map(x=>x[0]).join(''),q.th);for(const x of q.t)assert(x[1]);if(q.f)assert.equal(q.f.map(x=>x[0]).join(''),q.th)}}
// Lesson check tests stay multiple choice and separate from reorder practice; the lesson page has no reorder button.
t.startLessonQuiz(1);assert.equal(t.getView(),'quiz');assert.equal(t.getQuiz().ids.length,10);t.setCurrent(1);assert(!t.lesson().includes('並べ替え'));
// The course page opens the practice setup (range + difficulty).
assert(t.course().includes('openBuildSetup()'));t.openBuildSetup();assert.equal(t.getView(),'build');const setup=t.buildView();assert(setup.includes('難易度')&&setup.includes('出題範囲'));
// Practice: harder levels have more words and more distractors; results never touch the grammar test record.
const st=t.getState();st.buildRange=t.lessons.map(l=>l.id);vm.runInContext('buildSel=null',ctx);const before=JSON.stringify([st.missed,st.done,st.passed]);
const avg=[];for(const lv of t.BUILD_LEVELS){st.buildLevel=lv.id;st.buildCount=10;assert(t.buildCandidates(lv).length>=20);t.startFreeBuild();const b=t.getBuild();assert.equal(b.items.length,10);let n=0;
 for(const q of b.items){assert(q.tokens.length>=lv.min&&q.tokens.length<=lv.max);assert.equal(q.chips.length-q.tokens.length,lv.extra);n+=q.tokens.length;
  if(n%2)t.buildPick(q.chips.findIndex(c=>c.k===-1));else q.tokens.forEach(tok=>t.buildPick(q.chips.findIndex((c,i)=>c.th===tok.th&&!q.picked.includes(i))));t.buildCheck();assert.strictEqual(q.checked,!(n%2));t.buildNext()}avg.push(n/10)}
for(let i=1;i<avg.length;i++)assert(avg[i]>avg[i-1],avg.join(','));
assert.equal(JSON.stringify([st.missed,st.done,st.passed]),before);
console.log(`PASS: reorder practice separate from check tests — ${total} items; range + 4 levels (avg words ${avg.map(x=>x.toFixed(1)).join(' → ')}); practice does not change the test record.`);
