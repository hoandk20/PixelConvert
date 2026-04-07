# Exam Practice (Vanilla)

This repo turns the HTML dumps in `document/` into a scalable practice website using **pure HTML/CSS/JS**.

## Folder structure

- `index.html` – app shell
- `style.css` – responsive styling
- `app.js` – SPA logic (routing, session, grading, review)
- `data/outsystems-techlead/exams.json` – normalized dataset (generated)
- `data/exams.schema.json` – JSON Schema for the dataset
- `data/outsystems-techlead/example.exams.json` – tiny example dataset (generated)
- `scripts/parse_udemy_dumps.py` – converts `document/Dump*.html` → `data/outsystems-techlead/exams.json`
- `document/` – source dumps (input)

## Run locally

Browsers often block `fetch()` when opening `index.html` directly via `file://`.

Use a tiny static server from the repo root:

```bash
python3 -m http.server
```

Then open:

- `http://localhost:8000`

## Regenerate JSON from the dumps

```bash
python3 scripts/parse_udemy_dumps.py
```

Outputs:

- `data/outsystems-techlead/exams.json`
- `data/outsystems-techlead/example.exams.json`

## Add a new exam set later

### Option A (recommended): add a new dump and re-run the parser

1. Drop a new file in `document/` matching `Dump*.html` (e.g. `Dump07.html`)
2. Run:
   ```bash
   python3 scripts/parse_udemy_dumps.py
   ```
3. Refresh the app; the new set appears automatically on the homepage.

### Option B: edit `data/exams.json` directly

Add a new item to `exams[]` in `data/outsystems-techlead/exams.json` following `data/exams.schema.json`.

Minimal required fields per exam:

- `id`
- `title`
- `questions[]`

Minimal required fields per question:

- `id`
- `promptHtml`
- `options[]` (each with `id`, `html`, `text`)
- `correctOptionIds[]`
