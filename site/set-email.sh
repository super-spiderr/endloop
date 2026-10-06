#!/bin/sh
# Fill in the support email everywhere before publishing:  sh site/set-email.sh you@example.com
set -e
[ -n "$1" ] || { echo "usage: sh site/set-email.sh <support-email>"; exit 1; }
cd "$(dirname "$0")"
for f in index.html privacy.html terms.html; do
  sed "s/{{SUPPORT_EMAIL}}/$1/g" "$f" > "$f.tmp" && cat "$f.tmp" > "$f" && rm "$f.tmp"
done
grep -l "{{SUPPORT_EMAIL}}" *.html && echo "still has placeholders" || echo "done"
