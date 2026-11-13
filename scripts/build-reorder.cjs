// Build dist/reorder-items.js: every grammar test question as a sentence-building (並べ替え) item.
// Sources: lesson examples (dist/data.js etc.) and the check questions (dist/lesson-quizzes.js).
// Each item: {ja (prompt), th, ro, why?, t:[[th,ro,meaning],...], f?:[[...]] (finer split for hard levels)}.
// Words come from the grammar vocabulary first (segmentExample), else the word bank aligned to the romanization.
const fs=require('fs'),vm=require('vm'),path=require('path');
const D=path.join(__dirname,'..','dist');
const ctx={window:{},localStorage:{getItem:()=>null},console};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','lesson-quizzes'])vm.runInContext(fs.readFileSync(path.join(D,n+'.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(D,'words-app.js'),'utf8'),ctx);
const read=n=>{try{return JSON.parse(fs.readFileSync(path.join(D,n),'utf8'))}catch{return []}};
ctx.__bank=[...read('word-bank.json'),...read('word-bank-more.json'),...read('slang-bank.json'),...read('slang-bank-more.json')];
vm.runInContext('bank=__bank;this.R={lessons,LESSON_QUIZZES,segmentExample,segmentSentence}',ctx);
const {lessons,LESSON_QUIZZES,segmentExample,segmentSentence}=ctx.R;
const syl=ro=>ro.trim().split(/\s+/).filter(Boolean);
const clean=s=>String(s||'').replace(/[。？！?!、,]+$/,'').trim();
function bankSeg(th,ro){const toks=segmentSentence(th,ro);if(!toks||!toks.length)return null;const out=[];for(const t of toks){if(t.kind==='sep')continue;if(t.kind!=='word'||!t.w)return null;out.push([t.th,t.ro,t.w.meanings?.[0]?.ja||''])}return out}
// give each token its slice of the sentence's own tone-marked romanization (counts must add up)
function reslice(t,ro,counts){const S=syl(ro);if(counts.reduce((a,b)=>a+b,0)!==S.length)return null;let j=0;return t.map((x,k)=>{const r=S.slice(j,j+counts[k]).join(' ');j+=counts[k];return [x[0],r,x[2]]})}
function tokens(th,ro){th=th.replace(/\s+/g,'');
 try{const ws=segmentExample(th);if(ws.length&&ws.map(w=>w.th).join('')===th){const t=ws.map(w=>[w.th,w.ro,w.meaning||'']);return reslice(t,ro,ws.map(w=>syl(w.ro).length))||t}}catch{}
 const toks=segmentSentence(th,ro);if(!toks||!toks.length)return null;const out=[],counts=[];for(const x of toks){if(x.kind==='sep')continue;if(x.kind!=='word'||!x.w)return null;out.push([x.th,x.ro,x.w.meanings?.[0]?.ja||'']);counts.push(syl(x.ro).length)}
 if(out.map(x=>x[0]).join('')!==th)return null;return reslice(out,ro,counts)}
function finer(t){// split multi-syllable tokens into smaller known words (for harder levels)
 let changed=false;const out=[];for(const x of t){const n=syl(x[1]).length;if(n>=2){const s=tokens2(x[0],x[1]);if(s&&s.length>=2){out.push(...s);changed=true;continue}}out.push(x)}return changed?out:null}
function tokens2(th,ro){const toks=segmentSentence(th,ro);if(!toks)return null;const out=[],counts=[];for(const x of toks){if(x.kind!=='word'||!x.w||x.w.th===th)return null;out.push([x.th,x.ro,x.w.meanings?.[0]?.ja||'']);counts.push(syl(x.ro).length)}return out.map(x=>x[0]).join('')===th?reslice(out,ro,counts):null}
const quoted=q=>{const m=String(q).match(/^(.*?)「([^」]+)」/);return m?{pre:m[1],ja:m[2]}:null};
const OUT={},stats={items:0,dropped:0,len:{}};
for(const l of lessons){const items=[],seen=new Set();
 const add=(ja,th,ro,why,src)=>{th=String(th||'').trim();ro=String(ro||'').trim();if(!th||!ro||!ja||/[＿_]/.test(th)||seen.has(th.replace(/\s+/g,'')))return;const t=tokens(th,ro);if(!t||t.length<2){stats.dropped++;return}seen.add(th.replace(/\s+/g,''));const it={ja:clean(ja),th:th.replace(/\s+/g,''),ro,t,src};if(why)it.why=why;const f=finer(t);if(f)it.f=f;items.push(it);stats.len[t.length]=(stats.len[t.length]||0)+1};
 const x=LESSON_QUIZZES[l.id];
 for(const q of (x&&x.questions)||[]){const a=q.options&&q.options[q.answer];if(!a)continue;
  if(q.kind==='meaning'&&q.sentence)add(a.ja,q.sentence.th,q.sentence.ro,q.why,'q');
  else if(q.kind==='blank'&&q.sentence&&a.th){const qq=quoted(q.q),pre=qq&&qq.pre?qq.pre:'';add((pre?pre+'「':'')+(q.sentence.ja||'')+(pre?'」':''),q.sentence.th.replace(/\s*＿＿\s*/,a.th),q.sentence.ro.replace(/＿＿/,a.ro||''),q.why,'q')}
  else if(a.th){const qq=quoted(q.q);if(qq)add((qq.pre?qq.pre+'「'+qq.ja+'」':qq.ja),a.th,a.ro,q.why,'q')}}
 l.examples.forEach(e=>add(e.ja,e.th,e.ro,e.note,'e'));
 OUT[l.id]=items;stats.items+=items.length}
const compact=JSON.stringify(OUT);
fs.writeFileSync(path.join(D,'reorder-items.js'),'// Grammar test items as sentence-building puzzles. Built by scripts/build-reorder.cjs from lesson examples and check questions.\nconst REORDER_ITEMS='+compact+';\n');
console.log(JSON.stringify(stats),'lessons with <5 items:',lessons.filter(l=>OUT[l.id].length<5).map(l=>l.id+':'+OUT[l.id].length).join(' '));
