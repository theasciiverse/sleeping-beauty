# Changes from upstream

This is the Asciiverse terminal edition of Sleeping Beauty, Ondřej Žára's
game for the 2017 Seven Day Roguelike Challenge, from
github.com/ondras/sleeping-beauty (the `upstream` remote; this branch,
`asciiverse`, starts from its master at `a2c1452`, 2021-04-07, with the
full history). It is here by the author's permission (`PERMISSION.md`).

**The game's own files are unchanged.** The game runs from its bundled
`app.js` (its ES2015 modules joined by Rollup and compiled by Babel, as
its `npm run build` makes it). Everything new is in `asciiverse/`, plus
this file and `PERMISSION.md`; README.md gets a note at the top on playing
it with av.

## How it works

- `asciiverse/rotty/`: rotty, our runtime for Ondřej's rot.js games (as in
  Goldfish, The Royal Wedding, The Conception, Café Havoc and Warden's
  Duty): the browser as far as these games use it, rot.js's display drawn
  into terminal cells, keys as browser events, HTML drawn into boxes. New
  for this game: what a game writes with `fillText` and `strokeRect` on a
  canvas of its own is kept, for the layout to place in cells.
- `asciiverse/game.js`: Sleeping Beauty's layout, after its CSS:
  - the title page: the title, the tower (built to the window's height, as
    the page builds it), the words, the knight, the rose and the grass, each
    where the CSS puts it, and the fun fact at the bottom;
  - the map in the top left (60% by 60%), dimmed while you fight;
  - the Game of Thorns in the top right: the game draws its board on a
    canvas, a `#` for each cell, 30 pixels apart, and a frame round the
    cursor; here each cell is three or four columns wide, the cursor's cell
    has a grey background, the cells that would match are bold, and cells
    still falling in from above wait until they are on the board;
  - the story in the bottom left, the latest at the bottom, as the page
    scrolls it there; what you have in the bottom right.
- `asciiverse/build.py`, `asciiverse/Makefile`: the page's scripts as one
  classic script, compiled with QuickJS-ng into one native binary of about
  2 MB that needs nothing to run.

## Ours

- **Keys:** as in the browser: arrows, the numpad or vim keys, with Shift
  (or Ctrl or Alt) to interact; space waits, Enter picks up and matches,
  digits answer questions. The digits 1 to 9 also walk, like the numpad,
  where no question is asked. Ctrl+C or Ctrl+Q quits.
- **A new game after dying:** the game asks to reload the page; here R
  starts a new game (the program starts itself again), and the story says
  so under its last line.
- **`--seed N`:** the game seeds rot.js with the time; with `--seed N` it
  gets N instead, so the tower is built the same each time (the preview
  uses seed 4).
- **Session log:** `sleeping-beauty.log` in the state folder
  (`$XDG_STATE_HOME/sleeping-beauty`, `~/.local/state/sleeping-beauty`,
  Application Support on macOS, `%LOCALAPPDATA%` on Windows).
  `SLEEPING_BEAUTY_LOG=debug` (or `ROTTY_LOG=debug`) records every key and
  a snapshot each second.
- The page's font is not loaded, and the map's zoom towards a fight (a
  change of font size in the browser) is left out.

## Imported

- `asciiverse/quickjs/`: QuickJS-ng 0.17.0 as in our Candy Box 2 (one
  change in `quickjs-libc.c`: a signal interrupting `poll()` no longer ends
  the event loop), MIT.
- `asciiverse/ROT-LICENSE`: rot.js's licence (BSD-3-Clause), for the
  `rot.min.js` the game bundles.

## Packaging

- `.github/workflows/release.yml`: static Linux (musl, x86-64 and ARM64),
  macOS (x86-64 and ARM64) and Windows (x86-64, MinGW) archives plus
  SHA256SUMS, on tags `*-av.*`.
- `asciiverse/package.sh`: the archive (the program, PERMISSION.md,
  PATCHES.md, the licences).
- `asciiverse/record-preview.sh`: the 100x30 catalog preview, with hub's
  castrec.py.
