# GCSE English Language Paper 1 Question 2 Self-Marker (GitHub Pages v12)

This rebuild is specifically hardened for **GitHub Pages**. The previous package depended on runtime loading of external browser libraries and a fetched JSON rules file. This version keeps the same six-file structure, but the live page now runs from the local files alone.

## What was changed to make it work on GitHub Pages

- removed the external CDN script dependency from the page
- embedded the live rule set directly into `config.js` as well as keeping `rules.json` for reference/editing
- made `app.js` use embedded rules first, then fall back to `rules.json` only if needed
- kept everything as plain static HTML/CSS/JS so it can be published directly from a repo branch

## Files

- `index.html` — the single page UI
- `app.js` — the marker engine and UI logic
- `config.js` — the question, extract, calibration set, and embedded live rules
- `rules.json` — editable JSON copy of the rules
- `styles.css` — styling
- `README.md` — this setup guide

## GitHub Pages setup

1. Create a repository.
2. Upload these files to the repository root.
3. In **Settings → Pages**, set the publishing source to your branch and the **root** folder.
4. Wait for GitHub Pages to publish the site.

GitHub Pages publishes static HTML, CSS, and JavaScript files directly from a repository. It does not run server-side Python or Flask.

## Editing the question later

Change the content in `config.js`:

- `questionPrompt`
- `sourceExtract`
- content groups / quote bank / calibration answers

If you also change rules, update both the embedded rules inside `config.js` and the standalone `rules.json` copy so they stay in sync.

## Calibration

The page still includes the built-in 50-case internal calibration runner from the previous version.
