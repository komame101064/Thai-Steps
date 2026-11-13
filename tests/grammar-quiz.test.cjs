const fs=require('fs'),vm=require('vm'),assert=require('assert');
const store={'thai-steps-v1':JSON.stringify({done:[2],wrong:[5],passed:[]})};
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','word-topics','words-app','reorder-items','build-quiz'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};renderBuild=()=>{};toast=m=>{this.toastMsg=m};this.t={lessons,orderedLessons,lessonQuestions,startLessonQuiz,startMixedQuiz,startQuiz,startFreeBuild,buildCandidates,buildLevel,buildPick,buildCheck,buildNext,buildView,lesson,chapterComplete,chapterLessons,course,home,BUILD_LEVELS,getState:()=>state,getBuild:()=>build,getView:()=>view,setCurrent:x=>{current=x}}",ctx);
const t=ctx.t;
// Legacy wrong ids migrate to the lesson's first question.
assert.equal(JSON.stringify(t.getState().missed),'["5:0"]');
// Every lesson has at least 5 reorder items; every item's words join to the sentence and carry a reading.
let total=0;for(const l of t.lessons){const qs=t.lessonQuestions(l.id);assert(qs.length>=5,`lesson ${l.id}: ${qs.length}`);total+=qs.length;
 for(const q of qs){assert(q.ja&&q.th&&q.ro,`lesson ${l.id}`);assert.equal(q.t.map(x=>x[0]).join(''),q.th);for(const x of q.t)assert(x[1],`ro missing in lesson ${l.id}: ${x[0]}`);if(q.f)assert.equal(q.f.map(x=>x[0]).join(''),q.th)}}
assert(total>=550,'reorder items '+total);
const answerAll=(wrongAt=-1)=>{const b=t.getBuild();for(let i=0;i<b.items.length;i++){const q=b.items[b.k];
  if(i===wrongAt)t.buildPick(q.chips.findIndex(c=>c.k===-1));else q.tokens.forEach(tok=>t.buildPick(q.chips.findIndex((c,n)=>c.th===tok.th&&!q.picked.includes(n))));
  t.buildCheck();assert.strictEqual(q.checked,i!==wrongAt);t.buildNext()}return t.buildView()};
// Lesson test = reorder questions. One mistake: not completed, the missed question goes to review.
t.startLessonQuiz(1);assert.equal(t.getView(),'build');assert.equal(t.getBuild().items.length,Math.min(10,t.lessonQuestions(1).length));
let missKey=t.getBuild().items[3].key,html=answerAll(3);assert(!t.getState().done.includes(1));assert(t.getState().missed.includes(missKey));assert(t.getState().wrong.includes(1));assert(/9 \/ 10|\d+ \/ \d+/.test(html));
// Retrying the missed questions from review uses the same engine; all correct clears them.
t.startQuiz([missKey],'review');answerAll();assert(!t.getState().missed.includes(missKey));
// All correct: completed.
t.startLessonQuiz(1);html=answerAll();assert(t.getState().done.includes(1));assert(t.getState().passed.includes(1));assert(html.includes('履修済み'));
// Lesson page shows the reorder test and the completed badge.
t.setCurrent(1);const page=t.lesson();assert(page.includes('確認テストを解く（10問）'));assert(page.includes('並べ替えて'));assert(page.includes('✓ 履修済み'));
// Free practice: range and difficulty. Higher levels have longer sentences and more distractors.
const st=t.getState();st.buildRange=t.lessons.map(l=>l.id);vm.runInContext('buildSel=null',ctx);
const avg=[];for(const lv of t.BUILD_LEVELS){st.buildLevel=lv.id;st.buildCount=10;const c=t.buildCandidates(lv);assert(c.length>=20,`level ${lv.id}: ${c.length}`);t.startFreeBuild();const b=t.getBuild();assert.equal(b.items.length,10);
 let n=0;for(const q of b.items){assert(q.tokens.length>=lv.min&&q.tokens.length<=lv.max);assert.equal(q.chips.length-q.tokens.length,lv.extra);n+=q.tokens.length}avg.push(n/10)}
for(let i=1;i<avg.length;i++)assert(avg[i]>avg[i-1],'harder levels have more words: '+avg.join(','));
assert(/上級は読みを表示しません/.test(t.buildView()));
// The setup screen (range + difficulty) opens from the course page card.
t.startMixedQuiz();assert.equal(t.getView(),'build');assert.equal(t.getBuild(),null);const setup=t.buildView();assert(setup.includes('難易度')&&setup.includes('出題範囲'));
// A chapter whose lessons are all completed is highlighted.
const ch=t.lessons[0].m;for(const l of t.chapterLessons(ch))if(!st.done.includes(l.id))st.done.push(l.id);
assert(t.chapterComplete(ch));assert(t.course().includes('x-course-chapter is-complete'));
console.log(`PASS: grammar tests are sentence-building — ${total} items in ${t.lessons.length} lessons; full marks completes a lesson, misses go to review; free practice by range and 4 difficulty levels (avg words ${avg.map(x=>x.toFixed(1)).join(' → ')}).`);
