// Sleeping Beauty in the terminal: how the page is laid out on the screen.
// As in the browser: the map in the top left (60% by 60%), the Game of
// Thorns in the top right, the story below the map and what you carry
// below the board. The title page keeps its pieces where the page's CSS
// puts them: the title, the tower, the words, the knight and the rose.
/* BUILD {"files": []} */

var GAME = {
    id: "sleeping-beauty",
    digitsAsNumpad: true,   // 1 to 9 also walk, like the numpad (choices still get their digit)
    idleMs: 150,
    usage: "sleeping-beauty [--seed N] [--version]\n\n" +
        "Sleeping Beauty by Ondrej Zara (7DRL 2017), in the terminal. Move with the\n" +
        "arrows, the numpad, 1 to 9 or vim keys (hjkl yubn); space waits. In\n" +
        "combat, move over the board and match with Enter. R starts a new game once\n" +
        "you have died. Ctrl+C or Ctrl+Q quits. Best at 100x30 or larger.\n" +
        "--seed N builds the same tower each time. SLEEPING_BEAUTY_LOG=debug logs\n" +
        "every key to the state folder.\n"
};

GAME.split = function () {
    var W = TERM.w, H = TERM.h;
    var mw = Math.round(W * 0.6), mh = Math.round(H * 0.6);
    return { W: W, H: H, mw: mw, mh: mh };
};

GAME.has = function (n, c) { return !!(n && n.classList && n.classList.contains(c)); };

// text lines of an element whose white space is kept (white-space: pre)
GAME.preLines = function (el) {
    var lines = [[]];
    var walk = function (n, fg, bg) {
        if (n.nodeType == 3) {
            n.data.split("\n").forEach(function (part, i) {
                if (i) lines.push([]);
                if (part) lines[lines.length - 1].push({ t: part, fg: fg, bg: bg });
            });
            return;
        }
        var f = (n.style && n.style.color) || fg, b = bg;
        // the tower's stones have a dark background, the see-through ones not
        if (n.tagName == "SPAN" && GAME.inTower && !GAME.has(n, "transparent")) b = "#222";
        if (GAME.has(n, "grass")) f = "#3c3";
        n.childNodes.forEach(function (c) { walk(c, f, b); });
    };
    walk(el, null, null);
    return lines;
};
GAME.drawRuns = function (line, x, y, fg, maxw) {
    var cx = x;
    line.forEach(function (r) {
        Array.from(r.t).forEach(function (ch) {
            if (maxw == null || cx < x + maxw) TERM.put(cx, y, ch, r.fg || fg, r.bg || null, false, r.bold);
            cx++;
        });
    });
    return cx - x;
};

// the boxes the game measures: the intro's pieces, the map
GAME.box = function (el) {
    var s = GAME.split();
    if (el.id == "intro") return { x: 0, y: 0, w: s.W, h: s.H };
    if (el.id == "map") return { x: 0, y: 0, w: s.mw, h: s.mh };
    if (GAME.has(el, "tower") || GAME.has(el, "bottom")) {
        var lines = el.textContent.split("\n"), w = 0;
        lines.forEach(function (l) { w = Math.max(w, Array.from(l).length); });
        return { x: 0, y: 0, w: w, h: lines.length };
    }
    return null;
};

GAME.css = function (n) {
    if (n.tagName == "STRONG") return { fg: n.style.color || "#fff", bold: true };
    return null;
};

// ------------------------------------------------------------ title page

GAME.intro = function (node) {
    var W = TERM.w, H = TERM.h;
    var title = node.querySelector(".title"), tower = node.querySelector(".tower");
    var text = node.querySelector(".text"), bottom = node.querySelector(".bottom"), fun = node.querySelector(".funfact");
    // the tower: 6ch from the right, its foot 4.2em (three and a half rows) up
    if (tower) {
        GAME.inTower = true;
        var tl = GAME.preLines(tower);
        GAME.inTower = false;
        var tw = 0; tl.forEach(function (l) { tw = Math.max(tw, GAME.lineLen(l)); });
        var ty = H - 4 - tl.length, tx = W - 6 - tw;
        tl.forEach(function (l, j) { if (ty + j >= 0) GAME.drawRuns(l, tx, ty + j, "#aaa"); });
    }
    // the title, 2ch in and one row down, goldenrod
    if (title) GAME.preLines(title).forEach(function (l, j) { GAME.drawRuns(l, 2, 1 + j, "goldenrod"); });
    // the knight, the rose and the grass, 3em up from the bottom
    if (bottom) {
        var bl = GAME.preLines(bottom);
        var bw = 0; bl.forEach(function (l) { bw = Math.max(bw, GAME.lineLen(l)); });
        var by = H - 2 - bl.length;
        bl.forEach(function (l, j) { GAME.drawRuns(l, W - 1 - bw, by + j, "#aaa"); });
    }
    // the words, from 16ch to 28ch from the right, 6.6em up
    if (text) {
        var w = Math.max(20, W - 16 - 28);
        var lines = PANEL.lines(text, w, { fg: "#aaa" });
        var y0 = H - 6 - lines.length;
        lines.forEach(function (l, j) { GAME.drawRuns(l.map(function (r) { return { t: r.t, fg: r.fg, bold: r.bold }; }), 16, y0 + j, "#aaa"); });
    }
    if (fun) {
        var f = fun.textContent;
        TERM.text(Math.max(1, ((W - f.length) / 2) | 0), H - 2, f, "#666");
    }
};
GAME.lineLen = function (l) { var n = 0; l.forEach(function (r) { n += Array.from(r.t).length; }); return n; };

// ------------------------------------------------------------ the game

// the board of the Game of Thorns: the game draws it on a canvas of its
// own, a "#" for each cell 30 pixels apart and a frame round the cursor;
// here each cell is 4 columns by 2 rows (3 by 1 when there is little room)
GAME.board = function (canvas, x0, y0, cw, ch, dim) {
    var CELL = 30, n = Math.round(canvas.width / CELL), m = Math.round(canvas.height / CELL);
    canvas.ops.forEach(function (op) {
        if (op.op == "fillText") {
            var cx = Math.round(op.x / CELL - 0.5), cy = Math.round((op.y) / CELL - 0.5);
            if (cx < 0 || cy < 0 || cx >= n || cy >= m) return;   // still falling in from above
            var fg = TERM.color(op.color) || [255, 255, 255];
            var a = op.alpha == null ? 1 : op.alpha;
            if (a < 1) fg = TERM.mix([0, 0, 0], fg, a);
            if (dim) fg = TERM.mix([0, 0, 0], fg, 0.5);
            var bold = /bold/.test(op.font);
            for (var j = 0; j < ch; j++) for (var i = 0; i < cw; i++) {
                var X = x0 + cx * cw + i, Y = y0 + cy * ch + j;
                var inner = cw == 4 ? (i == 1 || i == 2) : (i == 1);
                if (inner) TERM.put(X, Y, "#", fg, null, false, bold);
            }
        } else if (op.op == "strokeRect") {
            var rx = Math.round(op.x / CELL), ry = Math.round(op.y / CELL);
            var col = dim ? "#333" : "#555";
            for (var jj = 0; jj < ch; jj++) for (var ii = 0; ii < cw; ii++) {
                var c = TERM.cells[(y0 + ry * ch + jj) * TERM.w + x0 + rx * cw + ii];
                if (c) c.bg = TERM.color(col);
            }
        }
    });
    return { w: n * cw, h: m * ch };
};

GAME.combat = function (node, x, y, w, h) {
    if (GAME.has(node, "hidden")) return;
    var dim = GAME.has(node, "inactive");
    var fade = function (c) { return dim ? TERM.mix([0, 0, 0], TERM.color(c) || [170, 170, 170], 0.5) : c; };
    var head = node.querySelector("p"), canvas = node.querySelector("canvas"), legend = node.querySelector("ul");
    var cy = y + 1;
    if (head) { var t = head.textContent; TERM.text(x + (((w - t.length) / 2) | 0), cy, t, fade("goldenrod")); cy += 2; }
    var rows = legend ? legend.children.length : 0;
    var big = h - (cy - y) >= 12 + rows + 1;
    var cw = big ? 4 : 3, chh = big ? 2 : 1;
    if (canvas) {
        var bw = Math.round(canvas.width / 30) * cw, bh = Math.round(canvas.height / 30) * chh;
        GAME.board(canvas, x + (((w - bw) / 2) | 0), cy, cw, chh, dim);
        cy += bh + 1;
    }
    if (legend) {
        var lw = 0;
        legend.children.forEach(function (li) { lw = Math.max(lw, li.textContent.length); });
        var lx = x + (((w - lw) / 2) | 0);
        legend.children.forEach(function (li) {
            if (cy >= y + h) return;
            var off = GAME.has(li, "inactive"), span = li.querySelector("span");
            var k = off ? 0.5 : 1;
            var col = function (c) { var v = TERM.mix([0, 0, 0], TERM.color(c) || [170, 170, 170], k); return dim ? TERM.mix([0, 0, 0], v, 0.5) : v; };
            TERM.put(lx, cy, "#", col(span ? span.style.color : "#aaa"), null, false, !off);
            TERM.text(lx + 2, cy, li.textContent.replace(/^#\s*/, ""), col("#aaa"));
            cy++;
        });
    }
};

// the story, the last of it at the bottom (the page scrolls it there), a
// blank line between paragraphs
GAME.log = function (node, x, y, w, h) {
    if (GAME.has(node, "hidden")) return;
    var all = [];
    node.children.forEach(function (p) {
        var ls = PANEL.lines(p, w, { fg: "#aaa" });
        if (!ls.length) return;
        ls.forEach(function (l) { all.push(l); });
        all.push([]);
    });
    while (all.length && !all[all.length - 1].length) all.pop();
    if (GAME.isDead()) { all.push([]); all.push([{ t: "R", fg: "#fff" }, { t: " starts a new game, ", fg: "#aaa" }, { t: "Ctrl+Q", fg: "#fff" }, { t: " quits.", fg: "#aaa" }]); }
    if (all.length > h) all = all.slice(all.length - h);
    all.forEach(function (l, j) { GAME.drawRuns(l, x, y + j, "#aaa", w); });
};

// "Tower floor 1. You have:" and a list, 1.2em above and below, 4ch in
GAME.status = function (node, x, y, w, h) {
    if (GAME.has(node, "hidden")) return;
    var cy = y, first = [];
    node.childNodes.forEach(function (n) { if (n.tagName != "UL") first.push(n); });
    var head = PANEL.lines({ nodeType: 1, tagName: "DIV", style: {}, childNodes: first }, w, { fg: "#aaa" });
    head.forEach(function (l) { if (cy < y + h) GAME.drawRuns(l, x, cy++, "#aaa", w); });
    var ul = node.querySelector("ul");
    if (!ul) return;
    cy++;
    ul.children.forEach(function (li) {
        PANEL.lines(li, w - 4, { fg: "#aaa" }).forEach(function (l, j) {
            if (cy >= y + h) return;
            if (!j) TERM.put(x + 2, cy, "•", "#aaa", null);
            GAME.drawRuns(l, x + 4, cy++, "#aaa", w - 4);
        });
    });
};

GAME.layout = function () {
    var intro = document.getElementById("intro");
    if (intro && intro.parentNode) { GAME.intro(intro); return; }
    var s = GAME.split();
    // the map, its display centred in the box as the page does
    var map = document.getElementById("map");
    if (map && !GAME.has(map, "hidden")) {
        var c = DOM.query(map, "canvas", true);
        if (c) {
            var left = parseInt(c.style.left, 10) || 0, top = parseInt(c.style.top, 10) || 0;
            TERM.blit(c, Math.max(0, left), Math.max(0, top), Math.max(0, -left), Math.max(0, -top),
                Math.min(c.cols, s.mw - Math.max(0, left)), Math.min(c.rows, s.mh - Math.max(0, top)));
            if (GAME.has(map, "inactive")) {
                for (var y = 0; y < s.mh; y++) for (var x = 0; x < s.mw; x++) {
                    var cell = TERM.cells[y * s.W + x];
                    cell.fg = TERM.mix([0, 0, 0], cell.fg, 0.5); cell.bg = TERM.mix([0, 0, 0], cell.bg, 0.5);
                }
            }
        }
    }
    var combat = document.getElementById("combat");
    if (combat) GAME.combat(combat, s.mw, 0, s.W - s.mw, s.mh);
    var log = document.getElementById("log");
    if (log) GAME.log(log, 1, s.mh + 1, s.mw - 2, s.H - s.mh - 1);
    var st = document.getElementById("status");
    if (st) GAME.status(st, s.mw + 1, s.mh + 1, s.W - s.mw - 2, s.H - s.mh - 1);
};

// pc.die() writes "Game over! Reload the page to try again..." to the story
GAME.isDead = function () {
    var log = document.getElementById("log");
    if (!log) return false;
    var p = log.lastElementChild;
    for (var i = 0; i < 2 && p; i++, p = p.previousElementSibling) if (/Game over! Reload the page/.test(p.textContent)) return true;
    return false;
};
GAME.onKey = function (e) {
    if ((e.key == "r" || e.key == "R") && GAME.isDead()) { MAIN.reload(); return false; }
};

GAME.snapshot = function () {
    var st = document.getElementById("status");
    var map = document.getElementById("map"), c = map && DOM.query(map, "canvas", true);
    return "status=" + JSON.stringify(st ? st.textContent.slice(0, 80) : "") + " display=" + (c ? c.cols + "x" + c.rows : "-") +
        " combat=" + !(GAME.has(document.getElementById("combat"), "inactive") || GAME.has(document.getElementById("combat"), "hidden")) + (GAME.isDead() ? " dead" : "");
};

// --seed N: the same tower every time (for the preview); the game seeds
// rot.js with the time as it starts, so N is put in its place
GAME.seed = null;
GAME.arg = function (a, b) {
    if (a == "--seed" && b) { GAME.seed = parseInt(b, 10); return true; }
    return false;
};
GAME.patchRot = function () {
    if (GAME.seed === null) return;
    var setSeed = ROT.RNG.setSeed;
    ROT.RNG.setSeed = function () { return setSeed.call(this, GAME.seed); };
    ROT.RNG.setSeed(GAME.seed);
};
