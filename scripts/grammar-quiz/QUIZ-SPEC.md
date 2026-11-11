# Thai Steps — grammar check questions (10 per lesson)

The app is a Thai course for Japanese speakers. Each grammar lesson ends with a check quiz; a learner
who answers all 10 correctly completes the lesson. Each lesson already has 1 question
(`existingQuestion`); you write **9 more** per lesson.

## Input
`lessons-N.json`: lessons in study order with title, pattern, intro, points, examples (th/ro/ja) and the
existing question. Lessons build on each other in that order; a question may use grammar from the same
or earlier lessons only.

## Output: `quiz-N.json`
```json
{
  "1": {
    "existingRo": ["phǒm dʉ̀ʉm kaafɛɛ", "...", "..."],      // ro for each Thai option of existingQuestion, same order (null for non-Thai options)
    "questions": [                                            // exactly 9
      {"kind":"order|blank|meaning|choose|translate|fix",
       "q":"Japanese instruction/question",
       "sentence":{"th":"ผม ＿＿ กาแฟ","ro":"phǒm ＿＿ kaafɛɛ","ja":"私はコーヒーを飲む"},   // optional stimulus; ja optional
       "options":[{"th":"ดื่ม","ro":"dʉ̀ʉm"},{"th":"...","ro":"..."},{"th":"...","ro":"..."}],  // exactly 3; or {"ja":"..."} options
       "answer":0,                                            // index 0-2
       "why":"Japanese explanation, 1–2 sentences, saying why the answer is right and what is wrong with the others"}
    ]
  }
}
```

## Rules
- Test **this lesson's grammar point** (word order, which particle/word, where it goes, meaning differences,
  polite/negative/question forms, classifiers…). At most 2 of the 9 may be plain vocabulary/translation.
  Mix kinds: order (choose the correct word order), blank (fill ＿＿), meaning (what does this sentence mean),
  choose (which sentence fits the situation), translate (ja→th), fix (which one is natural/correct).
- Exactly **one** correct option. Distractors must be clearly wrong for a grammar reason a learner can see
  from the lesson (wrong order, wrong particle, wrong meaning) — never "also acceptable" Thai. If a native
  speaker could accept a distractor, change it.
- Thai must be natural modern Thai, short (≤ 10 words), everyday vocabulary, no real people.
- Every Thai string gets tone-marked romanization in the app's system (read SPEC.md "Romanization";
  ro-lexicon.tsv has the app's readings of common words — use them). Romanization matches the Thai word
  for word, separated by spaces like the examples. ＿＿ stays ＿＿ in ro.
- Japanese is natural; options in Japanese only for meaning questions.
- Do not copy the existing question or the lesson examples verbatim; vary vocabulary.
- Vary the position of the correct answer (0/1/2 roughly evenly).
