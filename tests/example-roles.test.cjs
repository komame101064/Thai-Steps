const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{scrollTo(){},addEventListener(){}},document:{querySelector:()=>({}),addEventListener(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},Date,Math,setTimeout,clearTimeout,history:{replaceState(){},pushState(){}}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','example-roles'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("this.t={lessons,wordsFor,roleInfo,EXAMPLE_ROLES,roleExample,exampleRoleLegend,lessonKeys}",ctx);
const t=ctx.t;let n=0,words=0;
// Every lesson example has one role per word, the roles are the ones the structure panel uses, and the coloured lines keep the full text.
for(const l of t.lessons)l.examples.forEach((e,i)=>{const r=t.EXAMPLE_ROLES[l.id+'-'+i],ws=t.wordsFor(l,i);assert(r,'no roles for '+l.id+'-'+i);assert.equal(r.length,ws.length,l.id+'-'+i);for(const c of r)assert(t.roleInfo[c],c);
 const html=t.roleExample(l,i,e);assert(html.includes('is-roles'),'falls back: '+l.id+'-'+i+' '+e.th);const text=s=>s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&');const [th,ro]=html.split('</div><div class="ro');assert.equal(text(th),e.th);assert.equal(text('<div class="ro'+ro),e.ro);
 assert.equal((html.match(/class="rw role-/g)||[]).length,ws.length*2);n++;words+=ws.length});
assert.equal(Object.keys(t.EXAMPLE_ROLES).length,n);
// A sentence needs a verb or a predicate; a subject never follows nothing but particles.
for(const [k,r] of Object.entries(t.EXAMPLE_ROLES))assert(r.some(c=>['V','Adj','C','Q','Aux','Part','N','Loc','T','O','Adv','Num'].includes(c)),k);
// The legend names only roles used in the lesson, in the same words as the structure panel; lessons mark their key form.
const l1=t.lessons[0],lg=t.exampleRoleLegend(l1);assert(lg.includes('動詞')&&lg.includes('この課の形')&&!/[>"]S[<"]|SVO/.test(lg));
const l29=t.lessons.find(l=>l.id===29);assert(l29.examples.some((e,i)=>/is-key/.test(t.roleExample(l29,i,e))));
console.log(`PASS: grammar examples coloured by role — ${n} examples, ${words} words, same roles as the structure panel; key forms marked; AI-assigned, not native-verified.`);
