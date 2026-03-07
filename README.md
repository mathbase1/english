# GCSE English Language Paper 1 Question 2 Self-Marker (GitHub Pages v8)

This is a static HTML/CSS/JS site for GitHub Pages. It is designed for **AQA GCSE English Language Paper 1 Question 2 (AO2)** and uses a more balanced rule-based marker than the earlier builds: stricter about genuine Level 4, but less punitive on solid Level 3 answers.

## Files

- `index.html` — the single-page UI
- `app.js` — the marking engine and browser logic
- `config.js` — the swap-friendly question, extract, quote bank, content groups, question variants, and calibration set
- `rules.json` — the editable rule set for thresholds, penalties, phrase lists, copy detection, and method aliases
- `styles.css` — the page styles

## Main changes in this version

This rebuild was aimed at the next big weakness after v7: the system had started to become **too harsh**, especially on competent and strong answers.

This version is designed to stay strict about **real Level 4**, while being more realistic about normal GCSE writing.

## Major algorithm changes

### 1. Analysis units instead of isolated sentences
The engine no longer relies on a rigid one-sentence-at-a-time approach.

It now builds **analysis units** by pairing a quotation sentence with the sentence immediately after it when the second sentence is clearly explanatory (for example, when it starts with `This`, `It`, `The word`, `The phrase`, etc.).

This means:
- quote → explanation is now recognised as **one analytical point**
- GCSE answers are less likely to be unfairly penalised for normal sentence structure

### 2. Softer penalties, stronger best-fit
The old system was still too mechanical and too cap-heavy.

This version replaces a lot of those hard blocks with:
- **weighted deductions**
- **best-fit floors**
- **dominant-quality judgement**

That means:
- generic wording can weaken a response without destroying the level
- one or two weaker comments do not automatically block a good answer
- the final mark is based more on what the answer is **mostly doing**

### 3. More generous recognition of grounded inference
The marker is now more willing to credit valid inference when it is clearly grounded in the text.

Examples that are now treated more fairly:
- `fairy palaces` → fantasy / imagination / brief escape / distance from wealth
- `almost stifled` → physical and emotional suffocation / oppression
- `one meaningless, staring face` → dehumanisation / alienation / loss of individuality

### 4. Better separation of evidence and coverage
The engine now separates:

#### Coverage
- **reference coverage** — parts of the extract mentioned
- **supported coverage** — parts of the extract commented on with some explanation
- **analytical coverage** — parts of the extract analysed clearly
- **interpretive coverage** — parts of the extract analysed in a developed / perceptive way

#### Evidence
- **attached evidence** — quotation linked to some comment
- **usable evidence** — quotation used in clear / developed / perceptive analysis
- **selective evidence** — short purposeful quotation use
- **judicious evidence** — reserved for top-end responses only

This stops the system from confusing:
- breadth with selectivity
- quotation presence with quotation quality

### 5. More careful treatment of generic GCSE phrasing
Generic phrasing is now split into two levels:

- **mild generic frames**  
  Example: `This shows`, `The writer uses language`, `This makes`

- **severe empty phrases**  
  Example: `creates an effect`, `helps the reader imagine`, `descriptive language`, `language techniques`

Mild generic phrasing now only creates **light downward pressure**.

Severe empty phrasing still reduces the mark more strongly.

### 6. Method handling is less trigger-happy
This version separates:
- **correct method links**
- **loose method labels**
- **serious method misuse**

So:
- `imagery` used a bit loosely will not sink a response if the actual reading is good
- `symbolism` / `simile` / `personification` used wrongly can still hurt the mark
- method naming never counts for much unless it is linked to effect and meaning

### 7. Stronger copied-extract handling remains
The engine still checks for:
- copied extract
- near-copied extract
- paraphrased extract
- blank response
- incomplete response
- non-answer response

A copied or near-copied extract with no creditworthy commentary is still treated as **Level 0 / 0 marks**.

## NLP used in the browser

This build now supports two browser-side NLP layers:

- **Compromise** for sentence handling and lightweight grammar support
- **winkNLP** (optional browser import) for tokenisation, POS tags, stems, and lemmas

If winkNLP fails to load, the app still works using the fallback heuristic engine.

## Calibration

This version ships with a broader built-in calibration set.

It now includes:
- top-band answers
- strong Level 3 answers
- low Level 3 answers
- quote-then-explain answers
- brief valid answers
- feature spotting
- generic waffle
- quote listing
- unsupported speculation
- copied extract
- blank and incomplete responses

The UI includes a **Run built-in calibration** button so you can test the rule engine instantly in the browser.

## Developer question variants

I also added a small **developer question bank** in `config.js` so you can stress-test the same extract against slightly different AO2 prompt wording.

The live page still uses one question at a time, but the extra prompt variants are included as developer test references.

## How to change the question later

Edit `config.js`:

- `questionPrompt`
- `sourceExtract`
- `contentGroups`
- `quoteBank`
- `developerQuestionBank`
- `calibrationCases`

Edit `rules.json` if you want to change:

- generic phrase penalties
- hedging severity
- unsupported interpretation triggers
- copy thresholds
- method aliases
- level thresholds
- best-fit floors

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
- The main goal of this version is better judgement around the **Level 2 / 3** and **Level 3 / 4** boundaries.
- The built-in calibration set is there so you can keep testing and refining the rules.


## Current built-in calibration result

The bundled calibration bank currently contains **20 cases** and the shipped rule set is tuned to match **20 / 20 expected marks exactly** on that internal suite.

That does **not** mean it is examiner-perfect, but it does mean the released build is calibrated against a wider spread of:
- Level 0 copied / blank / incomplete answers
- weak Level 1 / 2 answers
- borderline Level 2 / 3 answers
- strong Level 3 answers
- low Level 4 answers
- genuine 8-mark top-band answers

## What is materially new in the v8 engine

Compared with the earlier builds, this version adds:

- paired-sentence **analysis-unit** scoring instead of rigid sentence-only scoring
- a softer **best-fit** final decision stage with fewer blunt caps
- stricter separation between **attached**, **usable**, **selective**, and **judicious** evidence
- a separate **interpretive coverage** layer so coverage is not confused with insight
- more tolerant handling of **short but valid analysis**
- softer treatment of mild GCSE phrasing, but stronger penalties for empty waffle
- optional browser-side **Compromise + winkNLP** support on top of the rule engine
- a stronger top-band route so **8/8** needs genuinely sustained quality
