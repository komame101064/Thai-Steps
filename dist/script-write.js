// 文字 › 書き方練習: trace letters on screen, or print practice sheets for a real notebook.
// Letters use Noto Looped Thai (Steps Thai): the small loop (head) shows where the stroke starts.
let writeSet='mid',writeIdx=0,writeShow=true,writeStrokes=[];
const WRITE_SETS=[['mid','中子音'],['high','高子音'],['low','低子音'],['vowel','母音'],['tone','声調記号'],['digit','数字']];
function writeChars(set=writeSet){const D=typeof SCRIPT_DATA!=='undefined'?SCRIPT_DATA:null;if(!D)return [];
 if(['mid','high','low'].includes(set))return D.consonants.filter(c=>c.cls===set).map(c=>({ch:c.ch,say:c.name,ro:c.nameRo,ja:c.nameJa||'',old:!c.final&&/使われない/.test(c.note||'')}));
 // vowels and marks are written on the carrier อ, as in Thai writing practice
 if(set==='vowel')return D.vowels.map(v=>{const f=v.form.replace(/\([^)]*\)/g,'').replace(/[–-]/g,'อ');return {ch:f,say:f,ro:v.ro,ja:v.length==='short'?'短母音':v.length==='long'?'長母音':''}}).filter((x,i,a)=>a.findIndex(y=>y.ch===x.ch)===i);
 if(set==='tone')return D.toneMarks.map(t=>({ch:'อ'+t.mark,say:t.name,ro:t.nameRo,ja:t.name}));
 return D.digits.map(d=>({ch:d.ch,say:d.ch,ro:d.ro,ja:String(d.value)}))}
function openWrite(){view='scriptWrite';writeStrokes=[];render();window.scrollTo(0,0)}
function writeSelect(i){writeIdx=i;writeStrokes=[];render();writeSay()}
function writeMove(d){const n=writeChars().length;writeIdx=(writeIdx+d+n)%n;writeStrokes=[];render();writeSay()}
function writeSay(){const c=writeChars()[writeIdx];if(c&&typeof speakThaiText==='function')speakThaiText(c.say,false,true)}
function writeCard(){return `<button class="bq-course-card s-write-card" onclick="openWrite()"><span class="bq-course-icon" aria-hidden="true" lang="th">ก</span><span class="bq-course-body"><b>書き方練習</b><small>見本をなぞって練習・ノート用の練習シートを印刷</small></span><span class="bq-course-end">${icon('arrow')}</span></button>`}
function scriptWriteView(){const cs=writeChars();if(writeIdx>=cs.length)writeIdx=0;const c=cs[writeIdx];
 setTimeout(writeCanvasInit,0);
 return `<button class="textbtn back" onclick="go('script')">← 文字に戻る</button><section class="s-write"><h1>書き方練習</h1>
 <p class="s-write-tip">小さな丸（<b>頭</b>）のある字は、<b>丸から書き始めます</b>。多くの字はペンを離さず一筆で書けます。2本の線の間（中心の高さ）に収め、上下にはみ出す部分だけを出します。</p>
 <div class="x-chapter-chips" role="group" aria-label="文字の種類">${WRITE_SETS.map(([k,t])=>`<button aria-pressed="${writeSet===k}" onclick="writeSet='${k}';writeIdx=0;writeStrokes=[];render()">${t}</button>`).join('')}</div>
 <div class="s-write-pick">${cs.map((x,i)=>`<button class="${i===writeIdx?'is-on':''}" onclick="writeSelect(${i})" lang="th" aria-label="${esc(x.ro)}">${esc(x.ch)}</button>`).join('')}</div>
 ${c?`<div class="s-write-main"><div class="s-write-info"><span class="s-write-glyph" lang="th">${esc(c.ch)}</span><span><b>${esc(c.ro)}</b><small>${esc(c.ja)}</small></span><button class="w-audio is-icon" onclick="writeSay()" aria-label="発音">${icon('audio')}</button></div>
 <canvas id="write-canvas" class="s-write-canvas" width="600" height="600" aria-label="なぞり書きの欄"></canvas>
 <div class="s-write-actions"><button class="btn light" onclick="writeMove(-1)" aria-label="前の字">←</button><button class="btn light" onclick="writeStrokes=[];writeCanvasDraw()">消す</button><button class="btn light" onclick="writeShow=!writeShow;writeCanvasDraw();this.textContent=writeShow?'見本を隠す':'見本を出す'">${writeShow?'見本を隠す':'見本を出す'}</button><button class="btn light" onclick="writeMove(1)" aria-label="次の字">→</button></div></div>`:''}
 <div class="s-write-print"><h2>ノートで練習</h2><p>見本・なぞり書き・空欄が並んだ練習シートを印刷できます（A4）。</p><button class="btn" onclick="writePrint()">「${WRITE_SETS.find(x=>x[0]===writeSet)[1]}」の練習シートを印刷</button></div></section>`}
// ---- tracing canvas ----
let writeDrawing=false;
function writeCanvasInit(){const cv=document.getElementById('write-canvas');if(!cv||cv.dataset.ready)return;cv.dataset.ready='1';
 const pos=e=>{const r=cv.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return [(t.clientX-r.left)*cv.width/r.width,(t.clientY-r.top)*cv.height/r.height]};
 const start=e=>{e.preventDefault();writeDrawing=true;writeStrokes.push([pos(e)]);writeCanvasDraw()};
 const move=e=>{if(!writeDrawing)return;e.preventDefault();writeStrokes[writeStrokes.length-1].push(pos(e));writeCanvasDraw()};
 const end=()=>{writeDrawing=false};
 cv.addEventListener('pointerdown',start);cv.addEventListener('pointermove',move);cv.addEventListener('pointerup',end);cv.addEventListener('pointerleave',end);
 if(document.fonts&&document.fonts.load)document.fonts.load('400px "Steps Thai"').then(writeCanvasDraw,writeCanvasDraw);else writeCanvasDraw()}
function writeCanvasDraw(){const cv=document.getElementById('write-canvas');if(!cv)return;const g=cv.getContext('2d'),W=cv.width,H=cv.height,c=writeChars()[writeIdx];g.clearRect(0,0,W,H);g.fillStyle='#fffefa';g.fillRect(0,0,W,H);
 // guide lines: top, middle band (x-height) and baseline, like a Thai practice notebook
 const lines=[[0.2,'#e3d6b3',1],[0.38,'#9fb39a',2],[0.7,'#9fb39a',2],[0.86,'#e3d6b3',1]];for(const [y,col,w] of lines){g.strokeStyle=col;g.lineWidth=w;g.setLineDash(w===1?[10,8]:[]);g.beginPath();g.moveTo(0,H*y);g.lineTo(W,H*y);g.stroke()}g.setLineDash([]);
 if(c&&writeShow){g.fillStyle='rgba(31,74,60,.16)';g.textAlign='center';g.textBaseline='alphabetic';g.font='400 300px "Steps Thai","Noto Looped Thai",sans-serif';g.fillText(c.ch,W/2,H*0.7)}
 g.strokeStyle='#1f4a3c';g.lineWidth=14;g.lineCap='round';g.lineJoin='round';for(const s of writeStrokes){g.beginPath();s.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(s.length===1)g.lineTo(s[0][0]+.1,s[0][1]);g.stroke()}}
// ---- printable sheet ----
function writePrint(){const cs=writeChars(),title=WRITE_SETS.find(x=>x[0]===writeSet)[1];let el=document.getElementById('print-sheet');if(!el){el=document.createElement('div');el.id='print-sheet';document.body.appendChild(el)}
 el.innerHTML=`<h1>Thai Steps 書き方練習シート：${esc(title)}</h1><p class="ps-tip">小さな丸（頭）から書き始め、ペンを離さずに書きます。灰色の字をなぞってから、空欄に書きましょう。</p>`+cs.map(c=>`<div class="ps-row"><div class="ps-label"><b>${esc(c.ro)}</b><small>${esc(c.ja)}</small></div>${[0,1,2,3,4,5,6,7].map(i=>`<div class="ps-cell${i===0?' is-model':i<4?' is-trace':''}"><span lang="th">${i<4?esc(c.ch):''}</span></div>`).join('')}</div>`).join('');
 const doPrint=()=>window.print();if(document.fonts&&document.fonts.load)document.fonts.load('400 40px "Steps Thai"').then(doPrint,doPrint);else doPrint()}
