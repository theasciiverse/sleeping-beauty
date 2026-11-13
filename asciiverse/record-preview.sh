#!/bin/sh
# Records the catalog preview, asciiverse/sleeping-beauty.cast, at 100x30
# with hub's castrec.py: the title page, then --seed 4: out of the first
# room, through the doors, a potion, the stairs up, a sword, and a bat to
# fight in the Game of Thorns. Run from the repo root after building.
set -eu
CASTREC=${CASTREC:-../hub/tools/castrec.py}
state=$(mktemp -d)
trap 'rm -rf "$state"' EXIT
# one key per step, as typed
KEYS="k K U u k k k k K k k k k k k k y h h h h h h h h N n j j j j j j j b n j j j j j b h Enter n n l l l l l l n Enter y y k k k k k k J"
S="w4;kenter;w1.5"
for k in $KEYS; do
  case "$k" in Enter) S="$S;kenter;w0.8" ;; *) S="$S;k$k;w0.3" ;; esac
done
# attack it, and on the board take the long green run
S="$S;w1;k3;w3;kl;w0.6;kj;w0.6;kl;w1.5;kenter;w3;kj;w0.4;kj;w0.4;kh;w0.4;kh;w0.4;kh;w2"
XDG_STATE_HOME="$state" python3 "$CASTREC" "${1:-asciiverse/sleeping-beauty.cast}" . "$S" -- ./out/sleeping-beauty --seed 4
