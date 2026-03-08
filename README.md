# GCSE English Language Paper 1 Question 2 Self-Marker (GitHub Pages v9)

This is a static HTML/CSS/JS site for GitHub Pages for **AQA GCSE English Language Paper 1 Question 2 (AO2)**.

It uses a **hybrid browser-side architecture**:
- a rule-based AO2 engine as the core
- analysis-unit scoring instead of isolated sentence scoring
- **Compromise** and **winkNLP** as optional browser NLP layers
- a small **calibration helper classifier** that smooths boundary decisions without replacing the rules
- a final **best-fit** decision stage

## Files

- `index.html` — single-page UI
- `app.js` — marking engine, hybrid helper, and browser logic
- `config.js` — question, extract, quote bank, content groups, prompt variants, and calibration set
- `rules.json` — thresholds, phrase banks, penalties, copy rules, helper settings, and method aliases
- `styles.css` — page styling

## What is materially new in v9

This rebuild was aimed at the next calibration problem after v8: **the marker needed to become more sophisticated without slipping back into brittle hard caps**.

The biggest changes are:

### 1. Softer penalties, fewer brittle caps
Weaknesses still matter, but one or two debatable issues no longer crush the whole answer.

### 2. Best-fit is now explicit
The engine now scores rubric dimensions first, then asks what the response is **mostly doing** before setting the level.

### 3. Analysis-unit logic is stronger
Quote + follow-up explanation is merged more reliably, and short valid analysis is credited more fairly.

### 4. Unsupported interpretation is retrained
Grounded inferences such as **fantasy, escapism, claustrophobia, alienation, dehumanisation, and emotional suffocation** are allowed when they clearly grow from the wording.

### 5. Serious method misuse is separated from loose terminology
A wrong technical label can still hurt the mark, but it no longer automatically destroys an otherwise sound point.

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

### 7. Hybrid helper classifier
The app now builds a small browser-side calibration helper from the bundled calibration bank. It does **not** replace the rule engine. It only nudges marks when the rule score is sitting on a boundary and the calibration pattern is strong.

## Browser-side NLP stack

This version keeps the site suitable for GitHub Pages because it remains fully static, but it still uses browser NLP where it helps:

- **Compromise** for lightweight sentence / phrase support
- **winkNLP** with the web model for tokenisation, lemmas, stems, and POS-style support when available
- a heuristic fallback when those libraries are unavailable

## Calibration

This release ships with a wider internal calibration bank and a built-in calibration runner in the UI.

Current bundled calibration result:

- **32 / 32 exact marks matched** on the shipped internal suite

That suite includes:
- blank / incomplete / copied / near-copied responses
- quote listing
- long generic waffle
- feature spotting
- wrong method labels
- unsupported hallucination / nightmare style readings
- ordinary Level 3 answers
- borderline 5 / 6 answers
- borderline 6 / 7 answers
- genuine 8-mark responses

This is still a **rule-based estimate**, not a human examiner, but v9 is much stronger on the Level 2 / 3 / 4 boundaries than the earlier builds.

## How to edit the question later

Edit `config.js` to change:
- `questionPrompt`
- `sourceExtract`
- `contentGroups`
- `quoteBank`
- `developerQuestionBank`
- `calibrationCases`

Edit `rules.json` to change:
- thresholds
- phrase banks
- copy detection
- generic phrase handling
- method alias handling
- helper classifier settings

## GitHub Pages deployment

1. Create a GitHub repository.
2. Upload all six files to the repo root.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.

The site then runs entirely in the browser.
