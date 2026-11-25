const fs=require('fs'),vm=require('vm'),assert=require('assert');
// Words the device voice misreads are split into syllables only for speech; the text on screen is unchanged.
const spoken=[];const ctx={console,window:{speechSynthesis:{}},document:{querySelector:()=>({})},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},Date,Math,setTimeout,clearTimeout,
 SpeechSynthesisUtterance:function(t){this.text=t},speechSynthesis:{cancel(){},speak(u){spoken.push(u.text)},addEventListener(){},getVoices:()=>[{lang:'th-TH',voiceURI:'th'}]}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("toast=()=>{};this.t={speakThaiText,speechFix}",ctx);
const t=ctx.t;
for(const [a,b] of [['ทีละนิด','ที ละ นิด'],['เรียนทีละนิดก็ได้','เรียนที ละ นิดก็ได้'],['ทีละคน','ที ละ คน'],['ที่ละ','ที่ละ'],['สวัสดี','สวัสดี']])assert.equal(t.speechFix(a),b,a);
t.speakThaiText('ทีละนิด');assert.equal(spoken.pop(),'ที ละ นิด');
console.log('PASS: speech-only syllable split for words the voice misreads (ทีละ…); display text unchanged.');
