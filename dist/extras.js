// 番外編 (grammar extras): numbers and pronunciation/tones. Reference chapters outside the 47 lessons; they do not
// change lesson ids or grammar progress. Readings follow the app's romanization (same as the word bank).
const NUM_TH=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'],NUM_RO=['sǔun','nʉ̀ng','sɔ̌ɔng','sǎam','sìi','hâa','hòk','cèt','pɛ̀ɛt','kâao'];
const NUM_UNIT=[['',''],['สิบ','sìp'],['ร้อย','rɔ́ɔi'],['พัน','phan'],['หมื่น','mʉ̀ʉn'],['แสน','sɛ̌ɛn']];
// Thai reading of 0–9,999,999: 1 in the ones place after other digits is เอ็ด, 1 and 2 in the tens place are สิบ / ยี่สิบ.
function thaiNumber(n){if(n===0)return {th:NUM_TH[0],ro:NUM_RO[0]};if(n>=1000000){const hi=thaiNumber(Math.floor(n/1000000)),lo=n%1000000,rest=lo?thaiNumber(lo):null;return {th:hi.th+'ล้าน'+(rest?rest.th:''),ro:hi.ro+' láan'+(rest?' '+rest.ro:'')}}
 const ds=String(n).split('').map(Number).reverse(),th=[],ro=[];for(let p=ds.length-1;p>=0;p--){const d=ds[p];if(!d)continue;
  if(p===1){if(d===1){th.push('สิบ');ro.push('sìp')}else if(d===2){th.push('ยี่สิบ');ro.push('yîi sìp')}else{th.push(NUM_TH[d]+'สิบ');ro.push(NUM_RO[d]+' sìp')}}
  else if(p===0){if(d===1&&n>=10){th.push('เอ็ด');ro.push('èt')}else{th.push(NUM_TH[d]);ro.push(NUM_RO[d])}}
  else{th.push(NUM_TH[d]+NUM_UNIT[p][0]);ro.push(NUM_RO[d]+' '+NUM_UNIT[p][1])}}
 return {th:th.join(''),ro:ro.join(' ')}}
const THAI_DIGITS='๐๑๒๓๔๕๖๗๘๙',toThaiDigits=n=>String(n).replace(/\d/g,d=>THAI_DIGITS[d]);
let extraId=null,extraQuiz=null;
function openExtra(id){extraId=id;extraQuiz=null;view='extra';render();window.scrollTo(0,0)}
const xSay=(th,ro,ja)=>`<div class="ex-say"><button class="w-audio" onclick="speakThaiText('${th}')" aria-label="${th}を再生">${icon('audio')}</button><span class="ex-th" lang="th">${th}</span><b class="ex-ro">${ro}</b>${ja?`<span class="ex-ja">${ja}</span>`:''}</div>`;
const EXTRAS={
 numbers:{title:'数字',lead:'0〜100万までの数え方、タイ数字、順番・数え方・値段・電話番号の言い方。',body:()=>`
 <section class="ex-sec"><h2>0〜10</h2><div class="ex-grid">${NUM_TH.map((t,i)=>xSay(t,NUM_RO[i],String(i))).join('')}${xSay('สิบ','sìp','10')}</div></section>
 <section class="ex-sec"><h2>11〜99：十の位と一の位を並べる</h2><p>「十」は <b>สิบ</b>。12は สิบสอง、30は สามสิบ のように並べます。<b>2つだけ例外</b>があります。</p>
 <ul class="ex-rules"><li><b>一の位の1は <span lang="th">เอ็ด</span>（èt）</b>：11 สิบเอ็ด、21 ยี่สิบเอ็ด、101 หนึ่งร้อยเอ็ด。</li><li><b>20台は <span lang="th">ยี่สิบ</span>（yîi sìp）</b>：สองสิบ とは言いません。</li></ul>
 <div class="ex-grid">${[11,12,19,20,21,25,30,47,99].map(n=>{const x=thaiNumber(n);return xSay(x.th,x.ro,String(n))}).join('')}</div></section>
 <section class="ex-sec"><h2>大きな数：万と十万に専用の語がある</h2><p>日本語と違い、<b>1万</b>と<b>10万</b>にそれぞれの語があります。百以上は หนึ่ง を付けて言うのがふつうです（หนึ่งร้อย）。</p>
 <div class="ex-grid">${[[100,'百'],[1000,'千'],[10000,'万'],[100000,'十万'],[1000000,'百万']].map(([n,j])=>{const x=thaiNumber(n);return xSay(x.th,x.ro,`${n.toLocaleString()}（${j}）`)}).join('')}</div>
 <p class="ex-note">組み合わせ：大きい単位から順に読みます。</p><div class="ex-grid">${[250,1500,2026,35000,120000,2500000].map(n=>{const x=thaiNumber(n);return xSay(x.th,x.ro,n.toLocaleString())}).join('')}</div></section>
 <section class="ex-sec"><h2>タイ数字</h2><p>値段表・カレンダー・公文書などでは、アラビア数字の代わりに<b>タイ数字</b>も使われます。</p><div class="ex-digits">${[...THAI_DIGITS].map((d,i)=>`<span><b lang="th">${d}</b><small>${i}</small></span>`).join('')}</div><p class="ex-note">例：<span lang="th">${toThaiDigits(2569)}</span> = 2569（タイの仏暦。西暦2026年）</p></section>
 <section class="ex-sec"><h2>使い方</h2>
 <h3>数える：名詞＋数＋類別詞</h3><p>物を数えるときは、数のあとに<b>類別詞</b>（物の種類ごとの数え方）を付けます。</p>${xSay('กาแฟสองแก้ว','kaa fɛɛ sɔ̌ɔng kɛ̂ɛo','コーヒー2杯')}${xSay('ไข่สามใบ','khài sǎam bai','卵3個')}
 <h3>順番：ที่＋数</h3>${xSay('ที่หนึ่ง','thîi nʉ̀ng','1番目・1位')}${xSay('ที่สอง','thîi sɔ̌ɔng','2番目')}
 <h3>値段：数＋บาท</h3>${xSay('ห้าสิบบาท','hâa sìp bàat','50バーツ')}${xSay('สองร้อยบาท','sɔ̌ɔng rɔ́ɔi bàat','200バーツ')}
 <h3>半分：ครึ่ง</h3>${xSay('ครึ่ง','khrʉ̂ng','半分')}
 <h3>電話番号：1桁ずつ読む</h3><p>電話番号は1桁ずつ読みます。2は สาม（3）と聞き間違えないように <b><span lang="th">โท</span>（thoo）</b>と言うことがよくあります。0は ศูนย์。</p>${xSay('ศูนย์แปดหนึ่ง','sǔun pɛ̀ɛt nʉ̀ng','081…')}
 </section>
 <section class="ex-sec ex-quiz-sec"><h2>確認テスト</h2>${extraQuizView()}</section>`},
 sounds:{title:'発音・声調',lead:'5つの声調、母音の長さ、息の強さ、詰まる音。アプリのローマ字の読み方もここで確認できます。',body:()=>`
 <section class="ex-sec"><h2>5つの声調</h2><p>タイ語は音の高さの動き（声調）で意味が変わります。このアプリのローマ字では、<b>母音の上の記号</b>で声調を表します。</p>
 <table class="ex-table"><thead><tr><th>声調</th><th>記号</th><th>音の動き</th><th>例</th></tr></thead><tbody>
 <tr><td>平声</td><td>なし（a）</td><td>ふつうの高さで平らに</td><td>${xSay('มา','maa','来る')}</td></tr>
 <tr><td>低声</td><td>à</td><td>低めで平らに</td><td>${xSay('ใหม่','mài','新しい')}</td></tr>
 <tr><td>下声</td><td>â</td><td>高く始めて下げる</td><td>${xSay('ไม่','mâi','〜ない')}</td></tr>
 <tr><td>高声</td><td>á</td><td>高めで少し上がる</td><td>${xSay('ม้า','máa','馬')}</td></tr>
 <tr><td>上声</td><td>ǎ</td><td>低く下げてから上げる</td><td>${xSay('หมา','mǎa','犬')}</td></tr></tbody></table>
 <p class="ex-note">聞き比べ：${xSay('ไม่','mâi','〜ない')}${xSay('ไม้','máai','木')}${xSay('ไหม','mǎi','〜ですか')}</p></section>
 <section class="ex-sec"><h2>母音の長さ</h2><p>短い母音と長い母音で別の語になります。ローマ字では<b>長い母音を2つ重ねて</b>書きます（a / aa）。</p>${xSay('เข้า','khâo','入る（短い）')}${xSay('ข้าว','khâao','ご飯（長い）')}</section>
 <section class="ex-sec"><h2>息の強さ（有気音・無気音）</h2><p><b>kh・ph・th</b> は息を強く出す音、<b>k・p・t</b> は息をほとんど出さない音です。日本語の「カ・パ・タ」はその中間なので、意識して分けましょう。th は英語の th ではなく「息の強いタ」です。</p>
 ${xSay('ไก่','kài','鶏（息なし）')}${xSay('ไข่','khài','卵（息あり）')}${xSay('ตา','taa','目（息なし）')}${xSay('ถาม','thǎam','尋ねる（息あり）')}</section>
 <section class="ex-sec"><h2>詰まる音で終わる語</h2><p>語末の <b>-k・-t・-p</b> は、口の形だけ作って音を出しません（「ック」「ット」「ップ」の最後を言わない感じ）。</p>${xSay('หก','hòk','6')}${xSay('แปด','pɛ̀ɛt','8')}${xSay('กลับ','klàp','帰る')}</section>
 <section class="ex-sec"><h2>日本語にない音</h2><ul class="ex-rules"><li><b>ng</b>（語頭）：「ング」を1音で。${xSay('งู','nguu','蛇')}</li><li><b>ʉ</b>：口を横に引いたまま「ウ」。${xSay('เสือ','sʉ̌ʉa','虎')}</li><li><b>ə</b>：口を軽く開けたあいまいな「ウ／ア」。${xSay('เดิน','dəən','歩く')}</li><li><b>ɛ</b>：口を大きく開けた「エ」。${xSay('แม่','mɛ̂ɛ','母')}</li><li><b>ɔ</b>：口を大きく開けた「オ」。${xSay('พ่อ','phɔ̂ɔ','父')}</li></ul>
 <p class="ex-note">くだけた会話では r を l で発音したり（ร→ล）、kr・pr などの r を落としたりすることがよくあります。文字の読み方と声調の決まり方は「文字」で学べます。</p></section>`}
};
function extraQuizNew(){const pool=[11,15,20,21,37,48,99,100,101,250,999,1500,2026,10000,35000,120000];const qs=shuffle(pool).slice(0,6).map(n=>{const others=shuffle(pool.filter(x=>x!==n)).slice(0,3);return {n,choices:shuffle([n,...others])}});extraQuiz={qs,i:0,ok:0,picked:null}}
function extraQuizView(){if(!extraQuiz)return `<p>数字を見て、正しい読み方を選びます（6問）。</p><button class="btn" onclick="extraQuizNew();render()">確認テストを始める</button>`;const q=extraQuiz.qs[extraQuiz.i];if(!q)return `<p class="ex-score">${extraQuiz.ok} / ${extraQuiz.qs.length} 問正解</p><button class="btn" onclick="extraQuizNew();render()">もう一度</button>`;
 return `<div class="ex-q"><div class="ex-q-top">${extraQuiz.i+1} / ${extraQuiz.qs.length}</div><div class="ex-q-num">${q.n.toLocaleString()}</div><div class="ex-q-choices">${q.choices.map(c=>{const x=thaiNumber(c),st=extraQuiz.picked===null?'':c===q.n?' is-right':c===extraQuiz.picked?' is-wrong':'';return `<button class="option${st}" ${extraQuiz.picked!==null?'disabled':''} onclick="extraPick(${c})"><span lang="th">${x.th}</span><small>${x.ro}</small></button>`}).join('')}</div>${extraQuiz.picked!==null?`<button class="btn" onclick="extraQuiz.i++;extraQuiz.picked=null;render()">次へ →</button>`:''}</div>`}
function extraPick(c){const q=extraQuiz.qs[extraQuiz.i];extraQuiz.picked=c;if(c===q.n)extraQuiz.ok++;const x=thaiNumber(q.n);if(typeof speakThaiText==='function')speakThaiText(x.th,false,true);render()}
function extraView(){const x=EXTRAS[extraId];if(!x)return course();return `<button class="textbtn back" onclick="go('course')">← 文法に戻る</button><article class="ex-ch"><div class="eyebrow">番外編</div><h1>${x.title}</h1><p class="ex-lead">${x.lead}</p>${x.body()}</article>`}
function extrasCards(){return `<section class="ex-cards" aria-label="番外編"><div class="section-head"><h2>番外編</h2></div><div class="ex-card-row">${Object.entries(EXTRAS).map(([id,x])=>`<button class="ex-card" onclick="openExtra('${id}')"><b>${x.title}</b><small>${x.lead}</small></button>`).join('')}</div></section>`}
