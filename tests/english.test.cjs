const fs=require('fs'),vm=require('vm'),assert=require('assert');const store={};
const el=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}}});const els={'#main':el(),'#tabs':el(),'#toast':el()};
const ctx={console,Math,Date,JSON,setTimeout:()=>0,clearTimeout(){},URL,Blob:function(){},window:{scrollTo(){},addEventListener(){}},location:{hash:''},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},document:{querySelector:s=>els[s]||el(),createElement:()=>({click(){}})},
 fetch:async u=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('dist/en/'+String(u).split('?')[0],'utf8'))})};ctx.window.addEventListener=()=>{};ctx.addEventListener=()=>{};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('dist/en/en.js','utf8').replace("window.addEventListener('hashchange'","(()=>{})('hashchange'"),ctx);
(async()=>{await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
 const W=vm.runInContext('W',ctx),P=vm.runInContext('P',ctx);
 // Data: 200 words in learning order with Japanese meanings, IPA and an example; 120 phrases; unique ids.
 assert.equal(W.length,200);assert.equal(P.length,120);assert(W.every((w,i)=>w.id===`en-${String(i+1).padStart(3,'0')}`&&w.w&&w.ja&&w.ipa&&w.ex&&w.exJa&&w.pos));assert(P.every(p=>/^ep-\d{3}$/.test(p.id)&&p.en&&p.ja));
 for(const x of ['cat','dog','water','house','school'])assert(W.findIndex(w=>w.w===x)<100,x);
 assert(els['#main'].innerHTML.includes('今日の学習'));
 // A step: 10 new words shown, recalled both ways; full marks schedule them a day later; progress saved under its own key.
 vm.runInContext('startStep()',ctx);const s=vm.runInContext('sess',ctx);assert.equal(s.tasks.filter(t=>t.type==='learn').length,10);
 vm.runInContext("while(sess&&sess.i<sess.tasks.length){const t=sess.tasks[sess.i];if(t.type!=='learn'){render();const x=item(t);answer(sess.choices.findIndex(c=>c.id===x.id))}nextTask()}",ctx);
 const st=JSON.parse(store['english-steps-v1']);assert.equal(Object.values(st.rec).filter(r=>r.seen>0).length,10);assert.equal(st.today.steps,1);
 assert(Object.values(st.rec).every(r=>r.stage===1&&r.due>Date.now()+20*3600000));assert(!store['thai-steps-words-v1']);
 // Backups: bad ids and values are dropped.
 const z=vm.runInContext("sanitize({rec:{'en-001':{seen:2,stage:9,fav:1},'x':{}},perDay:7,rate:3})",ctx);assert.deepEqual(Object.keys(z.rec),['en-001']);assert.equal(z.rec['en-001'].stage,6);assert.equal(z.perDay,1);
 console.log('PASS: English Steps — 200 words, 120 phrases, step learning with spaced follow-up, separate storage, safe import.')})().catch(e=>{console.error(e);process.exit(1)});
