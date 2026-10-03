#!/usr/bin/env bash
# Download every generated asset listed in work/urls.tsv into stills/, clips/, voice/.
# Needs network access to d8j0ntlcm91z4.cloudfront.net (Higgsfield CDN).
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0
while IFS=$'\t' read -r id url; do
  case "$id" in
    STYLE) out="stills/style_ref.png" ;;
    S*)    out="stills/$id.png" ;;
    H*)    out="clips/$id.mp4" ;;
    L*)    out="voice/$id.wav" ;;
    *)     continue ;;
  esac
  [ -s "$out" ] && continue
  if curl -fsSL --retry 3 --retry-all-errors --max-time 120 "$url" -o "$out.part"; then
    mv "$out.part" "$out"; echo "ok   $out"
  else
    rm -f "$out.part"; echo "FAIL $out"; fail=1
  fi
done < work/urls.tsv
exit $fail
