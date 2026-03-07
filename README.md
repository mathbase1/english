# GCSE English GitHub Pages Quiz · calibrated v5

This is the stricter **GitHub Pages** version of the GCSE English self-marking quiz for **AQA English Language Paper 1 Question 2 (AO2)**.

## Files

- `index.html` – the page students open
- `styles.css` – the styling
- `config.js` – the extract, question, rubric vocabulary, unsupported-interpretation rules, and calibration set
- `app.js` – the browser-based marking logic

## What changed in v5

This rebuild is designed to be much stricter about **accuracy**.

It now tries to reward:

- grounded quotation use
- specific effect or meaning
- accurate analysis rather than style
- correct method identification only when linked to effect
- concise answers when the quality is genuinely high

It now tries to penalise:

- quote dumping
- generic “reader effect” waffle
- feature-spotting
- unsupported interpretation
- invented symbolism
- contradiction and repeated uncertainty
- misapplied terminology

## Main diagnostic layers

The marker now separates:

- **coverage** from **analysis**
- **evidence** from simple quotation presence
- **generic comment** from grounded explanation
- **correct method use** from guessed or misapplied method labels

The page also shows:

- grounded sentence count
- developed sentence count
- generic sentence count
- unsupported interpretation count
- misapplied method count
- confidence reasons

## Built-in calibration set

`config.js` includes a calibration set based on six sample answers.

Use the **Run built-in calibration** button on the page to compare:

- expected mark
- actual mark
- delta
- estimated level
- confidence

This is useful for testing drift before you give the site to students.

## What to edit

Open **`config.js`** and edit the section marked:

- `EASY TO SWAP / RECALIBRATE STARTS HERE`
- `EASY TO SWAP / RECALIBRATE ENDS HERE`

The main things to change are:

- `questionPrompt`
- `sourceExtract`
- `contentGroups`
- `highValueReferences`
- `salientExtractTerms`

If you change the extract, also recalibrate:

- `supportedMeanings` inside each content group
- `specificEffectTerms`
- `genericEffectPhrases`
- `methodRules`
- `unsupportedInterpretationPhrases`
- `calibrationSet`

## How to publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload **all files in this folder** to the root of the repository.
3. On GitHub, open the repository.
4. Go to **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose your branch, usually **main**, and the root folder **/**.
7. Save it.
8. Wait for GitHub to publish the site.

After that, the site link will normally look like:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/`

## Browser-side NLP

This version attempts to load **Compromise** from a CDN in `index.html`.

If Compromise loads successfully, the page can use its browser-side sentence tooling.
If it does not load, the marker still works using the built-in heuristic fallback.

## How to test the marker yourself

Open the site, paste in a sample answer, and click **Mark my answer**.

You can also open the browser console and run:

`GCSEMarker.analyseAnswer("your test answer here")`

To run the built-in calibration set in the console:

`GCSEMarker.runCalibration()`

## Important accuracy note

This is still a **rule-based** training marker, not a human examiner.

The improvement in v5 is that it is much stricter about:

- unsupported claims
- generic phrasing
- quote dumping
- incorrect method labels
- speculative interpretation

A teacher should still moderate important marks.
