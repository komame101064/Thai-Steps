# Thai Steps — Thai script course data

A Thai-script course for Japanese beginners inside the Thai Steps app. Romanization follows the app system
(SPEC.md "Romanization"; ro-lexicon.tsv has readings of common words). Japanese text is natural and short.

## Curriculum (8 stages, about 20 lessons; 4–6 new symbols per lesson)
1. はじめての字: mid consonants ก จ ด ต บ ป อ + long vowels า ี ู เ แ โ (read CV syllables, mid tone).
2. 母音を増やす: ื ำ ไ ใ เา and vowels written before/above/below the consonant.
3. 高子音: ข ฉ ถ ผ ฝ ส ห (class changes tone: live syllable → rising).
4. 低子音: pairs ค ช ท พ ฟ ซ ฮ, then sonorants ง น ม ย ร ล ว.
5. 末子音と短母音: finals k/t/p/ng/n/m/i/u (which letters give which final), short vowels ะ ิ ึ ุ ็, live vs dead syllables.
6. 声調記号: ่ ้ ๊ ๋ and the full tone table (class × live/dead × long/short × mark).
7. 特殊なつづり: leading ห/อ (หมา, อยู่), clusters (กร ปล คว…), ์, ๆ, ฯ, rarer letters (ฐ ฑ ฒ ณ ศ ษ ฬ ญ ฎ ฏ ภ ธ ฆ ฌ ฉ), Thai digits ๐–๙.
8. 実践: reading real everyday words (all letters/rules learned).

## Output: script-data.json
{
 "consonants":[{"ch":"ก","name":"ก ไก่","nameRo":"kɔɔ kài","nameJa":"ニワトリ","cls":"mid|high|low","initial":"k","final":"k|t|p|ng|n|m|i|u|null","note":"optional Japanese"}],  // all 44 (include obsolete ฃ ฅ with a note)
 "vowels":[{"form":"–า","ro":"aa","length":"long|short","note":"位置など"}],   // standard vowel forms incl. ำ ไ ใ เา ฤ
 "toneMarks":[{"mark":"่","name":"ไม้เอก","nameRo":"mái èek"}],
 "digits":[{"ch":"๑","value":1,"ro":"nʉ̀ng"}],
 "lessons":[{
   "id":"s01","stage":1,"stageTitle":"はじめての字","title":"中子音（1）ก ด ต","intro":"Japanese, 2–4 sentences, beginner-friendly",
   "newConsonants":["ก","ด","ต"],"newVowels":["–า","–ี"],"newMarks":[],
   "points":["short Japanese tips"],
   "readings":[{"th":"กา","ro":"kaa","ja":"カラス","tone":"mid"}],   // 8–15 items: syllables or words using ONLY symbols taught so far; ja optional for nonsense syllables (prefer real words)
   "toneQuestions":[{"th":"ขา","tone":"rising","why":"Japanese"}]  // from stage 3 on: 3–6 items
 }]
}
Tone names: mid, low, falling, high, rising.

## Hard rules
- A lesson's readings/toneQuestions may only use consonants, vowels, marks introduced in that lesson or earlier.
  Write a check script that enforces this (decompose each th into code points; treat ฤ/ๆ/์ etc. as symbols).
- Every reading's ro and tone must be correct for the spelling (verify each against the tone rules; use ro-lexicon.tsv for real words).
- Prefer real, common words; mark nonsense practice syllables with "ja":"" and keep them few.
- All 44 consonants and the common vowels must be taught by the end.
