# GCSE English GitHub Pages Quiz · calibrated v2

This is the improved **GitHub Pages** version of the GCSE English self-marking quiz.

## Files

- `index.html` – the page students open
- `styles.css` – the styling
- `config.js` – the extract, question, and marker vocabulary you can swap easily
- `app.js` – the browser-based marking logic

## What changed in v2

This version is stricter than the first one.

It now tries to reward:

- **range across the extract**
- **short, precise evidence**
- **actual links between evidence, method, and effect**
- **developed analytical sentences**
- **contrast / shift comments**

It now tries to penalise:

- **retelling**
- **long copied chunks from the extract**
- **buzzword stuffing**
- **generic filler such as “this is effective”**

It also gives:

- a **central mark**
- a **likely mark range**
- a **confidence rating**
- a **sentence-by-sentence audit**

## What to edit

Open **`config.js`** and edit the section marked:

- `EASY TO SWAP STARTS HERE`
- `EASY TO SWAP ENDS HERE`

The main things to change are:

- `questionPrompt`
- `sourceExtract`
- `indicativeContentGroups`
- `highValueReferences`
- `salientExtractTerms`

If you change the extract a lot, also update these supporting lists so the marker stays accurate:

- `effectTerms`
- `genericEmptyPhrases`
- `methodTerms`
- `sentenceTerms`

## How to publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload **all files in this folder** to the root of the repository.
3. On GitHub, open the repository.
4. Go to **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose your branch, usually **main**, and choose the root folder **/**.
7. Save it.
8. Wait for GitHub to publish the site.

After that, the student link will normally look like:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/`

## How to test the marker yourself

Open the site, paste in a sample answer, and click **Mark my answer**.

You can also open the browser console and run:

`GCSEMarker.analyseAnswer("your test answer here")`

That returns the full diagnostic object so you can inspect why a mark was given.

## Notes about accuracy

This is still a **rule-based** marker. It is not AI and it is not a human examiner.

The improvement is that it now behaves more like a **best-fit training marker** instead of a keyword counter. It is best used for:

- self-checking
- revision practice
- quick formative feedback
- teacher moderation support

A teacher should still moderate important marks.
