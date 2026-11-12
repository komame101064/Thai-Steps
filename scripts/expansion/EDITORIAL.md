# Thai Steps — editorial additions (words chosen by the editors, not from the frequency list)

Read `SPEC.md` first: the romanization system, the meaning/example rules and the quality bar all
apply unchanged. This file lists only what differs for editorial batches
(`scripts/expansion/editorial-XXX/`).

## Input: `input.json`

Items `{id, th, deck, hint}`. `deck` is `general` (the main word list) or `slang` (the separate
colloquial/slang list). `hint` is the editors' intended meaning in Japanese — a starting point,
not a fact. Check that the word really exists in this spelling and really means this in modern
Thai. If it does not, or you cannot tell, skip it (`"action":"skip"` with a Japanese reason).
Never invent or "fix" a word into something that exists but means something else.

editorial-001/002 are about sexual and romantic vocabulary for adult learners: describe it plainly and
accurately, like a good dictionary, with honest register labels. No euphemism in the Japanese
glosses beyond what the Thai itself carries, and no sensationalism. Slurs and words that can be
offensive must say so in `note`.

editorial-003 is about recent vocabulary (generations, SNS, online life, scams, recent social
topics) and current youth/net slang. Loanwords: give the spelling Thais actually use most and
mention common variants in `note`. Slang that is a passing fad or already dated must say so in
`note` (e.g. 「2020年前後の流行語。今は少し古い」). Do not register a fad you cannot confirm.

## Output entries

Same shape as SPEC.md, with these differences:

- No `readingHint`/`thaiExamples` in the input: every example is your own, `"origin":"authored"`.
  Examples are natural adult-conversation or news/health sentences, 4–12 words, no real people.
- Top-level `"frequency"`: integer 1–10, your estimate of how often a learner will meet the word
  in everyday adult conversation and media (10 = very often). Be conservative.
- `general` deck entries: exactly the SPEC.md schema (category, register pairs, pos lists).
  Medical/formal words use 改まった表現; colloquial ones 口語.
- `slang` deck entries:
  - `category`: one of スラング｜下ネタ, スラング｜恋愛・人間関係, スラング｜誘う・返す, スラング｜差別的表現,
    スラング｜一般, スラング｜ネット・SNS, スラング｜ほめる・反応, スラング｜友達の日常, スラング｜気持ち.
  - `adult`: true for sexual content, false otherwise.
  - `tags`: subset of ["colloquial","vulgar","slang"].
  - each sense: `sourceSense`, `ja`, `pos` (SPEC list), `speechStyle` — one of
    口語, 口語・スラング, 粗い口語, 口語・性的な話題, かなり粗い・性的な俗語, 標準語・性的な話題, 差別的な罵り（理解用）, ネット表記 —
    and a required Japanese `note` (who says it, to whom, how strong it is, what it is not).
    `en` may be omitted. The example has `th`, `ro`, `ja`, `context` (a short Japanese scene,
    e.g. 「友人同士の恋愛話」) and `"origin":"authored"`. No `use`/`registerTags` on slang senses.
  - Set phrases (定型文) such as มีแฟนยัง are `"kind":"expression"`, pos 定型表現; the example
    shows the phrase inside a short exchange or sentence.

editorial-004 is fad slang (流行語) from any period — 1990s to now. For each item that you add,
the note must say roughly when it was popular and whether it now sounds dated, and you also
write the era separately (see the task) so the app can show 「流行語・2010年代前半」. Skip an
item when you cannot place it in time with reasonable confidence.


editorial-005 is everyday concrete NOUNS that the frequency list missed: food, household items, clothes,
body, jobs, school/office, places in town, transport, sports, IT, animals, nature, money, time words,
and countries / world cities / Thai places / languages / nationalities. All are general-deck entries
(SPEC.md schema; category from SPEC's list, e.g. 食べ物・飲み物, 家・場所, 社会・制度, 移動・道案内,
体・健康, 趣味・メディア, 仕事・学習). Countries, cities, languages and nationalities are wanted here
(not skipped as proper nouns). Use the spelling Thais write most; mention variants in note. Frequency
1–10 is your estimate of how often a learner meets the word in daily life. Skip anything that is a
brand, a person, or that you cannot confirm.

editorial-006 is everyday conversational SET PHRASES (定型文) of two or more words, for the フレーズ section:
greetings and leave-takings, thanks and apologies, introductions, asking for help or repetition, shopping,
ordering food, directions and taxis, hotel, time, feelings and reactions, invitations, wishes.
- Every entry: `"kind":"expression"`, first sense `pos` 定型表現, `category` 挨拶・会話 (or お金・買い物 /
  移動・道案内 / 食べ物・飲み物 / 時間 when clearly better). One sense is normal; add a second only if the
  phrase really has two common uses.
- `ja` is the natural Japanese equivalent a Japanese speaker would say in the same situation
  (「お会計お願いします」), not a word-by-word gloss. Mention in `note` who says it (男性/女性 because of
  ครับ/ค่ะ, 親しい相手, 店員に…) and any politeness caveat. Phrases with 〜 slots (ผมชื่อ〜) say so in `ja`.
- Register: most are 標準語 / []; casual forms (กินข้าวยัง, รอแป๊บนึง) are 口語 / ["colloquial"]; formal
  ones (แล้วพบกันใหม่, ไม่ทราบครับ) 改まった表現 / ["formal"].
- The example shows the phrase used naturally, ideally as a short exchange in one line
  (「A: ขอบคุณมาก B: ไม่เป็นไร」is fine as `th` "ขอบคุณมาก ไม่เป็นไร" only if natural; otherwise a sentence).
  The headword must appear exactly as spelled (spaces inside the headword are part of it).
- `ro` of the headword: one syllable per Thai syllable, no punctuation; a space in the Thai headword
  is just a syllable boundary.
- `frequency` 1–10: how often a learner hears/uses it in daily life in Thailand.
- Skip a candidate that is not something Thais actually say as a set phrase, sounds unnatural or
  translated from Japanese, or duplicates another candidate with no difference worth teaching.
