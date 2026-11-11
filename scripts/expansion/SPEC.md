# Thai Steps — vocabulary expansion: authoring spec

Thai Steps is a Thai-learning web app for **Japanese speakers**. Each word shows Thai script,
tone-marked romanization, Japanese meanings, and one example sentence per meaning.
You are turning raw dictionary candidates into finished learner entries.

Accuracy matters more than coverage. A wrong reading or meaning shipped to learners is worse
than a skipped word. If you are not confident about a word's meaning or pronunciation,
set `"action":"skip"` with a reason. Do not guess.

## Ids

The `id` in authoring and review files is `tl-(20000 + source rank)` and is only an authoring key.
`scripts/build-expansion.py` publishes each entry as `tl-(40000 + source rank)`, because the slang
bank already uses some `tl-2xxxx` ids and ids are the key of learners' saved records.

## Input (one JSON array per part)

Each item: `id`, `th` (headword), `sourceRank`, `readingHint` (a *different* romanization
system from the source list — use it only as a hint for syllables, tone and vowel length;
never copy it), `enGlosses` (LEXiTRON-style English glosses, one per line, often redundant or
including rare senses), `thaiExamples` (source Thai sentences/compounds, may be long, literary,
or just compound words).

## Output: a JSON array, one object per input item, same order, same `id` and `th`

```json
{
  "id": "tl-21406", "th": "ซัก", "action": "add",
  "ro": "sák",
  "kind": "word",
  "category": "一般語彙",
  "senses": [
    {"sourceSense": 1, "ja": "洗濯する・洗う（衣類を）", "en": "to wash (clothes), launder",
     "pos": "動詞", "use": "よく使う意味", "registerTags": [], "speechStyle": "標準語（口語限定ではない）",
     "example": {"th": "เราจะซักผ้าทุกวันอาทิตย์", "ro": "rao cà sák phâa thúk wan aa thít",
                 "ja": "私たちは毎週日曜日に洗濯をします。", "en": "We do the laundry every Sunday.",
                 "origin": "source"}},
    {"sourceSense": 2, "ja": "問いただす・質問を重ねる", "en": "to question, interrogate",
     "pos": "動詞", "use": "よく使う別の意味", "registerTags": [], "speechStyle": "標準語（口語限定ではない）",
     "example": {"th": "ตำรวจซักเขาหลายชั่วโมง", "ro": "tam rùuat sák khǎo lǎai chûua moong",
                 "ja": "警察は彼を何時間も問いただした。", "en": "The police questioned him for hours.",
                 "origin": "authored"}}
  ]
}
```

Skipped item: `{"id": "...", "th": "...", "action": "skip", "skipReason": "日本語で理由"}`.

### Fields

- `kind`: `"word"` or `"expression"` (fixed multi-word phrase).
- `category`: exactly one of: 一般語彙, 日常の動作, 家・場所, 時間, 性質・状態, 食べ物・飲み物, 人・家族,
  体・健康, 自然・天気・色, 量・程度・比較, お金・買い物, 仕事・学習, 場所・前置詞, 接続表現, 挨拶・会話,
  数え方, 趣味・メディア, 社会・制度, 文法・時制, 代名詞・呼びかけ, 指示表現, 数字, 助詞・語気, 疑問詞,
  移動・道案内, 否定. Use 一般語彙 when nothing fits well.
- `senses`: 1 to 3, most common modern meaning first. Merge near-duplicate glosses into one
  sense. Drop obscure/technical senses you would not teach. `sourceSense` is 1,2,3 in order.
  If the most common real-world meaning is missing from `enGlosses` but you are certain of it,
  you may add it.
- `ja`: short dictionary-style Japanese like the samples (「強調する・重点を置く」). Add a brief
  parenthetical when needed to disambiguate. Natural Japanese, not a translation of every gloss.
- `en`: short English gloss for the sense (verbs as "to ...").
- `pos`: exactly one of: 名詞, 動詞, 形容詞・状態語, 副詞, 間投詞, 接続詞, 前置詞, 助詞, 代名詞, 類別詞,
  定型表現, 接頭辞, 数詞.
- `use`: first sense `よく使う意味`; later senses `よく使う別の意味` or `少なめの用法`.
- Register — pick the pair that fits how the word is really used today:
  - `"標準語（口語限定ではない）"` / `[]` (default)
  - `"口語"` / `["colloquial"]`
  - `"改まった表現"` / `["formal"]` (official, written-leaning, polite-formal)
  - `"文語"` / `["literary"]` (literary, poetic, archaic-leaning written words)
  - `"王室の敬語"` / `["royal"]` (ราชาศัพท์)
  - `"古めの表現"` / `["dated"]`
  - `"粗い口語"` / `["colloquial","vulgar"]`
  Many candidates come from written corpora: label literary/royal/formal words honestly rather
  than presenting them as everyday vocabulary.
- `note` (optional, Japanese, one sentence): only for a real usage caveat (e.g. bound element
  used mainly in compounds; royal use only; alternate reading).

### Example sentence (one per sense, all different)

- Must contain the headword **exactly as spelled in `th`** and show *that* sense.
- Prefer a `thaiExamples` sentence **verbatim** (`"origin":"source"`) when it is a complete,
  natural sentence, uses that sense, and is reasonably short (about 4–14 words). Do not edit
  source sentences; if you would need to change one, write your own instead.
- Otherwise write a simple, natural, modern sentence yourself (`"origin":"authored"`),
  4–10 words, everyday content, no names of real people. For royal/literary words, use a
  context where the word is genuinely used.
- `ja`: natural Japanese translation ending with 。 (or ？). `en`: plain English translation.
- A bare compound word is not an example sentence.

### Romanization (`ro`) — the app's own system. Follow it exactly.

Syllables are separated by single spaces (every Thai syllable, including light linking
syllables: สนุก → `sà nùk`, มหาวิทยาลัย → `má hǎa wít thá yaa lai`). No hyphens, no capitals,
no final punctuation in `ro`. Thai ๆ repeats the syllable(s).

- Initials: k(ก) kh(ข ค ฆ) ng(ง) c(จ) ch(ฉ ช ฌ) s(ซ ศ ษ ส) y(ย ญ) d(ด ฎ) t(ต ฏ)
  th(ถ ท ธ ฐ ฑ ฒ) n(น ณ) b(บ) p(ป) ph(ผ พ ภ) f(ฝ ฟ) m(ม) r(ร) l(ล ฬ) w(ว) h(ห ฮ);
  initial อ (glottal stop) is not written (อาหาร → `aa hǎan`).
  Clusters: kr kl kw khr khl khw pr pl phr phl tr.
- Vowels (short / long): a aa, i ii, ʉ ʉʉ, u uu, e ee, ɛ ɛɛ, o oo, ɔ ɔɔ, ə əə.
  Diphthongs: iia (เ-ีย), ʉʉa (เ-ือ), uua (-ัว); short ia/ʉa/ua only for the rare short forms.
  ai (ไ- ใ- -ัย), aai (-าย), ao (เ-า), aao (-าว), ui, ooi, ɔɔi, əəi, iu, eo, eeo, ɛɛo, iiao, uuai, ʉʉai.
  -ำ is `am`.
- Finals: k t p ng n m, and i / o for glides (ขาย `khǎai`, ขาว `khǎao`). Dead finals are
  always k t p regardless of the Thai letter.
- Tone marks go on the **first vowel letter** of the syllable: mid = no mark (`maa`),
  low = grave (`mài`), falling = circumflex (`mâi`), high = acute (`mái`), rising = caron (`mǎi`).
  For ʉ ə ɛ ɔ use combining marks (ʉ̀ ʉ̂ ʉ́ ʉ̌, ə̀ …, ɛ̀ …, ɔ̀ …).
- Derive the reading from Thai spelling rules (consonant class, live/dead syllable, vowel
  length, tone mark) and confirm against `readingHint` (its tone diacritics mean the same as
  ours; `:` marks a long vowel there). If your derivation and the hint disagree on tone or
  length and you cannot tell which is right, skip the word or mention it in `note`.
- For words inside example sentences, look up existing readings instead of re-deriving:
  `ro-lexicon.tsv` (Thai word, reading, meaning; ~5,000 words) and `example-reference.tsv`
  (existing example sentences with readings). `grep` them. Reuse those readings exactly
  (e.g. จะ `cà`, ก็ `kɔ̂ɔ`, ไม่ `mâi`, ได้ `dâai`, เขา `khǎo`, ฉัน `chǎn`, ครับ `khráp`, น้ำ `náam`).

### When to skip

- You are unsure of the meaning or the reading.
- The headword is only a spelling fragment, an obvious data error, or a proper name with no
  learner value.
- It can only be explained through rare/technical senses.

Bound elements that are common in compounds (e.g. ราช-) may be added with `pos` 接頭辞 or 名詞 and a
`note`, with an example sentence that contains the element inside a real word.

## Quality bar

Work through the items one at a time. For every entry, re-read the Thai example you chose and
check: headword present, sense matches, `ro` has one syllable per Thai syllable with correct
tones, Japanese is natural. Write valid JSON (UTF-8, no comments, no trailing commas).

## Conventions confirmed in batch-001 review (follow them)

- น้ำ alone is `náam`, but `nám` as the first element of compounds (น้ำตา nám taa, น้ำมัน nám man, น้ำพริก nám phrík).
- เจ้า alone is `câao`; in compounds follow the lexicon entry if it has the compound, otherwise `câao`.
- Syllables spelled with ‑่อง/‑้อง etc. keep the spelled long vowel as the lexicon does (ต้อง tɔ̂ɔng, ช่อง chɔ̂ɔng, ซ่อง sɔ̂ɔng).
- The source readingHint is often wrong (dropped syllables, a different word, wrong tone). The Thai spelling and the standard pronunciation decide.
- Royal vocabulary needs correct royal grammar in examples (เสด็จไปทรงเปิด…, no bare ทรง + plain verb with ท่าน); do not translate His Highness as 陛下.
- Japanese translations must not add meaning the Thai lacks (no added も, そうです, 分だけ …).


## Proper nouns (from batch-004)

Country names, their capitals and major cities, Thai provinces that learners commonly meet (Bangkok, Chiang Mai, Phuket…), languages and nationalities are useful vocabulary: author them (category 社会・制度 or 移動・道案内, pos 名詞) with a natural example. Still skip people's names, historical kingdoms, temples, mythological names and obscure places.
