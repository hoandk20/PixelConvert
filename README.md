# Pixel Tools Studio

Static web app for batch image-to-pixel-art conversion and spritesheet generation.

## Run locally

Open `index.html` directly in a browser or start a static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Features

- Drag and drop or select multiple images at once
- Batch convert to `32x32`, `16x16`, or `64x64`
- Support for `contain`, `cover`, and `stretch`
- Transparent or solid background output
- Live preview for original images and pixel outputs
- Download individual PNG files or batch download all
- Build spritesheets and export JSON in custom or Phaser/TexturePacker-friendly formats
