> **In the terminal:** this is the Asciiverse edition. Install and start it
> with [av](https://asciiverse.sh): `av install sleeping-beauty`, then pick
> it in av. To build it yourself: `make -f asciiverse/Makefile`, then
> `./out/sleeping-beauty`. What changed, and how it runs, is in
> [PATCHES.md](PATCHES.md); the author's permission in
> [PERMISSION.md](PERMISSION.md).

# Sleeping Beauty

![Screenshot](sleeping-beauty.png)

This is a [7DRL](http://7drl.org/) game. To play it, just open https://ondras.github.io/sleeping-beauty/ in your browser.

## Technology

HTML, CSS (LESS), JavaScript (ES2015).

  - Building:
```
$ npm install
$ npm run build
```

The font used is [Metrickal](https://github.com/robey/metrickal-typeface).
