# Design sources

| Folder | What |
|---|---|
| `screens/` | Python generators for every mockup on the design canvas (`s01.py` … `s17.py`, shared `common.py`, logo SVGs). They write `.dc.html` artboards for the canvas at https://claude.ai/artifact/CRJ4a1sUUDktx9zDk26baG. Image and font URLs in them are `/_blob/<id>` assets that only resolve inside that canvas, so treat these as a spec of each screen (layout, copy, states), not something to open locally. |
| `poses/process.py` | Green-screen → transparent 768×768 WebP for `assets/characters/`. See the docstring; `--all` re-processes everything in `poses/sources/`. |
| `poses/sources/` | The original green-screen generations, named `<roaster>-<pose>.png` (35 used + 3 unused alternates). ~60 MB, git-ignored; keep a backup outside the repo. |
| `tools/logo/` | Scripts that built the wordmark, loop mark and Satoshi-based logo variants. |
| `tools/roasts/build.py` | Built `src/roasts/core.en.json` and `core.ta-Latn.json` from the handwritten roast lists. |
| `tools/app-icon/` | HTML templates used to render the Loop/Lupe adaptive-icon foregrounds and app-icon previews (render with Playwright; `shot.js`). |

Specs for everything are in `docs/handoff/`.
