# Pixel Tools

Pixel Tools is a lightweight, static site (pure HTML/CSS/JS) for pixel-art workflows: image-to-pixel conversion, spritesheet building, simple resizing, and a 2D tile map editor.

## Folder structure

- `index.html` – app shell
- `style.css` – responsive styling
- `app.js` – converter + spritesheet + resize logic
- `map-editor.html` – 2D tile map editor page
- `map-editor.js` – tile map editor logic

## Run locally

Use a tiny static server from the repo root:

```bash
python3 -m http.server
```

Then open:

- `http://localhost:8000`

## Deploy

This is a static site—deploy by uploading the repo contents to any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.).
