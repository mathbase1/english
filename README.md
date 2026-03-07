# GCSE English Language Paper 1 Question 2 Self-Marker (GitHub Pages v7)

This is a static HTML/CSS/JS site for GitHub Pages. It is designed for **AQA GCSE English Language Paper 1 Question 2 (AO2)** and uses a stricter rule-based marker than the earlier builds.

## Files

- `index.html` — the single-page UI
- `app.js` — the marking engine and browser logic
- `config.js` — the swap-friendly question, extract, quote bank, content groups, and calibration set
- `rules.json` — the editable rule set for thresholds, penalties, phrase lists, and method aliases
- `styles.css` — the page styles

## What changed in this version

This rebuild was aimed at the biggest remaining weakness: the marker was still too generous around the **Level 3 / Level 4 boundary**.

This version is stricter about all of the following:

- **clear** analysis versus genuinely **perceptive** analysis
- **relevant** evidence versus **selective** or **judicious** evidence
- **coverage** versus real **analytical range**
- **literal** comments versus developed interpretation
- **generic** exam phrasing versus precise AO2 explanation

## Main changes in the engine

### 1. Descriptor guardrails
The marker now prevents inflated descriptor language.

It will not call evidence **judicious** unless the answer is already in the top band and the quotation use is genuinely selective.

It will not call analysis **perceptive** unless the response reaches the highest standard.

### 2. Stricter sentence classification
Each sentence is classified into one of these categories:

- `insightful_analysis`
- `clear_analysis`
- `simple_comment`
- `literal_comment`
- `feature_spotting`
- `generic_comment`
- `reference_only`
- `quote_dump`
- `unsupported_interpretation`
- `copied_extract`

This is designed to stop vague or literal sentences from being counted as strong AO2.

### 3. Evidence is separated from coverage
The engine now distinguishes between:

- **reference coverage** — parts of the extract mentioned
- **supported coverage** — parts of the extract commented on with some explanation
- **analytical coverage** — parts of the extract analysed clearly or insightfully

It also separates:

- **attached evidence** — quotation present and linked to some comment
- **usable evidence** — quotation used in clear / insightful analysis
- **selective evidence** — short, purposeful quotation use

This stops the system from confusing breadth with quality.

### 4. Literal / generic penalties
The engine now actively downgrades or caps answers when it detects:

- generic openings such as “The writer uses language to show…”
- empty reader-effect phrases such as “creates an effect”
- literal comments such as “this shows it is unpleasant”
- quote listing without development
- method spotting without effect or meaning

### 5. Accuracy checks
The marker now penalises:

- unsupported symbolism
- invented abstract meaning
- repeated hedging (`might`, `maybe`, `could`, etc.)
- contradiction
- misused terminology

If those problems appear, Level 4 is blocked.

### 6. Stronger copied-extract detection
The input triage now checks for:

- copied extract
- near-copied extract
- paraphrased extract
- blank response
- incomplete response
- non-answer response

A copied extract is treated as **Level 0 / 0 marks**.

## Boundary logic

The build now treats the top band much more cautiously.

### 7–8 marks only if the answer is consistently high quality
To reach **Level 4**, the response must show:

- multiple genuinely interpretive sentences
- selective evidence
- analytical coverage across the extract
- low genericity
- accurate, grounded explanation

A response that is only **clear**, even if quite strong, should stay at **5–6**.

## Calibration runner

The UI includes a calibration button.

This version ships with **10 calibration cases**, including:

- borderline Level 4 responses
- strong Level 3 responses
- feature spotting
- generic waffle
- quote listing
- unsupported speculation
- copied extract / Level 0

The current build is calibrated to match all 10 expected marks exactly.

## How to change the question later

Edit `config.js`:

- `questionPrompt`
- `sourceExtract`
- `contentGroups`
- `quoteBank`
- `calibrationCases`

Edit `rules.json` if you want to change:

- uncertainty phrases
- generic-effect penalties
- method aliases
- unsupported-interpretation triggers
- copy thresholds
- mark thresholds

## GitHub Pages deployment

1. Create a GitHub repository.
2. Upload all six files to the repo root.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.

The site will then run entirely in the browser.

## Notes

- This is still a **rule-based estimate**, not a human examiner.
- It is intentionally stricter than the earlier versions.
- The calibration set is included so you can keep testing and refining the rules.
