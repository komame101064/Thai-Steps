// Full-word review: every entry has an integer formality 1-10, relations resolve and stay within the rules.
const fs=require('fs'),assert=require('assert');
const files=['word-bank.json','word-bank-more.json','slang-bank.json','slang-bank-more.json'];
const all=files.flatMap(n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8')));const by=new Map(all.map(w=>[w.id,w]));
assert.equal(all.length,by.size);
for(const w of all){
 assert(Number.isInteger(w.formality)&&w.formality>=1&&w.formality<=10,w.th+' formality');
 if(/王室/.test(w.speechStyle||''))assert(w.formality>=8,w.th+' royal formality');
 if(/粗い/.test(w.speechStyle||''))assert(w.formality<=4,w.th+' coarse formality');
 for(const [k,ids] of Object.entries(w.relations||{})){
  assert.equal(new Set(ids).size,ids.length,w.th+' duplicate '+k);
  for(const id of ids){const x=by.get(id);assert(x,w.th+' → missing '+id);assert(id!==w.id);if(w.collection!=='slang')assert(x.collection!=='slang',w.th+' general → slang '+x.th)}
 }
 for(const m of w.meanings)if((m.registerTags||[]).includes('literary')&&m.speechStyle&&/^標準/.test(m.speechStyle))assert.fail(w.th+' literary sense shown as standard')
}
const rel=all.reduce((n,w)=>n+Object.values(w.relations||{}).flat().length,0);assert(rel>25000,'relations '+rel);
assert.equal(by.get('tl-00419').relations&&Object.values(by.get('tl-00419').relations).flat().length||0,0);
console.log(`PASS: ${all.length.toLocaleString()} entries with formality 1-10; ${rel.toLocaleString()} relation links resolve, no general→slang links; 文語 senses labelled.`);
