# Brand: the mark and its seasonal icons

The mark is a landscape time card with a red stamp on its corner: the record, and the seal that makes it final. Everything is drawn by [`scripts/brand/make-icon.py`](../scripts/brand/make-icon.py) from flat shapes, so it stays sharp from a 16 px favicon to the 512 px store icon.

| Classic | Halloween | Christmas | Lunar New Year | Spring Bloom |
| --- | --- | --- | --- | --- |
| ![Classic](../store/seasons/classic-512.png) | ![Halloween](../store/seasons/halloween-512.png) | ![Christmas](../store/seasons/xmas-512.png) | ![Lunar New Year](../store/seasons/lunar-512.png) | ![Spring Bloom](../store/seasons/spring-512.png) |
| everyday | bat, jack-o'-lantern | holly, snowflake, star | lantern, sparkles | cherry blossoms |

The seasonal details appear only on app icons. The in-app logo (`public/brand/mark.svg`) stays plain all year.

## Switching to a season

**Play Store listing icon only** (no app update): upload `store/seasons/<season>-512.png` under Grow users → Store presence → Main store listing → App icon. Switch back to `classic-512.png` afterwards.

**Everywhere** (launcher icon on phones, website, home-screen icon):

```bash
python3 scripts/brand/make-icon.py --season halloween   # classic | halloween | xmas | lunar | spring
node scripts/brand/render-icons.mjs                     # needs Playwright
```

Commit, deploy the website, and upload a new Android build (Actions → Android → Run workflow with the next version code). Run the same two commands with `--season classic` when the occasion is over.

`public/brand/season.txt` records which season is currently in use.

## Adding an occasion

Add a palette to `PALETTES` and its details to `details()` in `make-icon.py`. Keep details in the empty corners (top right, bottom left), flat, and recognisable at 48 px.
