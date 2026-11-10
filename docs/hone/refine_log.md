# /hone run log — Reda v1.0

## Run queue
- [x] Build all-in-one app: diary + trigger patterns (#2), self-tests with photo references, treatment helper (#3)
- [x] Jeda/Cairn style: static PWA, warm paper, serif headings, bottom tabs, ID/EN, local-only, offline
- [x] Reference photos for self-tests (freely licensed, credited)
- [x] Tests (logic + flows + layout gates)
- [ ] /hone loop (frozen rubric, baseline, judge, keep-best)
- [ ] Publish GitHub repo + Pages
- [ ] Sync: portfolio card, landing page, profile README, Obsidian, cairn vibe

## Assumptions
- Assumed: name "Reda" (Indonesian: to subside/calm down, as hives do) — repo juw12/reda was free.
- Assumed: "Cairn or Jeda style" = Jeda's product shape (vanilla ES-module PWA, warm paper, serif heads, bottom tab bar, ID-first bilingual, no account) with its own palette/type so it is not a clone (design rule: never reuse font+layout+emblem combo).
- Assumed: UAS7 (public guideline instrument) instead of UCT (licensed questionnaire) for control tracking.
- Assumed: photos only from Wikimedia Commons with PD/CC0/CC BY/CC BY-SA; skipped a "solar urticaria" file carrying a third-party © watermark — sun and heat tests use drawn illustrations instead.
- Assumed: the app never recommends a dose increase on its own; it shows the guideline step and says "ask your doctor".

## Rubric (frozen before the loop)
Hard gates (checker = tests/run_tests.py + slop_check):
- G1 all logic tests pass (UAS7 sums/bands, trigger verdicts, step advice)
- G2 all flow tests pass (log → score, emergency banner, plan, dose, timer, test result, language, theme)
- G3 no horizontal overflow at 390 and 1280 on 11 routes
- G4 no text under 12 px; tap targets ≥ 32 px on Today
- G5 no console/page errors
- G6 slop_check 0 blockers
- G7 every medical number traceable to content.js sources (UAS bands, doses, test timings)

Soft criteria (0–10, anchors 4 / 7 / 10):
- C1 Usefulness for a chronic-hives patient (4: generic diary; 7: UAS7 + triggers + ladder; 10: a doctor would accept the report as-is)
- C2 Clarity & hierarchy on phone (4: crowded; 7: one obvious action per screen; 10: no second read needed)
- C3 Visual craft / not AI-looking (4: default cards; 7: coherent tokens + signature; 10: feels designed for this subject)
- C4 Trust & safety (4: claims without source; 7: sources + red flags; 10: honest uncertainty everywhere it matters)
- C5 Style fit with Jeda/Cairn family (4: unrelated; 7: same family; 10: sibling with own identity)
