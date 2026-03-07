# GCSE English Language Paper 1 Question 2 Self-Marker (GitHub Pages v6)

This is a static HTML/CSS/JS site for GitHub Pages. It is designed for AQA GCSE English Language Paper 1 Question 2 (AO2) and uses a stricter rule-based engine than the earlier versions.

## Files

- `index.html` — the single-page UI
- `app.js` — the rule engine and browser logic
- `config.js` — the swap-friendly question, extract, quote bank, and calibration set
- `rules.json` — the editable rule set for penalties, phrase lists, method aliases, and thresholds
- `styles.css` — the page styles

## What changed in this version

This version was rebuilt to address the biggest weaknesses from the earlier builds:

- copied extract detection is now explicit
- Level 0 / Level 1 boundaries are stricter
- evidence only counts when it is actually used in analysis
- coverage only counts when a content area is analysed, not merely mentioned
- generic effect phrases are penalised
- unsupported symbolism / abstract over-interpretation is penalised
- repeated hedging and contradictions are penalised
- explicit methods only score when they are plausible **and** linked to effect
- full marks are much harder to reach than 7/8

## Core rule-engine checks

### 1. Input triage
The engine first checks whether the response is:

- blank
- incomplete
- not really an answer
- copied extract
- near-copied / paraphrased extract

A copied extract is treated as **Level 0 / 0 marks**.

### 2. Sentence classification
Each sentence is classified into one of these categories:

- `insightful_analysis`
- `clear_analysis`
- `simple_comment`
- `feature_spotting`
- `generic_comment`
- `reference_only`
- `quote_dump`
- `unsupported_interpretation`
- `copied_extract`

### 3. Evidence logic
The system separates:

- **reference coverage** — parts of the extract mentioned
- **analytical coverage** — parts of the extract actually analysed
- **usable evidence** — quotations used in clear / insightful sentences
- **selective evidence** — short, purposeful quotations rather than dumped copying

### 4. Accuracy logic
The model now downgrades or caps the response when it detects:

- unsupported symbolism
- invented meanings not grounded in the wording
- contradictions
- repeated uncertainty (`maybe`, `might`, `could be`, etc.)
- misapplied method labels

### 5. Level mapping
Level 4 is only available if the response is consistently grounded and accurate.

That means:

- at least two genuinely insightful analytical sentences
- selective evidence
- low genericity
- no major misinterpretation / contradiction / method misuse

## Built-in calibration runner
The UI includes a calibration button.

The current build ships with **7 calibration cases**:

- strong borderline Level 4
- clear strong response
- feature spotting / keyword stuffing
- quote listing / Level 1
- long generic waffle
- concise strong answer
- copied extract should be Level 0

## How to change the question later

Edit `config.js`:

- `questionPrompt`
- `sourceExtract`
- `contentGroups`
- `quoteBank`
- `calibrationCases`

Then edit `rules.json` if you want to change:

- uncertainty phrases
- unsupported-interpretation phrases
- generic-effect penalties
- method aliases
- copy thresholds
- level thresholds

## GitHub Pages deployment

1. Create a GitHub repository.
2. Upload all five files plus `rules.json` to the repo root.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.

Your student-facing site will then run entirely in the browser.

## Notes

- This is still a **rule-based estimate**, not a real human examiner.
- It is designed to be **stricter**, especially against copied extract, generic waffle, and unsupported interpretation.
- The calibration set is included so you can keep testing and refining the rules.
