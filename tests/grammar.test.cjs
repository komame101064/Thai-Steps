const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{},document:{}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext('this.g={lessons,modules,orderedLessons,structures,segmentExample,romanizeThai,chapterLessons,CURRICULUM,roleInfo}',ctx);
const {lessons,modules,orderedLessons,structures,segmentExample,romanizeThai,chapterLessons,CURRICULUM,roleInfo}=ctx.g;
// IDs are learning-record keys: contiguous, stable, each lesson in exactly one chapter.
assert.equal(lessons.length,46);lessons.forEach((l,i)=>assert.equal(l.id,i+1));
const placed=CURRICULUM.flatMap(c=>c.ids);assert.equal(placed.length,lessons.length);assert.deepEqual([...placed].sort((a,b)=>a-b),lessons.map(l=>l.id));
assert.deepEqual(orderedLessons.map(l=>l.id),placed);assert.equal(modules.length,CURRICULUM.length);
const rank={'初級':0,'初中級':1,'中級':2,'上級':3};modules.forEach((m,i)=>{assert(m.name&&m.desc&&m.icon&&m.level in rank);if(i)assert(rank[m.level]>=rank[modules[i-1].level],'chapters go from easy to hard')});
assert.equal(modules.filter(m=>m.level==='上級').length,2);
modules.forEach((m,i)=>assert(chapterLessons(i).length>=5,m.name));
// Original lessons keep their content; only their chapter changed.
assert.equal(lessons[0].title,'基本の語順：主語＋動詞＋目的語');assert.equal(lessons[35].title,'変化する ขึ้น／ลง');
const allRo=new Set();
for(const l of lessons){
 assert(l.title&&l.intro&&l.points.length>=2&&l.examples.length>=2,l.id);assert(l.options[l.answer]&&l.why&&l.q,l.id);
 const st=structures[l.id-1];assert(st&&st[0]&&st[1]&&st[2].length,'structure '+l.id);
 for(const [r,t] of st[2]){assert(roleInfo[r],'role '+r+' in '+l.id);assert(!romanizeThai(t).includes('□'),'reading for chunk '+t+' in '+l.id)}
 l.examples.forEach((e,i)=>{assert(e.th&&e.ro&&e.ja&&e.note,l.id+'/'+i);const ws=segmentExample(e.th);assert(ws.length,l.id+'/'+i);
  // New lessons: the sentence reading must equal the word-by-word readings, so the 単語 panel never contradicts it.
  if(l.id>36)assert.equal(ws.map(w=>w.ro).join(' ').replace(/\s+/g,' '),e.ro.replace(/\s+/g,' '),'reading mismatch in lesson '+l.id+': '+e.th)});
}
for(const l of lessons.filter(l=>l.id>36)){assert(l.extra&&l.extra.length>=2,'notes '+l.id);for(const t of [l.title,l.intro,...l.points,...l.extra,...l.options,...l.examples.flatMap(e=>[e.note,...segmentExample(e.th).flatMap(w=>[w.note||'',w.meaning])])])for(const m of String(t).matchAll(/[฀-๿]+/g))assert(!romanizeThai(m[0]).includes('□'),'no reading for '+m[0]+' in lesson '+l.id)}
console.log(`PASS: ${lessons.length} grammar lessons in ${modules.length} chapters (初級→上級), stable IDs, every example segments into registered words; advanced readings match word by word; every Thai word shown in advanced lessons has a reading.`);
