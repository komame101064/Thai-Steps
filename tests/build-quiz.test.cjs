const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{scrollTo(){}},state:{done:[],buildRo:true,buildSound:false},speakThaiText(){},toast(m){ctx.t=m},render(){},renderBuild(){},view:'build',$:()=>({}),esc:s=>String(s),icon:()=>'',shuffle:a=>[...a].sort(()=>Math.random()-.5),current:1,save(){}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','build-quiz'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext('this.T={buildPool,buildMakeItem,startBuild,buildPick,buildCheck,buildCur,buildView,get build(){return build}}',ctx);const T=ctx.T;
const all=T.buildPool(ctx.lessons?ctx.lessons.map(l=>l.id):vm.runInContext('lessons.map(l=>l.id)',ctx));
assert(all.length>=150,'enough sentences '+all.length);
const n=vm.runInContext('lessons.length',ctx);let covered=0;for(let id=1;id<=n;id++)if(T.buildPool([id]).length)covered++;assert(covered>=n-2,'most lessons have a puzzle: '+covered+'/'+n);
for(let r=0;r<30;r++){T.startBuild([1+r%n],'t');const q=T.buildCur();assert(q.chips.length>q.tokens.length,'has a distractor');
 // answer correctly by picking the token order
 q.tokens.forEach(t=>{const k=q.chips.findIndex((c,i)=>c.th===t.th&&!q.picked.includes(i));T.buildPick(k)});T.buildCheck();assert.strictEqual(q.checked,true);
 assert(/正解/.test(T.buildView()))}
T.startBuild([1],'t');const q=T.buildCur();T.buildPick(q.chips.findIndex(c=>c.k===-1));T.buildCheck();assert.strictEqual(q.checked,false);
console.log(`PASS: sentence building — ${all.length} lesson sentences, ${covered}/${n} lessons, distractors, correct/incorrect checking.`);
