# Thai Steps — vocabulary expansion: second-pass review

You are the independent reviewer for entries another author wrote. Learners (Japanese speakers
studying Thai) will be quizzed on whatever you accept, so a wrong reading, meaning or
translation that you let through is a real error in the product. Do not rubber-stamp. Equally,
do not rewrite entries that are correct: change only what is wrong.

Read `SPEC.md` (authoring rules, romanization system) first. Then, for every item with
`"action":"add"` in your part file, check independently:

1. **Headword reading (`ro`)** — derive it yourself from the Thai spelling, syllable by syllable
   (consonant class, live/dead syllable, vowel length, tone mark, linking syllables) before
   looking at the author's. Compare with the author's `ro` and with the source `readingHint`
   in the input file. The hint uses another romanization and is sometimes simply wrong
   (missing syllables, wrong word); the Thai spelling and real standard pronunciation decide.
2. **House convention** — if the headword's component words exist in `ro-lexicon.tsv`, the
   reading must match how the lexicon writes them (the lexicon writes some phonetically short
   vowels by spelled length, e.g. ต้อง `tɔ̂ɔng`, ห้อง `hɔ̂ɔng`, but แต่ง `tɛ̀ng`, เช่น `chên`,
   น้ำ `náam` alone and `nám` in compounds). Where the lexicon is silent, standard
   pronunciation with spelled vowel length is acceptable; do not "fix" a defensible choice.
3. **Meanings** — is each `ja` what the Thai word actually means in modern usage? Is the first
   sense the most common one? Is anything taught that is really rare, wrong, or belongs to a
   different word? Is the Japanese natural and unambiguous? `pos` and `category` plausible?
4. **Register** — literary / royal / formal / dated / colloquial labels honest? A royal or
   archaic word must not be presented as everyday vocabulary.
5. **Example** — natural, grammatical Thai that a native would accept; contains the headword in
   *this* sense; `ro` correct for every word (grep `ro-lexicon.tsv` / `example-reference.tsv`
   for known words) and one syllable per Thai syllable; `ja` and `en` are accurate
   translations. For `"origin":"source"` the Thai must stay verbatim — if the sentence is
   unsuitable, replace it with your own and set `"origin":"authored"`.
6. **Suitability** — ethnic slurs or otherwise offensive headwords with little learner value:
   reject. Factual claims in notes that you cannot stand behind: remove the claim.

The files `flags-NN.txt` list mechanical disagreements for your part (tone, vowel length or
syllable count vs. the source hint; headword reading not found inside the example reading).
Each flagged item needs an explicit decision in your `issues` text, but most errors will not
be flagged — check every item.

## Output: `review-NN.json` — a JSON array with one object for **every** item in the part

```json
{"id": "tl-2xxxx", "verdict": "ok", "issues": []}
{"id": "tl-2xxxx", "verdict": "fix", "issues": ["例文のroで ได้ の声調が誤り"], "fixed": { ...the complete corrected entry, same schema as the part file... }}
{"id": "tl-2xxxx", "verdict": "reject", "issues": ["理由"]}
```

- Author-skipped items: `{"id": ..., "verdict": "ok", "issues": []}` (they stay skipped).
- `fix`: `fixed` is the whole entry (id, th, action "add", ro, kind, category, senses…) with
  only the necessary corrections. `issues` (Japanese, short) says what was wrong.
- `reject`: you are not confident the entry can be made correct, or it should not be taught.
  When unsure whether a reading or meaning is right, reject rather than accept.
- `ok`: you checked everything above and would stand behind the entry as written.
