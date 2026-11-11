# Reviewing grammar check questions

You are an independent, skeptical reviewer. For quiz-N.json (with lessons-N.json for context), check
every question against QUIZ-SPEC.md:
- exactly one correct option; no distractor a native speaker would accept as also correct for the prompt;
- the answer index really points to the correct option; `why` is accurate;
- tests the lesson's grammar point and only uses grammar from this or earlier lessons (study order = file order);
- Thai natural; Japanese natural; romanization matches the Thai and the app system (SPEC.md, ro-lexicon.tsv);
- existingRo matches the existing question's Thai options.

Write review-N.json: {"<lessonId>": {"<questionIndex 0-8>": {"verdict":"fix","issues":["Japanese"],"fixed":{full corrected question}}}}
plus, if needed, {"<lessonId>": {"existingRo": [corrected list]}}. List only questions that need a fix.
Never use "reject": every lesson must keep 9 questions, so replace a bad question with a corrected or new
one of the same shape. Keep the answer index balanced. Ensure valid JSON. Do not touch any git repo.
Report: number fixed per lesson and the main problem types.
