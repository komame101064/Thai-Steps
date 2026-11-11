// Grammar curriculum: chapters and the order of lessons inside them, in a common textbook sequence.
// Lesson IDs never change (they key saved progress); this file only decides where each lesson appears.
const CURRICULUM=[
 {name:'文の土台',label:'まずは語順をつかむ',level:'初級',icon:'foundation',desc:'語順・状態・「〜です」・所有・存在を短い文で。',ids:[1,2,4,3,31,5]},
 {name:'否定と質問',label:'会話の往復をつくる',level:'初級',icon:'question',desc:'否定・質問・数え方で、聞いて答える基本。',ids:[6,7,8,9,10]},
 {name:'時の表し方',label:'いつ・もう・まだを伝える',level:'初級',icon:'time',desc:'時制に頼らないタイ語の時間表現。',ids:[11,12,13,14,15,33]},
 {name:'気持ちとお願い',label:'自分の意図を伝える',level:'初中級',icon:'chat',desc:'希望・可能・必要・依頼・禁止と、文末の語気。',ids:[16,17,18,32,19,20,34,30]},
 {name:'つなぐ・比べる',label:'一文から説明へ',level:'初中級',icon:'link',desc:'逆接・理由・条件・比較・変化で文をつなぐ。',ids:[35,22,23,21,36]},
 {name:'文を組み立てる',label:'節と態を使いこなす',level:'中級',icon:'spark',desc:'補助動詞、名詞を説明する節、内容の引用、推測、使役と受け身。',ids:[45,24,25,28,26,27,29]},
 {name:'書き言葉でつなぐ',label:'文章とニュースを読む',level:'上級',icon:'course',desc:'目的・時・結果・譲歩・補足説明の改まった形。',ids:[37,38,39,40,41]},
 {name:'表現を磨く',label:'言い回しの幅を広げる',level:'上級',icon:'star',desc:'比例・追加・「〜であろうと」・名詞化・改まった依頼。',ids:[42,47,43,44,46]},
];
modules.splice(0,modules.length,...CURRICULUM.map(({ids,...m})=>m));
CURRICULUM.forEach((c,m)=>c.ids.forEach(id=>{lessons[id-1].m=m}));
orderedLessons.splice(0,orderedLessons.length,...CURRICULUM.flatMap(c=>c.ids).map(id=>lessons[id-1]));
// Words registered after readings.js / vocabulary.js built their lookup lists.
readingKeys.splice(0,readingKeys.length,...Object.keys(readingLexicon).sort((a,b)=>b.length-a.length));
vocabularyKeys.splice(0,vocabularyKeys.length,...Object.keys(vocabulary).filter(k=>typeof OVERRIDE_ONLY_WORDS==='undefined'||!OVERRIDE_ONLY_WORDS.has(k)).sort((a,b)=>b.length-a.length));
