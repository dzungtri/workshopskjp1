#!/bin/bash
# usage: ./shot.sh OUTDIR [from] [to]   — headless screenshots of slides (final step state)
OUT=${1:-/tmp/shots}; FROM=${2:-1}; TO=${3:-999}
mkdir -p "$OUT"
N=$(grep -c '<section class="slide' index.html); [ $TO -gt $N ] && TO=$N
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for i in $(seq $FROM $TO); do
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=1600,900 --virtual-time-budget=4000 \
    --screenshot="$OUT/s$(printf %02d $i).png" "file://$PWD/index.html?all#$i" >/dev/null 2>&1
done
ls "$OUT" | wc -l
