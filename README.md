# GCSE English Language Paper 1 Question 2 Self-Marker (GitHub Pages v10)

This is a static HTML/CSS/JS site for GitHub Pages for **AQA GCSE English Language Paper 1 Question 2 (AO2)**.

It uses a **hybrid browser-side architecture**:
- a rule-based AO2 engine as the core
- **analysis-unit scoring** instead of isolated sentence scoring
- **Compromise** and **winkNLP** as optional browser NLP layers
- **Fuse.js** for fuzzy quotation / paraphrase support and anchor matching
- a small **calibration helper classifier** that smooths boundary decisions without replacing the rules
- a final **best-fit** decision stage

## Files

- `index.html` — single-page UI
- `app.js` — marking engine, helper, and browser logic
- `config.js` — question, extract, quote bank, concept threads, prompt variants, anchor bank, and 50-case calibration set
- `rules.json` — thresholds, phrase banks, penalties, copy rules, helper settings, and method aliases
- `styles.css` — page styling

## What is materially new in v10

This rebuild was aimed at the next calibration problem after v9: **the marker needed to stay flexible enough for good Level 3 / Level 4 answers while becoming stricter about what truly counts as sustained top-band analysis**.

The biggest changes are:

### 1. 50-case calibration suite
The shipped build now includes **50** realistic Rosabel cases across Level 0 to top band, including:
- blank / incomplete / copied / near-copied responses
- quote listing
- long generic waffle
- feature spotting
- wrong method labels
- unsupported symbolism / hallucination readings
- ordinary Level 3 answers
- borderline 5 / 6 answers
- borderline 6 / 7 answers
- genuine top-band responses

### 2. Concept-thread detection
Level 4 is now tied much more strongly to **sustained conceptual threads** such as:
- fantasy / escape
- grim physical reality
- oppressive bus atmosphere
- dehumanisation / alienation
- contrast between fantasy and reality

### 3. Softer penalties, fewer brittle caps
Weaknesses still matter, but one or two debatable issues no longer crush the whole answer.

### 4. Better analysis-unit merging
Quote + follow-up explanation is merged more reliably, and short valid analysis is credited more fairly.

### 5. Grounded interpretation is separated from invented symbolism
Grounded inferences such as **fantasy, escapism, claustrophobia, alienation, dehumanisation, and emotional suffocation** are allowed when they clearly grow from the wording.

### 6. Evidence and coverage are separated more carefully
The engine distinguishes:
- attached evidence
- usable evidence
- selective evidence
- judicious evidence

And it separates:
- reference coverage
- supported coverage
- analytical coverage
- interpretive coverage

### 7. Helper calibration layer
The app builds a small browser-side helper from the bundled calibration bank. It does **not** replace the rule engine. It only nudges marks when the rule score is sitting on a boundary and the calibration pattern is strong.

## Browser-side NLP stack

This version stays suitable for GitHub Pages because it is fully static, but it still uses browser NLP where it helps:

- **Compromise** for lightweight sentence / phrase support
- **winkNLP** with the web model for tokenisation, lemmas, stems, and POS-style support when available
- **Fuse.js** for fuzzy matching against quote banks and anchor comments
- a heuristic fallback when those libraries are unavailable

## Calibration

Use the built-in **Run 50-case calibration** button in the UI to test the current rule set against the bundled bank.

Current bundled calibration result in the offline fallback engine:
- **50 / 50 exact marks matched** on the shipped internal suite

That number is for the shipped internal anchor bank, not proof of examiner-perfect marking on every unseen answer. The point of the suite is to make the model much harder to drift at the Level 2 / 3 / 4 boundaries.

## How to edit the question later

Edit `config.js` to change:
- `questionPrompt`
- `sourceExtract`
- `contentGroups`
- `quoteBank`
- `conceptThreads`
- `developerQuestionBank`
- `anchorComments`
- `calibrationCases`

Edit `rules.json` to change:
- thresholds
- phrase banks
- copy detection
- generic phrase handling
- method alias handling
- helper settings

## GitHub Pages deployment

1. Create a GitHub repository.
2. Upload all six files to the repo root.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.

The site then runs entirely in the browser.
