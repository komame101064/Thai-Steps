const fs=require('fs'),vm=require('vm'),assert=require('assert');
const store={};const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','word-topics','words-app','script-data','script-app','lesson-quizzes'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};this.t={SCRIPT_DATA,scriptLessons,scriptQuestions,scriptLearned,startScriptQuiz,scriptAnswer,scriptNextQuestion,scriptQuizView,scriptView,scriptLessonView,openScriptLesson,scriptHomeCard,home,nav:()=>{},getQuiz:()=>scriptQuiz,getState:()=>scriptState}",ctx);
const t=ctx.t,D=t.SCRIPT_DATA,ls=t.scriptLessons();
assert.equal(D.consonants.length,44);assert(ls.length>=18);
// Every consonant is taught exactly once, classes are the three Thai classes.
const taught=ls.flatMap(l=>l.newConsonants||[]);assert.equal(new Set(taught).size,44);assert.equal(taught.length,44);
assert(D.consonants.every(c=>['mid','high','low'].includes(c.cls)));
const cls=Object.fromEntries(D.consonants.map(c=>[c.ch,c.cls]));for(const ch of 'กจดตบปอฎฏ')assert.equal(cls[ch],'mid',ch);for(const ch of 'ขฃฉฐถผฝศษสห')assert.equal(cls[ch],'high',ch);
// A lesson's readings use only consonants taught so far (ว ย อ also spell vowels such as –ัว เ–ีย, so the full check is check_script_data.py).
const all=new Set(D.consonants.map(c=>c.ch));ls.forEach((l,i)=>{const known=new Set(t.scriptLearned(i).consonants);for(const r of l.readings||[])for(const ch of r.th)if(all.has(ch)&&!'วยอ'.includes(ch))assert(known.has(ch),`${l.id} ${r.th} uses ${ch} early`)});
// Every lesson has a 10-question test with one correct option among three.
ls.forEach((l,i)=>{const qs=t.scriptQuestions(i);assert.equal(qs.length,10,l.id);for(const q of qs){assert.equal(q.options.length,3);assert(q.options.includes(q.answer),l.id+' '+q.prompt);assert.equal(new Set(q.options).size,3)}});
// Full marks complete the lesson; one miss does not.
const run=(id,miss)=>{t.startScriptQuiz(id);const qz=t.getQuiz();qz.qs.forEach((q,i)=>{t.scriptAnswer(i===miss?q.options.findIndex(o=>o!==q.answer):q.options.indexOf(q.answer));t.scriptNextQuestion()});return t.scriptQuizView()};
assert(run('s01',2).includes('9 / 10'));assert(!t.getState().done.includes('s01'));
assert(run('s01',-1).includes('履修済みにしました'));assert(t.getState().done.includes('s01'));assert(JSON.parse(store['thai-steps-script-v1']).done.includes('s01'));
assert(t.scriptView().includes('文字'));assert(t.home().includes('s-home-card'));
console.log(`PASS: script course — 44 consonants taught once, ${ls.length} lessons in order, 10-question tests, full marks complete a lesson (own storage key).`);
