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

This batch is about sexual and romantic vocabulary for adult learners: describe it plainly and
accurately, like a good dictionary, with honest register labels. No euphemism in the Japanese
glosses beyond what the Thai itself carries, and no sensationalism. Slurs and words that can be
offensive must say so in `note`.

## Output entries

Same shape as SPEC.md, with these differences:

- No `readingHint`/`thaiExamples` in the input: every example is your own, `"origin":"authored"`.
  Examples are natural adult-conversation or news/health sentences, 4–12 words, no real people.
- Top-level `"frequency"`: integer 1–10, your estimate of how often a learner will meet the word
  in everyday adult conversation and media (10 = very often). Be conservative.
- `general` deck entries: exactly the SPEC.md schema (category, register pairs, pos lists).
  Medical/formal words use 改まった表現; colloquial ones 口語.
- `slang` deck entries:
  - `category`: one of スラング｜下ネタ, スラング｜恋愛・人間関係, スラング｜誘う・返す, スラング｜差別的表現.
  - `adult`: true for sexual content, false otherwise.
  - `tags`: subset of ["colloquial","vulgar","slang"].
  - each sense: `sourceSense`, `ja`, `pos` (SPEC list), `speechStyle` — one of
    口語, 口語・スラング, 粗い口語, 口語・性的な話題, かなり粗い・性的な俗語, 標準語・性的な話題, 差別的な罵り（理解用） —
    and a required Japanese `note` (who says it, to whom, how strong it is, what it is not).
    `en` may be omitted. The example has `th`, `ro`, `ja`, `context` (a short Japanese scene,
    e.g. 「友人同士の恋愛話」) and `"origin":"authored"`. No `use`/`registerTags` on slang senses.
  - Set phrases (定型文) such as มีแฟนยัง are `"kind":"expression"`, pos 定型表現; the example
    shows the phrase inside a short exchange or sentence.
