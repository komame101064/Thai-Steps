const fs=require('fs'),vm=require('vm'),assert=require('assert');
const store={'thai-steps-v1':JSON.stringify({done:[2],wrong:[5],passed:[]})};
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','word-topics','words-app','lesson-quizzes'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};this.t={lessons,orderedLessons,lessonQuestions,startLessonQuiz,startMixedQuiz,answer,nextQuestion,quizView,lesson,chapterComplete,chapterLessons,course,home,getState:()=>state,getQuiz:()=>quiz,setCurrent:x=>{current=x}}",ctx);
const t=ctx.t,full=Object.keys(ctx.LESSON_QUIZZES||vm.runInContext('LESSON_QUIZZES',ctx)).length;
// Legacy wrong ids migrate to the lesson's first question.
assert.equal(JSON.stringify(t.getState().missed),'["5:0"]');
// Every lesson: 10 questions, 3 options, one valid answer, Thai options carry romanization.
for(const l of t.lessons){const qs=t.lessonQuestions(l.id);assert.equal(qs.length,10,`lesson ${l.id}`);
 for(const q of qs){assert.equal(q.options.length,3);assert([0,1,2].includes(q.answer));assert(q.q&&q.why);for(const o of q.options)if(o.th)assert(o.ro,`ro missing in lesson ${l.id}`)}}
const run=(id,wrongAt=-1)=>{t.startLessonQuiz(id);const qz=t.getQuiz();assert.equal(qz.ids.length,10);for(let i=0;i<10;i++){const q=t.lessonQuestions(id)[i];t.answer(i===wrongAt?(q.answer+1)%3:q.answer);t.nextQuestion()}return t.quizView()};
// One mistake: not completed, the missed question goes to review.
let html=run(1,3);assert(!t.getState().done.includes(1));assert(t.getState().missed.includes('1:3'));assert(html.includes('9 / 10'));assert(t.getState().wrong.includes(1));
// All correct: completed, and the earlier miss is cleared.
html=run(1);assert(t.getState().done.includes(1));assert(t.getState().passed.includes(1));assert(!t.getState().missed.includes('1:3'));assert(html.includes('履修済み'));
// Lesson page shows the 10-question test and the completed badge; no manual "mark as done" button.
t.setCurrent(1);const page=t.lesson();assert(page.includes('確認問題を解く（10問）'));assert(page.includes('✓ 履修済み'));assert(!page.includes('読んだので学習済みにする'));
// A chapter whose lessons are all completed is highlighted.
const ch=t.lessons[0].m;for(const l of t.chapterLessons(ch))if(!t.getState().done.includes(l.id))t.getState().done.push(l.id);
assert(t.chapterComplete(ch));assert(t.course().includes('x-course-chapter is-complete'));
t.startMixedQuiz();assert.equal(t.getQuiz().ids.length,t.lessons.length);
console.log(`PASS: ${t.lessons.length} lessons × 10 check questions; full marks completes a lesson, misses go to review per question; completed chapters highlighted.`);
