# GCSE English Language Paper 1 Question 2 Self-Marker (GitHub Pages v11)

This is a static HTML/CSS/JS site for **AQA GCSE English Language Paper 1 Question 2 (AO2)**.

It stays fully suitable for **GitHub Pages** because it runs entirely in the browser and uses no backend or external marking API.

## Files

- `index.html` — single-page UI
- `app.js` — rule engine, analysis-unit builder, calibration helper, and browser logic
- `config.js` — question, extract, quote bank, concept threads, anchor comments, developer prompts, and 50 realistic calibration cases
- `rules.json` — thresholds, penalties, copy checks, fuzzy-matching settings, phrase banks, and method rules
- `styles.css` — page styling

## Browser-side stack

This build uses:
- **winkNLP** for tokenisation, sentence splitting, and light linguistic support when available
- **Compromise** for lightweight phrase / sentence heuristics
- **Fuse.js** for fuzzy quotation, paraphrase, and anchor matching
- a small **calibration helper** built from the bundled answer bank

The fallback engine still works if one or more browser NLP libraries do not load.

## What changed in v11

This rebuild was tuned against the latest calibration issue: the system still needed to stop over-rewarding weak or merely competent answers, while still allowing genuinely strong Level 4 responses through.

The biggest changes are:

### 1. Stronger weak-answer detection
The marker is now stricter when an answer is mainly:
- quotation mention without explanation
- shallow everyday evaluation
- generic “this shows / this makes” phrasing
- feature spotting without precise meaning
- broad coverage without real analysis

### 2. Better separation between weak, simple, clear, developed, and perceptive comments
The engine now distinguishes more carefully between:
- **shallow comment**
- **simple but valid analysis**
- **clear analysis**
- **developed analysis**
- **perceptive analysis**

### 3. Softer penalties, but stricter boundaries
This build still avoids brittle one-fault hard caps, but it is now firmer at the key boundaries:
- **4 / 5** — weak relevant answers are less likely to drift into Level 3
- **6 / 7** — clear, fluent answers are less likely to drift into Level 4
- **7 / 8** — full marks now needs sustained top-band quality rather than isolated insight

### 4. Better use of evidence and coverage
Evidence is separated into:
- attached
- usable
- selective
- judicious

Coverage is separated into:
- reference
- supported
- analytical
- interpretive

This stops quote presence or broad mention from inflating the score on its own.

### 5. Analysis-unit grouping
Adjacent quotation + explanation sentences are merged more reliably so normal GCSE “quote then explain” writing does not get under-marked.

### 6. Grounded interpretation stays allowed
The system still allows valid grounded inference such as:
- fantasy / escapism
- claustrophobia
- dehumanisation
- alienation
- emotional suffocation

But it is stricter about unsupported invention, wrong method labels, and obvious over-interpretation.

## Calibration

The shipped build includes a **50-case** calibration bank in `config.js`.

Current bundled calibration result in the offline fallback engine:
- **50 / 50 exact marks matched** on the internal 50-case suite

That result is for the bundled calibration bank included in the project, not proof of examiner-perfect marking on every unseen answer. The goal of the bank is to keep the algorithm stable at the weak / competent / strong boundaries for this exact Rosabel Q2 task.

## Editing the live question later

Edit `config.js` to change:
- `questionPrompt`
- `sourceExtract`
- `contentGroups`
- `quoteBank`
- `conceptThreads`
- `anchorComments`
- `calibrationCases`

Edit `rules.json` to change:
- thresholds
- phrase banks
- copy detection
- generic phrase handling
- method handling
- helper settings

## GitHub Pages deployment

1. Create a GitHub repository.
2. Upload all six files to the repo root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.

The site then runs entirely in the browser.
